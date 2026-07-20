"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction } from "../actions";
import { useUi } from "@/lib/i18n/client";

export default function SignUpPage() {
  const ui = useUi();
  const [state, formAction, pending] = useActionState<ReturnType<typeof signUpAction>, FormData>(
    signUpAction,
    undefined
  );

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2">
        <h1 className="font-serif text-3xl">{ui.auth.signUpTitle}</h1>
        <p className="text-sm text-ink-soft">{ui.auth.signUpDescription}</p>
      </div>

      <form action={formAction} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">{ui.auth.emailLabel}</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="input-dhamma w-full"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">{ui.auth.passwordLabel}</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            className="input-dhamma w-full"
          />
        </label>

        {state?.error ? (
          <p className="text-sm text-red-700" role="alert">
            {state.error === "missing"
              ? ui.auth.emailLabel + " / " + ui.auth.passwordLabel
              : ui.auth.signUpFailed}
          </p>
        ) : null}

        <button type="submit" disabled={pending} className="btn-dhamma w-full">
          {pending ? ui.auth.signingIn : ui.auth.signUpButton}
        </button>
      </form>

      <p className="text-sm text-ink-soft">
        <Link href="/auth/sign-in" className="link-dhamma">
          {ui.auth.haveAccountPrompt}
        </Link>
      </p>
      <p className="text-sm">
        <Link href="/reader" className="link-dhamma">
          ← {ui.auth.backToReader}
        </Link>
      </p>
    </div>
  );
}
