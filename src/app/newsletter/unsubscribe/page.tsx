import type { Metadata } from "next";

import { UnsubscribeButton } from "./unsubscribe-button";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

/**
 * The link in every letter lands here. It takes a button press rather than
 * unsubscribing on load, because mail scanners open links on their own.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-clay-deep">Letters from the kiln</p>
        <h1 className="mt-3 font-display text-4xl text-earth">Unsubscribe</h1>
        {t ? (
          <UnsubscribeButton token={t} />
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            This link is incomplete. Please use the unsubscribe link in one of our emails, or write
            to sales@mudkraft.com.
          </p>
        )}
      </div>
    </main>
  );
}
