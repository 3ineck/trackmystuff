import type { NextFunction, Request, Response } from "express";
import { env } from "../env";

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
  if (header !== env.BOT_API_SECRET) {
    res.status(401).json({ error: "invalid_bot_secret" });
    return;
  }
  next();
}
