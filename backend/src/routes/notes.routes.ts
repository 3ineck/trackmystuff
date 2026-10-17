import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../auth/middleware";

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().max(10000).optional().nullable(),
});

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().max(10000).nullable().optional(),
});

export const notesRouter = Router();

notesRouter.use(requireAuth);

notesRouter.get("/", async (req, res) => {
  const notes = await prisma.note.findMany({
    where: { userId: req.user!.id },
    orderBy: { updatedAt: "desc" },
  });
  res.json(notes);
});

notesRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    return;
  }
  const { title, content } = parsed.data;

  const note = await prisma.note.create({
    data: {
      userId: req.user!.id,
      title,
      content: content ?? null,
    },
  });
  res.status(201).json(note);
});

notesRouter.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    return;
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.content !== undefined) data.content = parsed.data.content;

  const result = await prisma.note.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data,
  });
  if (result.count === 0) {
    res.status(404).json({ error: "note_not_found" });
    return;
  }
  const updated = await prisma.note.findUnique({ where: { id: req.params.id } });
  res.json(updated);
});

notesRouter.delete("/:id", async (req, res) => {
  const result = await prisma.note.deleteMany({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (result.count === 0) {
    res.status(404).json({ error: "note_not_found" });
    return;
  }
  res.status(204).send();
});
