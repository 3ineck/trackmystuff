// Express 4 ignores promises returned by handlers, so a rejected async route
// becomes an unhandledRejection and Node exits. This forwards rejections to
// next(err) so the error middleware in server.ts answers with a 500 instead.
// Same approach as the `express-async-errors` package; Express 5 does this
// natively, so delete this file when upgrading.
import type { NextFunction, Request, Response } from "express";

type Handler = (req: Request, res: Response, next: NextFunction) => unknown;

const Layer: { prototype: { handle: Handler; handle_request: Handler } } = require("express/lib/router/layer");

Layer.prototype.handle_request = function handleRequest(req, res, next) {
  const fn = this.handle;
  // Error-handling middleware (4 args) is skipped on the normal path, as in Express.
  if (fn.length > 3) {
    next();
    return;
  }
  try {
    const ret = fn(req, res, next);
    if (ret instanceof Promise) ret.catch(next);
  } catch (err) {
    next(err);
  }
};
