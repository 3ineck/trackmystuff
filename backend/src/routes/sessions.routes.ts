import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../auth/middleware";

const startSchema = z.object({
  tagId: z.string().min(1),
});

const manualSchema = z.object({
  tagId: z.string().min(1),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  description: z.string().max(2000).optional().nullable(),
});

const updateSchema = z.object({
  description: z.string().max(2000).optional().nullable(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
});

const listQuerySchema = z.object({
  tagId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
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
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_query", details: parsed.error.flatten() });
    return;
  }
  const { tagId, page, limit } = parsed.data;

  const where = {
    userId: req.user!.id,
    endedAt: { not: null },
    ...(tagId ? { tagId } : {}),
  };

  if (page !== undefined) {
    const pageSize = limit ?? 15;
    const [items, total] = await prisma.$transaction([
      prisma.trackingSession.findMany({
        where,
        orderBy: { startedAt: "desc" },
        include: { tag: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.trackingSession.count({ where }),
    ]);
    res.json({ items, total, page, pageSize });
    return;
  }

  const sessions = await prisma.trackingSession.findMany({
    where,
    orderBy: { startedAt: "desc" },
    include: { tag: true },
    take: limit ?? 50,
  });
  res.json(sessions);
});

sessionsRouter.post("/", async (req, res) => {
  const parsed = manualSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    return;
  }
  const { tagId, description } = parsed.data;
  const startedAt = new Date(parsed.data.startedAt);
  const endedAt = new Date(parsed.data.endedAt);
  if (endedAt.getTime() <= startedAt.getTime()) {
    res.status(400).json({ error: "invalid_time_range" });
    return;
  }

  const tag = await prisma.tag.findFirst({
    where: { id: tagId, userId: req.user!.id },
  });
  if (!tag) {
    res.status(404).json({ error: "tag_not_found" });
    return;
  }

  const durationSec = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000);
  const session = await prisma.trackingSession.create({
    data: {
      userId: req.user!.id,
      tagId,
      startedAt,
      endedAt,
      durationSec,
      description: description ?? null,
    },
    include: { tag: true },
  });
  res.status(201).json(session);
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

sessionsRouter.delete("/:id", async (req, res) => {
  const result = await prisma.trackingSession.deleteMany({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (result.count === 0) {
    res.status(404).json({ error: "session_not_found" });
    return;
  }
  res.status(204).send();
});

sessionsRouter.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    return;
  }

  const existing = await prisma.trackingSession.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!existing) {
    res.status(404).json({ error: "session_not_found" });
    return;
  }

  const data: {
    description?: string | null;
    startedAt?: Date;
    endedAt?: Date;
    durationSec?: number;
  } = {};

  if (parsed.data.description !== undefined) {
    data.description = parsed.data.description ?? null;
  }

  const startedAt = parsed.data.startedAt ? new Date(parsed.data.startedAt) : undefined;
  const endedAt = parsed.data.endedAt ? new Date(parsed.data.endedAt) : undefined;

  if (startedAt || endedAt) {
    if (!existing.endedAt) {
      res.status(409).json({ error: "session_active" });
      return;
    }
    const nextStart = startedAt ?? existing.startedAt;
    const nextEnd = endedAt ?? existing.endedAt;
    if (nextEnd.getTime() <= nextStart.getTime()) {
      res.status(400).json({ error: "invalid_time_range" });
      return;
    }
    if (startedAt) data.startedAt = startedAt;
    if (endedAt) data.endedAt = endedAt;
    data.durationSec = Math.round((nextEnd.getTime() - nextStart.getTime()) / 1000);
  }

  const updated = await prisma.trackingSession.update({
    where: { id: existing.id },
    data,
    include: { tag: true },
  });
  res.json(updated);
});
