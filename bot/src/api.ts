import { env } from "./env";

export interface CreateTodoInput {
  discordId: string;
  title: string;
  description?: string | null;
  dueAt?: string | null;
}

export interface CreatedTodo {
  id: string;
  title: string;
  dueAt: string | null;
}

export interface PlanGroupSummary {
  id: string;
  name: string;
}

export interface CreatePlanGroupInput {
  discordId: string;
  name: string;
}

export interface CreatePlanItemInput {
  discordId: string;
  groupId: string;
  title: string;
  description?: string | null;
  date?: string | null;
}

export interface CreatedPlanItem {
  id: string;
  title: string;
  startsAt: string | null;
  endsAt: string | null;
  groupName: string;
}

export class BackendError extends Error {
  status: number;
  code?: string;
  constructor(status: number, code: string | undefined, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${env.BACKEND_URL}${path}`, {
    method: init.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Bot-Secret": env.BOT_API_SECRET,
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!res.ok) {
    let code: string | undefined;
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      code = body.error;
      if (body.error) message = body.error;
    } catch {
      // non-JSON error body — keep default message
    }
    throw new BackendError(res.status, code, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function createTodo(input: CreateTodoInput): Promise<CreatedTodo> {
  return request<CreatedTodo>("/bot/todos", { method: "POST", body: input });
}

export function listPlanGroups(discordId: string): Promise<PlanGroupSummary[]> {
  return request<PlanGroupSummary[]>(
    `/bot/plan-groups?discordId=${encodeURIComponent(discordId)}`,
  );
}

export function createPlanGroup(
  input: CreatePlanGroupInput,
): Promise<PlanGroupSummary> {
  return request<PlanGroupSummary>("/bot/plan-groups", {
    method: "POST",
    body: input,
  });
}

export function createPlanItem(
  input: CreatePlanItemInput,
): Promise<CreatedPlanItem> {
  return request<CreatedPlanItem>("/bot/plan-items", {
    method: "POST",
    body: input,
  });
}
