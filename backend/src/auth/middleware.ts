import type { Request, Response, NextFunction } from "express";
import { isDiscordIdAllowed } from "../env";
import { prisma } from "../prisma";
import { COOKIE_NAME, verifySession } from "./session";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; discordId: string };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    const payload = token ? verifySession(token) : null;
    if (!payload) {
      res.status(401).json({ error: "unauthenticated" });
      return;
    }
    // Re-check on every request so logout (version bump) and allowlist
    // changes take effect immediately, not when the 7-day JWT expires.
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, discordId: true, sessionVersion: true },
    });
    if (!user || user.sessionVersion !== payload.ver || !isDiscordIdAllowed(user.discordId)) {
      res.status(401).json({ error: "unauthenticated" });
      return;
    }
    req.user = { id: user.id, discordId: user.discordId };
    next();
  } catch (err) {
    next(err);
  }
}
