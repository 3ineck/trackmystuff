import jwt from "jsonwebtoken";
import type { Response } from "express";
import { env } from "../env";

const COOKIE_NAME = "tms_session";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface SessionPayload {
  userId: string;
}

export function signSession(userId: string): string {
  return jwt.sign({ userId } satisfies SessionPayload, env.SESSION_SECRET, {
    expiresIn: "7d",
  });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, env.SESSION_SECRET) as SessionPayload;
    if (!decoded.userId) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, userId: string): void {
  const token = signSession(userId);
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
