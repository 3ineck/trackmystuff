import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../auth/middleware";

const nameSchema = z.string().trim().min(1).max(100);

const createSchema = z.object({ name: nameSchema });
const updateSchema = z.object({ name: nameSchema.optional() });

export const planGroupsRouter = Router();

planGroupsRouter.use(requireAuth);

planGroupsRouter.get("/", async (req, res) => {
  const groups = await prisma.planGroup.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "asc" },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });
  res.json(groups);
});

planGroupsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    return;
  }
  const group = await prisma.planGroup.create({
    data: { userId: req.user!.id, name: parsed.data.name },
    include: { items: true },
  });
  res.status(201).json(group);
});

planGroupsRouter.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    return;
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;

  const result = await prisma.planGroup.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data,
  });
  if (result.count === 0) {
    res.status(404).json({ error: "group_not_found" });
    return;
  }
  const updated = await prisma.planGroup.findUnique({
    where: { id: req.params.id },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });
  res.json(updated);
});

planGroupsRouter.delete("/:id", async (req, res) => {
  const result = await prisma.planGroup.deleteMany({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (result.count === 0) {
    res.status(404).json({ error: "group_not_found" });
    return;
  }
  res.status(204).send();
});
