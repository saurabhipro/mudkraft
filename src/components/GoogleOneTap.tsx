"use client";

import Script from "next/script";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useRef } from "react";

import { authClient, GOOGLE_CLIENT_ID, useSession } from "@/lib/auth-client";

/**
 * Google One Tap — the "Continue as <name>" prompt shown to visitors who are
 * already signed in to Google in this browser.
 *
 * Talks to Better Auth's `oneTap()` server plugin directly
 * (POST /api/auth/one-tap/callback with the Google ID token, which the server
 * verifies against Google before creating a session). We drive Google's script
 * ourselves rather than using better-auth's `oneTapClient`, whose types break
 * inference on the shared auth client — see src/lib/auth-client.ts.
 *
 * Deliberately silent whenever it can't or shouldn't run. One Tap is a
 * convenience, never a gate: browsing and guest checkout must work identically
 * whether the prompt appears, is dismissed, or is blocked outright.
 */

/** Pages where a sign-in prompt would be redundant or intrusive. */
const SUPPRESSED_PREFIXES = ["/sign-in", "/admin", "/checkout"];

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleIdentityApi {
  accounts: {
    id: {
      initialize(config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
        use_fedcm_for_prompt?: boolean;
        context?: "signin" | "signup" | "use";
      }): void;
      prompt(): void;
      disableAutoSelect(): void;
    };
  };
}

const SIGNED_OUT_KEY = "mk:signed-out";

/**
 * Call before an explicit sign-out. Without it, the moment the session clears
 * this component sees a signed-out visitor and starts a fresh prompt, which the
 * post-sign-out refresh then aborts (Google logs that as a console error) — and
 * re-offering sign-in to someone who just chose to leave is unwelcome anyway.
 * Lasts for this tab's visit only.
 */
export function suppressOneTapAfterSignOut() {
  try {
    sessionStorage.setItem(SIGNED_OUT_KEY, "1");
  } catch {
    // Storage blocked (private mode etc.) — the prompt may reappear; harmless.
  }
  window.google?.accounts.id.disableAutoSelect();
}

function signedOutThisVisit() {
  try {
    return sessionStorage.getItem(SIGNED_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

let gsiAbortLogDowngraded = false;

/**
 * Google's script reports every cancelled prompt — the visitor closing it,
 * tapping outside it, or navigating away while it is open — through
 * console.error as "[GSI_LOGGER]: FedCM get() rejects with AbortError". That is
 * an ordinary outcome, not a fault, but Next's dev overlay presents any
 * console.error as a crash. Re-route just that one message to console.warn;
 * every other error, Google's included, passes through untouched.
 */
function downgradeGsiAbortLog() {
  if (gsiAbortLogDowngraded) return;
  gsiAbortLogDowngraded = true;

  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const text = args.filter((arg) => typeof arg === "string").join(" ");
    if (text.includes("[GSI_LOGGER]") && text.includes("AbortError")) {
      console.warn(...args);
      return;
    }
    originalError.apply(console, args);
  };
}

export function GoogleOneTap() {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const initialised = useRef(false);

  const eligible =
    Boolean(GOOGLE_CLIENT_ID) &&
    !isPending &&
    !session &&
    !SUPPRESSED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) &&
    !signedOutThisVisit();

  const handleScriptReady = useCallback(() => {
    // Google throttles repeat prompts; initialise once per page load.
    if (initialised.current || !window.google) return;
    initialised.current = true;
    downgradeGsiAbortLog();

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      context: "signin",
      // Never sign someone in without an explicit tap.
      auto_select: false,
      cancel_on_tap_outside: true,
      // Required by Chrome for One Tap.
      use_fedcm_for_prompt: true,
      callback: (response) => {
        if (!response.credential) return;

        void fetch("/api/auth/one-tap/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // No callbackURL is sent on purpose: the server would then perform a
          // redirect. Staying put and refreshing avoids that round trip and
          // sidesteps the open-redirect surface a callback URL introduces.
          body: JSON.stringify({ idToken: response.credential }),
          credentials: "include",
        })
          .then((res) => {
            if (!res.ok) return;
            // This request bypasses authClient, so Better Auth never learns a
            // session now exists and every useSession() (the header's account
            // button included) would keep showing "Sign in". Signal it directly.
            authClient.$store.notify("$sessionSignal");
            router.refresh();
          })
          .catch(() => {
            // Network failure. The visitor never asked for this prompt, so
            // there is nothing worth surfacing.
          });
      },
    });

    window.google.accounts.id.prompt();
  }, [router]);

  if (!eligible) return null;

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onReady={handleScriptReady}
    />
  );
}
