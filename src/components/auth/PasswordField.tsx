"use client";

import { useState } from "react";

import { PASSWORD_RULES } from "@/lib/password-policy";

export const authInputCls =
  "mt-2 w-full rounded-full border border-earth/20 bg-background px-5 py-3.5 text-earth shadow-[inset_0_1px_2px_rgba(59,42,34,0.06)] " +
  "placeholder:text-earth/35 transition-colors focus:border-earth/50 focus:outline-none focus:ring-4 focus:ring-clay/15";

export const authLabelCls = "block text-xs tracking-widest uppercase text-earth/70";

/**
 * Password input with show/hide and, for new passwords, a live checklist of
 * the rules in src/lib/password-policy.ts.
 */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  showRules = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  showRules?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className={authLabelCls} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          aria-describedby={showRules ? `${id}-rules` : undefined}
          className={`${authInputCls} pr-20`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-[11px] tracking-widest uppercase text-earth/60 hover:text-earth"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>

      {showRules && (
        <ul id={`${id}-rules`} className="mt-3 grid gap-1 pl-2 text-xs">
          {PASSWORD_RULES.map((rule) => {
            const ok = rule.test(value);
            return (
              <li key={rule.id} className={ok ? "text-emerald-700" : "text-earth/55"}>
                <span aria-hidden="true" className="inline-block w-4">
                  {ok ? "✓" : "○"}
                </span>
                {rule.label}
                <span className="sr-only">{ok ? " — done" : " — not yet"}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
