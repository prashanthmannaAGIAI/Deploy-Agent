"use client";

import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/ui/coming-soon";
import { inputClass } from "@/components/ui/field";

import { continueWithEmail } from "./actions";

const EMAIL = /^\S+@\S+\.\S+$/;

function SsoButton({ children }: { children: string }) {
  return (
    <Button
      disabled
      className="relative min-w-0 flex-wrap whitespace-normal py-1.5"
      aria-label={`${children}, coming soon`}
    >
      {children}
      <ComingSoon />
    </Button>
  );
}

export function LoginForm({
  callbackUrl,
  initialError,
}: {
  callbackUrl: string;
  initialError: string;
}) {
  const [error, setError] = useState(initialError);
  const [pending, startTransition] = useTransition();
  const emailRef = useRef<HTMLInputElement>(null);

  return (
    <form
      noValidate
      className="grid w-full min-w-0 max-w-[380px] gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const email = emailRef.current?.value.trim() ?? "";
        if (!EMAIL.test(email)) {
          setError("Enter a valid work email.");
          emailRef.current?.focus();
          return;
        }
        setError("");
        startTransition(async () => {
          const result = await continueWithEmail(email, callbackUrl);
          if (result?.error) setError(result.error);
        });
      }}
    >
      <div>
        <h2>Sign in</h2>
        <p className="mt-1.5 text-muted">Use your work account to continue.</p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
        <SsoButton>GitHub</SsoButton>
        <SsoButton>Google</SsoButton>
      </div>
      <SsoButton>Single sign-on (SAML / OIDC)</SsoButton>
      <div className="flex items-center gap-3 text-[13px] text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
        or with email
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Work email
        </label>
        <input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          className={inputClass}
          onChange={() => error && setError("")}
        />
      </div>
      <p
        role="alert"
        data-testid="login-error"
        className="m-0 min-h-5 text-sm font-medium text-err"
      >
        {error}
      </p>
      <Button
        variant="primary"
        type="submit"
        disabled={pending}
        className="border-transparent bg-[linear-gradient(135deg,#11B7E9_0%,#2878E8_45%,#3436A8_100%)] text-white shadow-[0_8px_20px_-8px_rgba(40,120,232,0.7)]"
      >
        {pending ? "Redirecting…" : "Continue"}
      </Button>
      <p className="text-[13px] text-muted">
        You&apos;ll enter your password on the AiOps sign-in page. Two-factor authentication is
        required for accounts that can deploy to production.
      </p>
    </form>
  );
}
