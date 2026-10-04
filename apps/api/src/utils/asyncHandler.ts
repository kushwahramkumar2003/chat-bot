import type { RequestHandler, Request, Response, NextFunction } from "express";
import { getContext, type AppContext } from "../middleware/context";

export const asyncHandler = (
  fn: (
    ctx: AppContext,
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler => {
  return (req, res, next) => {
    fn(getContext(), req, res, next).catch(next);
  };
};
