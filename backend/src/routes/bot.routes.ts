import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireBotSecret } from "../auth/botAuth";

const DEFAULT_PLAN_COLOR = "#8b5cf6"; // matches DEFAULT_PLAN_ITEM_COLOR on the frontend

const discordIdSchema = z.string().regex(/^\d+$/);

async function findUserId(discordId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { discordId },
    select: { id: true },
  });
  return user?.id ?? null;
}

// ---------- Todos ----------

const createTodoSchema = z.object({
  discordId: discordIdSchema,
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).nullish(),
  dueAt: z.string().datetime().nullish(),
});

// ---------- Plan groups ----------

const listGroupsSchema = z.object({ discordId: discordIdSchema });
const createGroupSchema = z.object({
  discordId: discordIdSchema,
  name: z.string().trim().min(1).max(100),
});

// ---------- Plan items ----------

const createPlanItemSchema = z.object({
  discordId: discordIdSchema,
  groupId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).nullish(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullish(),
});

export const botRouter = Router();

botRouter.use(requireBotSecret);

botRouter.post("/todos", async (req, res) => {
  const parsed = createTodoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    return;
  }
  const { discordId, title, description, dueAt } = parsed.data;

  const userId = await findUserId(discordId);
  if (!userId) {
    res.status(404).json({ error: "user_not_registered" });
    return;
  }

  const todo = await prisma.todo.create({
    data: {
      userId,
      title,
      description: description ?? null,
      dueAt: dueAt ? new Date(dueAt) : null,
      dueHasTime: false,
    },
    select: { id: true, title: true, dueAt: true },
  });
  res.status(201).json(todo);
});

botRouter.get("/plan-groups", async (req, res) => {
  const parsed = listGroupsSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_query", details: parsed.error.flatten() });
    return;
  }
  const userId = await findUserId(parsed.data.discordId);
  if (!userId) {
    res.status(404).json({ error: "user_not_registered" });
    return;
  }
  const groups = await prisma.planGroup.findMany({
    where: { userId },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(groups);
});

botRouter.post("/plan-groups", async (req, res) => {
  const parsed = createGroupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    return;
  }
  const userId = await findUserId(parsed.data.discordId);
  if (!userId) {
    res.status(404).json({ error: "user_not_registered" });
    return;
  }
  const group = await prisma.planGroup.create({
    data: { userId, name: parsed.data.name },
    select: { id: true, name: true },
  });
  res.status(201).json(group);
});

botRouter.post("/plan-items", async (req, res) => {
  const parsed = createPlanItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() });
    return;
  }
  const { discordId, groupId, title, description, date } = parsed.data;

  const userId = await findUserId(discordId);
  if (!userId) {
    res.status(404).json({ error: "user_not_registered" });
    return;
  }

  const group = await prisma.planGroup.findFirst({
    where: { id: groupId, userId },
    select: { id: true, name: true },
  });
  if (!group) {
    res.status(404).json({ error: "group_not_found" });
    return;
  }

  const dayIso = date ? new Date(`${date}T00:00:00.000Z`) : null;
  const item = await prisma.planItem.create({
    data: {
      groupId: group.id,
      title,
      description: description ?? null,
      startsAt: dayIso,
      endsAt: dayIso,
      color: dayIso ? DEFAULT_PLAN_COLOR : null,
    },
    select: { id: true, title: true, startsAt: true, endsAt: true },
  });
  res.status(201).json({ ...item, groupName: group.name });
});
