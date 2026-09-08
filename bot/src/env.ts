import { z } from "zod";

// Docker Compose passes unset env vars as empty strings. Treat "" as absent
// so optional fields fall through to their default.
const nonEmpty = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema);

const schema = z.object({
  DISCORD_BOT_TOKEN: z.string().min(1),
  DISCORD_CLIENT_ID: z.string().regex(/^\d+$/),
  DISCORD_GUILD_ID: z.string().regex(/^\d+$/),
  BOT_API_SECRET: z.string().min(16),
  BACKEND_URL: nonEmpty(z.string().url().default("http://backend:7000")),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;
