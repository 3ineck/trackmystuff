import jwt from "jsonwebtoken";
import type { Response } from "express";
import { env } from "../env";

const COOKIE_NAME = "tms_session";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface SessionPayload {
  userId: string;
  // Must match User.sessionVersion; bumping it revokes every issued token.
  ver: number;
}

export function signSession(userId: string, ver: number): string {
  return jwt.sign({ userId, ver } satisfies SessionPayload, env.SESSION_SECRET, {
    algorithm: "HS256",
    expiresIn: "7d",
  });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, env.SESSION_SECRET, {
      algorithms: ["HS256"],
    }) as Partial<SessionPayload>;
    if (typeof decoded.userId !== "string" || typeof decoded.ver !== "number") return null;
    return { userId: decoded.userId, ver: decoded.ver };
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, userId: string, ver: number): void {
  const token = signSession(userId, ver);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: SEVEN_DAYS_MS,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export { COOKIE_NAME };
