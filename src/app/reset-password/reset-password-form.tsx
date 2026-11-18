"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PasswordField } from "@/components/auth/PasswordField";
import { authClient } from "@/lib/auth-client";
import { checkPassword } from "@/lib/password-policy";

export function ResetPasswordForm({ token, nextPath }: { token: string; nextPath: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const problem = checkPassword(password);
    if (problem) return setError(problem);
    if (password !== confirm) return setError("The two passwords do not match.");

    setPending(true);
    const { error: authError } = await authClient.resetPassword({ newPassword: password, token });
    if (authError) {
      setPending(false);
      if (authError.code === "INVALID_TOKEN") return setExpired(true);
      return setError(authError.message ?? "We could not update your password. Please try again.");
    }
    // Every session was revoked by the reset, so the customer signs in fresh.
    router.push(`/sign-in?next=${encodeURIComponent(nextPath)}&reset=1`);
  };

  if (expired) {
    return (
      <div className="rounded-2xl border border-earth/15 bg-sand/60 p-6 text-center">
        <p className="text-earth">This reset link has expired or was already used.</p>
        <Link
          href={`/forgot-password?next=${encodeURIComponent(nextPath)}`}
          className="mt-6 inline-flex items-center justify-center bg-earth text-cream px-6 py-3.5 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors"
        >
          Send a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      <PasswordField
        id="password"
        label="New password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        showRules
      />
      <PasswordField
        id="confirm"
        label="Type it again"
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
      />

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full inline-flex items-center justify-center bg-earth text-cream px-6 py-3.5 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
