"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { LoginSchema, type Login } from "@repo/validation/auth";
import { loginRequest } from "../../../services/api";

type FieldErrors = Partial<Record<keyof Login, string>>;

const inputClass =
  "mt-2 h-12 w-full rounded-lg border border-[#dfddd6] bg-[#fffefa] px-3.5 text-sm text-[#26251f] outline-none transition placeholder:text-[#aaa79f] focus:border-[#a99a88] focus:ring-2 focus:ring-[#b97550]/15";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitHandler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const result = LoginSchema.safeParse({ email, password });
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if ((field === "email" || field === "password") && !nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await loginRequest(result.data);
      router.replace("/chat");
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#fffefa] px-5 py-8 text-[#26251f] sm:px-8 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link
          className="inline-flex items-center gap-2.5 rounded-md text-[17px] font-semibold tracking-[-.04em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9a694b]"
          href="/chat"
        >
          <span
            aria-hidden="true"
            className="text-[23px] leading-none text-[#b97550]"
          >
            ✳
          </span>
          Morrow
        </Link>
        <Link
          className="rounded-md px-3 py-2 text-sm text-[#68675f] transition hover:bg-[#f5f4ef] hover:text-[#26251f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a694b]"
          href="/signup"
        >
          Create account
        </Link>
      </div>

      <div className="mx-auto grid min-h-[calc(100dvh-112px)] w-full max-w-5xl items-center gap-12 py-10 md:grid-cols-[1fr_420px] md:gap-20">
        <section className="hidden md:block">
          <div
            aria-hidden="true"
            className="mb-7 grid size-14 place-items-center rounded-2xl border border-[#eee4dc] bg-[#faf5ef] text-3xl text-[#b97550]"
          >
            ✳
          </div>
          <p className="mb-3 text-[11px] uppercase tracking-[.12em] text-[#8a8178]">
            A little space to think
          </p>
          <h1 className="max-w-md font-serif text-5xl font-normal leading-[1.08] tracking-[-.045em]">
            Good ideas start with a conversation.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-[#77766f]">
            Sign in to pick up where you left off, or start something new with
            Morrow.
          </p>
        </section>

        <section className="mx-auto w-full max-w-[420px]">
          <div className="mb-8 md:hidden">
            <div
              aria-hidden="true"
              className="mb-5 grid size-12 place-items-center rounded-2xl border border-[#eee4dc] bg-[#faf5ef] text-2xl text-[#b97550]"
            >
              ✳
            </div>
            <p className="mb-2 text-[11px] uppercase tracking-[.11em] text-[#8a8178]">
              Welcome back
            </p>
            <h1 className="font-serif text-4xl font-normal tracking-[-.045em]">
              Let’s pick up the conversation.
            </h1>
          </div>

          <div className="rounded-2xl border border-[#e9e7e1] bg-white p-6 shadow-[0_16px_55px_-38px_rgba(38,37,31,0.28)] sm:p-8">
            <div className="mb-7 hidden md:block">
              <p className="mb-2 text-[11px] uppercase tracking-[.11em] text-[#8a8178]">
                Welcome back
              </p>
              <h2 className="font-serif text-[32px] font-normal tracking-[-.04em]">
                Sign in to Morrow
              </h2>
              <p className="mt-2 text-sm text-[#77766f]">
                Your next good conversation is waiting.
              </p>
            </div>

            <form
              className="space-y-5"
              noValidate
              onSubmit={(event) => void submitHandler(event)}
            >
              <div>
                <label
                  className="text-[13px] font-medium text-[#3c3b35]"
                  htmlFor="email"
                >
                  Email address
                </label>
                <input
                  autoComplete="email"
                  className={`${inputClass} ${fieldErrors.email ? "border-[#bd6b55] focus:border-[#bd6b55] focus:ring-[#bd6b55]/15" : ""}`}
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  aria-describedby={
                    fieldErrors.email ? "email-error" : undefined
                  }
                  aria-invalid={Boolean(fieldErrors.email)}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      email: undefined,
                    }));
                  }}
                  placeholder="you@example.com"
                  required
                />
                {fieldErrors.email && (
                  <p className="mt-1.5 text-xs text-[#a34836]" id="email-error">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="text-[13px] font-medium text-[#3c3b35]"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    autoComplete="current-password"
                    className={`${inputClass} pr-20 ${fieldErrors.password ? "border-[#bd6b55] focus:border-[#bd6b55] focus:ring-[#bd6b55]/15" : ""}`}
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    aria-describedby={
                      fieldErrors.password ? "password-error" : undefined
                    }
                    aria-invalid={Boolean(fieldErrors.password)}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setFieldErrors((current) => ({
                        ...current,
                        password: undefined,
                      }));
                    }}
                    placeholder="At least 6 characters"
                    required
                  />
                  <button
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-2 top-3 inline-flex h-9 min-w-14 items-center justify-center rounded-md px-2 text-xs text-[#77766f] hover:bg-[#f5f4ef] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#9a694b]"
                    onClick={() => setShowPassword((visible) => !visible)}
                    type="button"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p
                    className="mt-1.5 text-xs text-[#a34836]"
                    id="password-error"
                  >
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {formError && (
                <div
                  className="rounded-lg border border-[#e8cbc0] bg-[#fcf5f1] px-3.5 py-3 text-sm text-[#754b3b]"
                  role="alert"
                >
                  {formError}
                </div>
              )}

              <button
                className="flex h-12 w-full items-center justify-center rounded-lg bg-[#282720] px-4 text-sm font-medium text-white transition-colors hover:bg-[#49473f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a694b] disabled:cursor-wait disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#77766f]">
              New to Morrow?{" "}
              <Link
                className="font-medium text-[#805338] underline decoration-[#d5b9a6] underline-offset-4 hover:text-[#563a28] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a694b]"
                href="/signup"
              >
                Create an account
              </Link>
            </p>
          </div>
          <p className="mt-5 text-center text-xs text-[#89877f]">
            Your conversations stay yours.
          </p>
        </section>
      </div>
    </main>
  );
}
