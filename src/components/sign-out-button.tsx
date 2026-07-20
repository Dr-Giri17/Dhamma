"use client";

import { useTransition } from "react";
import { signOutAction } from "@/app/auth/actions";

export default function SignOutButton({ label }: { label: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={() => {
        startTransition(() => void signOutAction());
      }}
    >
      <button type="submit" disabled={pending} className="btn-dhamma">
        {label}
      </button>
    </form>
  );
}
