import { AsyncLocalStorage } from "node:async_hooks";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/db";

export const AUTH_COOKIE = "token";
export const JWT_SECRET = "this_is_secret";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type AppContext = {
  user: AuthUser | null;
};

const storage = new AsyncLocalStorage<AppContext>();

export function getContext(): AppContext {
  const ctx = storage.getStore();
  if (!ctx) {
    throw new Error("Request context is missing");
  }
  return ctx;
}

export function signAuthToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

function readCookie(
  header: string | undefined,
  name: string
): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    if (key !== name) continue;
    try {
      return decodeURIComponent(part.slice(eq + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}

async function loadUser(req: Request): Promise<AuthUser | null> {
  const token = readCookie(req.headers.cookie, AUTH_COOKIE);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (typeof payload === "string" || typeof payload.userId !== "string") {
      return null;
    }
    return prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true },
    });
  } catch {
    return null;
  }
}

export function contextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  loadUser(req)
    .then((user) => {
      storage.run({ user }, () => next());
    })
    .catch(next);
}
