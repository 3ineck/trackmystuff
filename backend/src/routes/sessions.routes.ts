import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../auth/middleware";

const startSchema = z.object({
  tagId: z.string().min(1),
});

const updateSchema = z.object({
  description: z.string().max(2000).optional(),
});

export const sessionsRouter = Router();

sessionsRouter.use(requireAuth);

sessionsRouter.get("/active", async (req, res) => {
  const active = await prisma.trackingSession.findFirst({
    where: { userId: req.user!.id, endedAt: null },
    include: { tag: true },
  });
  res.json(active);
});

sessionsRouter.get("/", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const sessions = await prisma.trackingSession.findMany({
    where: { userId: req.user!.id, endedAt: { not: null } },
    orderBy: { startedAt: "desc" },
    include: { tag: true },
    take: limit,
  });
  res.json(sessions);
});

sessionsRouter.post("/start", async (req, res) => {
  const parsed = startSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    return;
  }

  const tag = await prisma.tag.findFirst({
    where: { id: parsed.data.tagId, userId: req.user!.id },
  });
  if (!tag) {
    res.status(404).json({ error: "tag_not_found" });
    return;
  }

  const existing = await prisma.trackingSession.findFirst({
    where: { userId: req.user!.id, endedAt: null },
  });
  if (existing) {
    res.status(409).json({ error: "session_already_active", session: existing });
    return;
  }

  const session = await prisma.trackingSession.create({
    data: {
      userId: req.user!.id,
      tagId: tag.id,
      startedAt: new Date(),
    },
    include: { tag: true },
  });
  res.status(201).json(session);
});

sessionsRouter.post("/:id/stop", async (req, res) => {
  const session = await prisma.trackingSession.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!session) {
    res.status(404).json({ error: "session_not_found" });
    return;
  }
  if (session.endedAt) {
    res.status(409).json({ error: "session_already_stopped", session });
    return;
  }
  const endedAt = new Date();
  const durationSec = Math.max(
    0,
    Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000)
  );
  const updated = await prisma.trackingSession.update({
    where: { id: session.id },
    data: { endedAt, durationSec },
    include: { tag: true },
  });
  res.json(updated);
});

sessionsRouter.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    return;
  }

  const result = await prisma.trackingSession.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: { description: parsed.data.description ?? null },
  });
  if (result.count === 0) {
    res.status(404).json({ error: "session_not_found" });
    return;
  }
  const updated = await prisma.trackingSession.findUnique({
    where: { id: req.params.id },
    include: { tag: true },
  });
  res.json(updated);
});
