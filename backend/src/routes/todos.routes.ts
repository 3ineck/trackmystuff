import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../auth/middleware";

const viewSchema = z.object({
  view: z.enum(["current", "archived", "favorited"]).optional(),
});

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  dueHasTime: z.boolean().optional(),
  favorited: z.boolean().optional(),
});

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  dueHasTime: z.boolean().optional(),
  favorited: z.boolean().optional(),
  archived: z.boolean().optional(),
});

export const todosRouter = Router();

todosRouter.use(requireAuth);

todosRouter.get("/", async (req, res) => {
  const parsed = viewSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_query", details: parsed.error.flatten() });
    return;
  }
  const view = parsed.data.view ?? "current";

  if (view === "archived") {
    const todos = await prisma.todo.findMany({
      where: { userId: req.user!.id, archivedAt: { not: null } },
      orderBy: { archivedAt: "desc" },
    });
    res.json(todos);
    return;
  }

  if (view === "favorited") {
    const todos = await prisma.todo.findMany({
      where: { userId: req.user!.id, favorited: true, archivedAt: null },
      orderBy: { createdAt: "desc" },
    });
    res.json(todos);
    return;
  }

  const todos = await prisma.todo.findMany({
    where: { userId: req.user!.id, archivedAt: null },
    orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
  });
  res.json(todos);
});

todosRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    return;
  }
  const { title, description, dueAt, dueHasTime, favorited } = parsed.data;

  const todo = await prisma.todo.create({
    data: {
      userId: req.user!.id,
      title,
      description: description ?? null,
      dueAt: dueAt ? new Date(dueAt) : null,
      dueHasTime: dueHasTime ?? false,
      favorited: favorited ?? false,
    },
  });
  res.status(201).json(todo);
});

todosRouter.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    return;
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.dueAt !== undefined) {
    data.dueAt = parsed.data.dueAt === null ? null : new Date(parsed.data.dueAt);
  }
  if (parsed.data.dueHasTime !== undefined) data.dueHasTime = parsed.data.dueHasTime;
  if (parsed.data.favorited !== undefined) data.favorited = parsed.data.favorited;
  if (parsed.data.archived !== undefined) {
    data.archivedAt = parsed.data.archived ? new Date() : null;
  }

  const result = await prisma.todo.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data,
  });
  if (result.count === 0) {
    res.status(404).json({ error: "todo_not_found" });
    return;
  }
  const updated = await prisma.todo.findUnique({ where: { id: req.params.id } });
  res.json(updated);
});

todosRouter.delete("/:id", async (req, res) => {
  const result = await prisma.todo.deleteMany({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (result.count === 0) {
    res.status(404).json({ error: "todo_not_found" });
    return;
  }
  res.status(204).send();
});
