import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../auth/middleware";

const createTagSchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "color must be a hex string like #3b82f6"),
});

export const tagsRouter = Router();

tagsRouter.use(requireAuth);

tagsRouter.get("/", async (req, res) => {
  const tags = await prisma.tag.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "asc" },
  });
  res.json(tags);
});

tagsRouter.post("/", async (req, res) => {
  const parsed = createTagSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    return;
  }

  try {
    const tag = await prisma.tag.create({
      data: {
        userId: req.user!.id,
        name: parsed.data.name,
        color: parsed.data.color,
      },
    });
    res.status(201).json(tag);
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      res.status(409).json({ error: "tag_name_taken" });
      return;
    }
    throw err;
  }
});

tagsRouter.get("/:id/stats", async (req, res) => {
  const tag = await prisma.tag.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!tag) {
    res.status(404).json({ error: "tag_not_found" });
    return;
  }

  const agg = await prisma.trackingSession.aggregate({
    where: {
      userId: req.user!.id,
      tagId: tag.id,
      endedAt: { not: null },
    },
    _min: { startedAt: true },
    _max: { startedAt: true },
    _sum: { durationSec: true },
    _count: { _all: true },
  });

  res.json({
    firstSessionAt: agg._min.startedAt,
    lastSessionAt: agg._max.startedAt,
    totalDurationSec: agg._sum.durationSec ?? 0,
    sessionCount: agg._count._all,
  });
});

tagsRouter.delete("/:id", async (req, res) => {
  const result = await prisma.tag.deleteMany({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (result.count === 0) {
    res.status(404).json({ error: "tag_not_found" });
    return;
  }
  res.status(204).send();
});
