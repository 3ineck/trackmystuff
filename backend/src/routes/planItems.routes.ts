import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../auth/middleware";

const titleSchema = z.string().trim().min(1).max(200);
const descriptionSchema = z.string().trim().max(2000).nullable();
const dateSchema = z.string().datetime().nullable();
const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable();

const createSchema = z.object({
  groupId: z.string().min(1),
  title: titleSchema,
  description: descriptionSchema.optional(),
  startsAt: dateSchema.optional(),
  endsAt: dateSchema.optional(),
  color: colorSchema.optional(),
});

const updateSchema = z.object({
  title: titleSchema.optional(),
  description: descriptionSchema.optional(),
  startsAt: dateSchema.optional(),
  endsAt: dateSchema.optional(),
  color: colorSchema.optional(),
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
  const { groupId, title, description, startsAt, endsAt, color } = parsed.data;

  if (startsAt && endsAt && new Date(startsAt) > new Date(endsAt)) {
    res.status(400).json({ error: "invalid_date_range" });
    return;
  }

  const group = await prisma.planGroup.findFirst({
    where: { id: groupId, userId: req.user!.id },
    select: { id: true },
  });
  if (!group) {
    res.status(404).json({ error: "group_not_found" });
    return;
  }

  const item = await prisma.planItem.create({
    data: {
      groupId,
      title,
      description: description ?? null,
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null,
      color: color ?? null,
    },
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
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.startsAt !== undefined) {
    data.startsAt = parsed.data.startsAt ? new Date(parsed.data.startsAt) : null;
  }
  if (parsed.data.endsAt !== undefined) {
    data.endsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : null;
  }
  if (parsed.data.color !== undefined) data.color = parsed.data.color;
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
