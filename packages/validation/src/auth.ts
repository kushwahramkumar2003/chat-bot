import { z } from "zod";

export const SignupSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  name: z.string().trim().min(1, "Enter your name."),
});

export type Signup = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export type Login = z.infer<typeof LoginSchema>;
