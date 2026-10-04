import axios from "axios";
import { LoginSchema, SignupSchema } from "@repo/validation/auth";
import type { Login, Signup } from "@repo/validation/auth";

export type AuthResponse = { message: string };
type ApiErrorResponse = { error?: string; message?: string };

const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1/auth",
  withCredentials: true,
});

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.name === "ZodError") {
    return error.message;
  }

  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return (
      error.response?.data?.error ??
      error.response?.data?.message ??
      (error.response
        ? fallback
        : "Can’t connect to the server. Check your connection and try again.")
    );
  }

  return fallback;
}

export async function loginRequest(data: Login): Promise<AuthResponse> {
  try {
    const validatedData = LoginSchema.parse(data);
    const response = await authApi.post<AuthResponse>("/login", validatedData);
    return response.data;
  } catch (error) {
    throw new Error(errorMessage(error, "Unable to sign in. Please try again."));
  }
}

export async function signupRequest(data: Signup): Promise<AuthResponse> {
  try {
    const validatedData = SignupSchema.parse(data);
    const response = await authApi.post<AuthResponse>("/signup", validatedData);
    return response.data;
  } catch (error) {
    throw new Error(errorMessage(error, "Unable to create your account. Please try again."));
  }
}
