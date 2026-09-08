import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../auth/middleware";

const titleSchema = z.string().trim().min(1).max(200);

const createSchema = z.object({
  groupId: z.string().min(1),
  title: titleSchema,
});

const updateSchema = z.object({
  title: titleSchema.optional(),
  done: z.boolean().optional(),
});

export const planItemsRouter = Router();

planItemsRouter.use(requireAuth);

planItemsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    return;
  }
  const { groupId, title } = parsed.data;

  const group = await prisma.planGroup.findFirst({
    where: { id: groupId, userId: req.user!.id },
    select: { id: true },
  });
  if (!group) {
    res.status(404).json({ error: "group_not_found" });
    return;
  }

  const item = await prisma.planItem.create({
    data: { groupId, title },
  });
  res.status(201).json(item);
});

planItemsRouter.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    return;
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.done !== undefined) data.done = parsed.data.done;

  const result = await prisma.planItem.updateMany({
    where: { id: req.params.id, group: { userId: req.user!.id } },
    data,
  });
  if (result.count === 0) {
    res.status(404).json({ error: "item_not_found" });
    return;
  }
  const updated = await prisma.planItem.findUnique({ where: { id: req.params.id } });
  res.json(updated);
});

planItemsRouter.delete("/:id", async (req, res) => {
  const result = await prisma.planItem.deleteMany({
    where: { id: req.params.id, group: { userId: req.user!.id } },
  });
  if (result.count === 0) {
    res.status(404).json({ error: "item_not_found" });
    return;
  }
  res.status(204).send();
});
