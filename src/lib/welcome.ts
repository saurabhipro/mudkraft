/**
 * What the welcome popup remembers in this browser: who signed up (so checkout can
 * fill itself and the popup never returns) and when it was last turned down.
 * Storage can be blocked (private windows), so every read and write is guarded.
 */

const SIGNED = "mk-welcome";
const DISMISSED = "mk-welcome-dismissed";
const QUIET_DAYS = 14;

export interface WelcomeDetails {
  name: string;
  phone: string;
  email: string;
  code: string | null;
}

export function readWelcome(): WelcomeDetails | null {
  try {
    const raw = localStorage.getItem(SIGNED);
    return raw ? (JSON.parse(raw) as WelcomeDetails) : null;
  } catch {
    return null;
  }
}

export function saveWelcome(details: WelcomeDetails) {
  try {
    localStorage.setItem(SIGNED, JSON.stringify(details));
  } catch {
    /* storage blocked: the popup may simply ask again next visit */
  }
}

export function dismissWelcome() {
  try {
    localStorage.setItem(DISMISSED, String(Date.now()));
  } catch {
    /* ignore */
  }
}

/** Signed up already, or said no in the last two weeks. */
export function welcomeQuiet(): boolean {
  if (readWelcome()) return true;
  try {
    const at = Number(localStorage.getItem(DISMISSED));
    return at > 0 && Date.now() - at < QUIET_DAYS * 86_400_000;
  } catch {
    return true;
  }
}
