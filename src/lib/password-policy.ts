/**
 * Customer password rules, shared by the sign-up / reset forms (live checklist)
 * and the Better Auth `before` hook in src/server/auth.ts (the real check —
 * the forms are only a convenience).
 */

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULES: ReadonlyArray<{
  id: string;
  label: string;
  test: (pw: string) => boolean;
}> = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (pw) => pw.length >= PASSWORD_MIN_LENGTH,
  },
  { id: "upper", label: "One capital letter (A–Z)", test: (pw) => /[A-Z]/.test(pw) },
  { id: "lower", label: "One small letter (a–z)", test: (pw) => /[a-z]/.test(pw) },
  {
    id: "special",
    label: "One special character (! @ # $ …)",
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
];

/** Null when the password passes every rule, otherwise a sentence naming what is missing. */
export function checkPassword(pw: string): string | null {
  const missing = PASSWORD_RULES.filter((rule) => !rule.test(pw));
  if (missing.length === 0) return null;
  // Lower-case the first letter only: "(A–Z)" must stay capital.
  const parts = missing.map((rule) => rule.label.charAt(0).toLowerCase() + rule.label.slice(1));
  return `Password needs: ${parts.join(", ")}.`;
}
