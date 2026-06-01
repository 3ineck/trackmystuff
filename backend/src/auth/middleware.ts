import type { Request, Response, NextFunction } from "express";
import { COOKIE_NAME, verifySession } from "./session";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: "unauthenticated" });
    return;
  }
  const payload = verifySession(token);
  if (!payload) {
    res.status(401).json({ error: "unauthenticated" });
    return;
  }
  req.user = { id: payload.userId };
  next();
}
