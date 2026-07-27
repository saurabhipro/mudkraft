"use client";

import Script from "next/script";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useRef } from "react";

import { GOOGLE_CLIENT_ID, useSession } from "@/lib/auth-client";

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
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
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
    !SUPPRESSED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  const handleScriptReady = useCallback(() => {
    // Google throttles repeat prompts; initialise once per page load.
    if (initialised.current || !window.google) return;
    initialised.current = true;

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
            if (res.ok) router.refresh();
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
