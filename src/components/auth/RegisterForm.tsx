"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || undefined, email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        data.error ?? "Something went wrong. Please try again."
      );
      setSubmitting(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (result?.error) {
      setError("Account created — but sign-in failed. Please sign in manually.");
    } else {
      router.push("/library");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-5 pt-8 md:justify-center md:pt-0">
      {/* Brand */}
      <Link href="/" className="mb-10 flex items-center gap-2 md:mb-12">
        <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
        <span className="font-display text-[17px] font-medium italic text-ink">
          CookbookAI
        </span>
      </Link>

      <div className="w-full max-w-[480px]">
        <p className="mb-1 text-center text-eyebrow uppercase tracking-[0.16em] text-accent">
          Get started
        </p>
        <h1 className="mb-1 text-center font-display text-display-md font-medium text-ink">
          Bring recipes home.
        </h1>
        <p className="mb-[18px] text-center font-display text-deck italic text-ink-muted">
          Free, while we're getting started.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          {error && (
            <p
              id="form-error"
              className="mb-1 text-body-sm"
              style={{ color: "var(--color-accent-strong)" }}
            >
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="font-ui text-ui text-ink-muted">
              Name{" "}
              <span className="text-ink-ghost">(optional)</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="h-[38px] w-full rounded-sm border-[0.5px] border-border bg-paper px-3 font-ui text-body text-ink transition-colors focus-visible:border-accent focus-visible:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="font-ui text-ui text-ink-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              aria-describedby={error ? "form-error" : undefined}
              className="h-[38px] w-full rounded-sm border-[0.5px] border-border bg-paper px-3 font-ui text-body text-ink transition-colors focus-visible:border-accent focus-visible:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="font-ui text-ui text-ink-muted"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                aria-describedby="password-hint"
                className="h-[38px] w-full rounded-sm border-[0.5px] border-border bg-paper px-3 pr-14 font-ui text-body text-ink transition-colors focus-visible:border-accent focus-visible:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 font-ui text-ui-sm text-ink-faint hover:text-ink"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <p
              id="password-hint"
              className="font-ui text-ui-sm text-ink-ghost"
            >
              8 characters or more
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-3 h-[38px] w-full rounded-sm bg-accent font-ui text-ui text-paper transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-[22px] text-center font-ui text-ui-sm text-ink-muted">
          Already have one?{" "}
          <Link
            href="/login"
            className="text-ink underline-offset-2 hover:underline"
          >
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
