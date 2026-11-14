/**
 * Helpers that keep customer details and raw upstream responses out of the
 * server logs. Logs are read on the VM and copied into support threads; they
 * should carry enough to find an order, never enough to identify a person.
 */

/** "+919810033344" → "+91••••••3344". Anything without four digits becomes "•••". */
export function maskPhone(phone: string | null | undefined): string {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.length < 4) return "•••";
  const last4 = digits.slice(-4);
  const country = digits.length > 10 ? `+${digits.slice(0, digits.length - 10)}` : "";
  return `${country}••••••${last4}`;
}

/** "asha.k@example.com" → "a•••@example.com". */
export function maskEmail(email: string | null | undefined): string {
  const value = String(email ?? "");
  const at = value.lastIndexOf("@");
  if (at < 1) return "•••";
  return `${value[0]}•••${value.slice(at)}`;
}

interface RazorpayLikeError {
  statusCode: string | number;
  error: { code?: string; description?: string };
}

function isRazorpayLike(err: unknown): err is RazorpayLikeError {
  return (
    typeof err === "object" &&
    err !== null &&
    "statusCode" in err &&
    "error" in err &&
    typeof (err as { error: unknown }).error === "object" &&
    (err as { error: unknown }).error !== null
  );
}

/**
 * One line describing an error, safe for the log. Razorpay SDK errors carry
 * the request they failed on; only the status, code and description are kept.
 * Stacks and raw objects are never printed.
 */
export function describeError(err: unknown): string {
  if (isRazorpayLike(err)) {
    return `razorpay ${err.statusCode} ${err.error.code ?? ""}: ${err.error.description ?? ""}`.trim();
  }
  if (err instanceof Error) {
    const status = "status" in err && typeof err.status === "number" ? ` ${err.status}` : "";
    const code = "code" in err && typeof err.code === "string" ? ` ${err.code}` : "";
    return `${err.name}${status}${code}: ${err.message}`;
  }
  return String(err);
}
