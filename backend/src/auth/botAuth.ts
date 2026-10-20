import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../env";

// Hash both sides so timingSafeEqual gets equal-length buffers and the
// comparison time doesn't depend on how many leading bytes match.
function secretMatches(provided: string, expected: string): boolean {
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export function requireBotSecret(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!env.BOT_API_SECRET) {
    res.status(503).json({ error: "bot_disabled" });
    return;
  }
  const header = req.header("x-bot-secret");
  if (!header || !secretMatches(header, env.BOT_API_SECRET)) {
    res.status(401).json({ error: "invalid_bot_secret" });
    return;
  }
  next();
}
