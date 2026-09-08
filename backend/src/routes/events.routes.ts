import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../auth/middleware";

const RECURRENCE_VALUES = ["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;
const MAX_DURATION_MINUTES = 60 * 24 * 30;

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  startsAt: z.string().datetime(),
  durationMinutes: z.number().int().min(1).max(MAX_DURATION_MINUTES),
  recurrence: z.enum(RECURRENCE_VALUES).optional(),
  recurrenceEndsAt: z.string().datetime().optional().nullable(),
});

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  startsAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(1).max(MAX_DURATION_MINUTES).optional(),
  recurrence: z.enum(RECURRENCE_VALUES).optional(),
  recurrenceEndsAt: z.string().datetime().nullable().optional(),
});

export const eventsRouter = Router();

eventsRouter.use(requireAuth);

eventsRouter.get("/", async (req, res) => {
  const events = await prisma.calendarEvent.findMany({
    where: { userId: req.user!.id },
    orderBy: { startsAt: "asc" },
  });
  res.json(events);
});

eventsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    return;
  }
  const { title, description, startsAt, durationMinutes, recurrence, recurrenceEndsAt } = parsed.data;

  const event = await prisma.calendarEvent.create({
    data: {
      userId: req.user!.id,
      title,
      description: description ?? null,
      startsAt: new Date(startsAt),
      durationMinutes,
      recurrence: recurrence ?? "NONE",
      recurrenceEndsAt: recurrenceEndsAt ? new Date(recurrenceEndsAt) : null,
    },
  });
  res.status(201).json(event);
});

eventsRouter.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    return;
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.startsAt !== undefined) data.startsAt = new Date(parsed.data.startsAt);
  if (parsed.data.durationMinutes !== undefined) data.durationMinutes = parsed.data.durationMinutes;
  if (parsed.data.recurrence !== undefined) data.recurrence = parsed.data.recurrence;
  if (parsed.data.recurrenceEndsAt !== undefined) {
    data.recurrenceEndsAt =
      parsed.data.recurrenceEndsAt === null ? null : new Date(parsed.data.recurrenceEndsAt);
  }

  const result = await prisma.calendarEvent.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data,
  });
  if (result.count === 0) {
    res.status(404).json({ error: "event_not_found" });
    return;
  }
  const updated = await prisma.calendarEvent.findUnique({ where: { id: req.params.id } });
  res.json(updated);
});

eventsRouter.delete("/:id", async (req, res) => {
  const result = await prisma.calendarEvent.deleteMany({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (result.count === 0) {
    res.status(404).json({ error: "event_not_found" });
    return;
  }
  res.status(204).send();
});
