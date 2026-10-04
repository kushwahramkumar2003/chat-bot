"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { SignupSchema, type Signup } from "@repo/validation/auth";
import { signupRequest } from "../../../services/api";

type FieldErrors = Partial<Record<keyof Signup, string>>;
const inputClass =
  "mt-2 h-12 w-full rounded-lg border border-[#dfddd6] bg-[#fffefa] px-3.5 text-sm text-[#26251f] outline-none transition placeholder:text-[#aaa79f] focus:border-[#a99a88] focus:ring-2 focus:ring-[#b97550]/15";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitHandler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const result = SignupSchema.safeParse({ name, email, password });
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (
          (field === "name" || field === "email" || field === "password") &&
          !nextErrors[field]
        ) {
          nextErrors[field] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await signupRequest(result.data);
      router.replace("/login?created=1");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to create your account. Please try again."
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
          href="/login"
        >
          Sign in
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
            Start with a question. See where it takes you.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-[#77766f]">
            Create an account to keep your conversations close and your ideas
            moving.
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
              Get started
            </p>
            <h1 className="font-serif text-4xl font-normal tracking-[-.045em]">
              Make room for a new idea.
            </h1>
          </div>

          <div className="rounded-2xl border border-[#e9e7e1] bg-white p-6 shadow-[0_16px_55px_-38px_rgba(38,37,31,0.28)] sm:p-8">
            <div className="mb-7 hidden md:block">
              <p className="mb-2 text-[11px] uppercase tracking-[.11em] text-[#8a8178]">
                Get started
              </p>
              <h2 className="font-serif text-[32px] font-normal tracking-[-.04em]">
                Create your account
              </h2>
              <p className="mt-2 text-sm text-[#77766f]">
                It only takes a moment to get started.
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
                  htmlFor="name"
                >
                  Name
                </label>
                <input
                  autoComplete="name"
                  className={`${inputClass} ${fieldErrors.name ? "border-[#bd6b55]" : ""}`}
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? "name-error" : undefined}
                  onChange={(event) => {
                    setName(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      name: undefined,
                    }));
                  }}
                  placeholder="Your name"
                  required
                />
                {fieldErrors.name && (
                  <p className="mt-1.5 text-xs text-[#a34836]" id="name-error">
                    {fieldErrors.name}
                  </p>
                )}
              </div>
              <div>
                <label
                  className="text-[13px] font-medium text-[#3c3b35]"
                  htmlFor="email"
                >
                  Email address
                </label>
                <input
                  autoComplete="email"
                  className={`${inputClass} ${fieldErrors.email ? "border-[#bd6b55]" : ""}`}
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email ? "email-error" : undefined
                  }
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
                <input
                  autoComplete="new-password"
                  className={`${inputClass} ${fieldErrors.password ? "border-[#bd6b55]" : ""}`}
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={
                    fieldErrors.password ? "password-error" : undefined
                  }
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
                {isSubmitting ? "Creating account…" : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#77766f]">
              Already have an account?{" "}
              <Link
                className="font-medium text-[#805338] underline decoration-[#d5b9a6] underline-offset-4 hover:text-[#563a28] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a694b]"
                href="/login"
              >
                Sign in
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
