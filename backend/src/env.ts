import { z } from "zod";

// Docker Compose passes unset env vars as empty strings (not undefined).
// Treat "" as absent for optional fields.
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema.optional());

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  BACKEND_PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 chars"),
  FRONTEND_URL: z.string().url(),
  DISCORD_CLIENT_ID: z.string().min(1),
  DISCORD_CLIENT_SECRET: z.string().min(1),
  DISCORD_REDIRECT_URI: z.string().url(),
  DISCORD_BOT_TOKEN: optional(z.string().min(1)),
  DISCORD_NOTIFICATION_CHANNEL_ID: optional(z.string().regex(/^\d+$/)),
  NOTIFICATION_DISCORD_USER_ID: optional(z.string().regex(/^\d+$/)),
  NOTIFICATION_TZ: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().default("America/Sao_Paulo"),
  ),
  NOTIFICATION_CRON: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().default("30 8 * * *"),
  ),
  BOT_API_SECRET: optional(z.string().min(16)),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
