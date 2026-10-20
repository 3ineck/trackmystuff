import { Router } from "express";
import crypto from "crypto";
import { env, isDiscordIdAllowed } from "../env";
import { prisma } from "../prisma";
import {
  buildAuthorizeUrl,
  discordAvatarUrl,
  exchangeCodeForToken,
  fetchDiscordUser,
} from "../auth/discord";
import {
  COOKIE_NAME,
  clearSessionCookie,
  setSessionCookie,
  verifySession,
} from "../auth/session";
import { requireAuth } from "../auth/middleware";

const STATE_COOKIE = "tms_oauth_state";
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

export const authRouter = Router();

authRouter.get("/discord", (_req, res) => {
  const state = crypto.randomBytes(24).toString("hex");
  res.cookie(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: STATE_MAX_AGE_MS,
    signed: true,
    path: "/",
  });
  res.redirect(buildAuthorizeUrl(state));
});

authRouter.get("/callback", async (req, res) => {
  try {
    const code = typeof req.query.code === "string" ? req.query.code : null;
    const state = typeof req.query.state === "string" ? req.query.state : null;
    const expectedState = req.signedCookies?.[STATE_COOKIE];

    if (!code || !state || !expectedState || state !== expectedState) {
      res.status(400).send("Invalid OAuth callback");
      return;
    }
    res.clearCookie(STATE_COOKIE, { path: "/" });

    const token = await exchangeCodeForToken(code);
    const discordUser = await fetchDiscordUser(token.access_token);

    if (!isDiscordIdAllowed(discordUser.id)) {
      console.warn(`Login denied for Discord user ${discordUser.id}`);
      res.status(403).send("Access denied");
      return;
    }

    const user = await prisma.user.upsert({
      where: { discordId: discordUser.id },
      update: {
        username: discordUser.global_name || discordUser.username,
        avatarUrl: discordAvatarUrl(discordUser),
      },
      create: {
        discordId: discordUser.id,
        username: discordUser.global_name || discordUser.username,
        avatarUrl: discordAvatarUrl(discordUser),
      },
    });

    setSessionCookie(res, user.id, user.sessionVersion);
    res.redirect(env.FRONTEND_URL);
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send("Authentication failed");
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, username: true, avatarUrl: true },
  });
  if (!user) {
    clearSessionCookie(res);
    res.status(401).json({ error: "unauthenticated" });
    return;
  }
  res.json(user);
});

authRouter.post("/logout", async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  const payload = token ? verifySession(token) : null;
  if (payload) {
    // Revokes this token and any other copy of it (all devices).
    await prisma.user.updateMany({
      where: { id: payload.userId, sessionVersion: payload.ver },
      data: { sessionVersion: { increment: 1 } },
    });
  }
  clearSessionCookie(res);
  res.json({ ok: true });
});
