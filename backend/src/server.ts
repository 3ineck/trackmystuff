import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { env } from "./env";
import { authRouter } from "./routes/auth.routes";
import { tagsRouter } from "./routes/tags.routes";
import { sessionsRouter } from "./routes/sessions.routes";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser(env.SESSION_SECRET));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRouter);
app.use("/tags", tagsRouter);
app.use("/sessions", sessionsRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "internal_error" });
});

app.listen(env.BACKEND_PORT, () => {
  console.log(`Backend listening on :${env.BACKEND_PORT}`);
});
