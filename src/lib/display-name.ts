/**
 * What to call a customer. Magic-link sign-ups arrive with an empty name, so
 * fall back to the part of the email before the @, tidied into a first name
 * ("dpk.negircks@…" → "Dpk") — never the raw email address.
 */
export function firstNameOf(user: { name?: string | null; email?: string | null }): string {
  const name = user.name?.trim();
  if (name && !name.includes("@")) return name.split(/\s+/)[0];

  const local = (user.email ?? "").split("@")[0];
  const word = local.split(/[._\-+\d]+/).find((part) => part.length > 0) ?? "";
  if (!word) return "there";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** Full name when there is one, otherwise the same tidy fallback. */
export function fullNameOf(user: { name?: string | null; email?: string | null }): string {
  const name = user.name?.trim();
  return name && !name.includes("@") ? name : firstNameOf(user);
}

/** One or two letters for an avatar. */
export function initialsOf(user: { name?: string | null; email?: string | null }): string {
  const name = user.name?.trim();
  if (name && !name.includes("@")) {
    const parts = name.split(/\s+/);
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  }
  return firstNameOf(user).charAt(0).toUpperCase();
}
