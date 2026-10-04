import type { CookieOptions, Request, Response } from "express";
import { LoginSchema, SignupSchema } from "../types/auth";
import bcrypt from "bcryptjs";
import { prisma } from "../utils/db";
import { AUTH_COOKIE, signAuthToken, type AppContext } from "../middleware/context";

const cookieConfig: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

export const signup = async (ctx: AppContext, req: Request, res: Response) => {
  const input = SignupSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: input.error.issues[0]?.message ?? "Invalid signup details." });
    return;
  }

  const pwdHash = await bcrypt.hash(input.data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: input.data.email,
      password: pwdHash,
      name: input.data.name,
    },
  });

  if (!user) {
    throw new Error("Error while creating new user");
  }

  res.status(200).json({
    message: "User created successfully",
  });
};

export const login = async (ctx: AppContext, req: Request, res: Response) => {
  const payload = LoginSchema.safeParse(req.body);

  if (!payload.success) {
    res.status(400).json({ error: payload.error.issues[0]?.message ?? "Invalid login details." });
    return;
  }

  const user = await prisma.user.findFirst({
    where: {
      email: payload.data.email,
    },
  });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }
  const match = await bcrypt.compare(payload.data.password, user.password);
  if (!match) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const token = signAuthToken(user.id);
  res.cookie(AUTH_COOKIE, token, cookieConfig);
  res.status(200).json({ message: "Logged in" });
};
