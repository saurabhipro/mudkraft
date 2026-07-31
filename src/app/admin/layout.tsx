import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { requireAdmin } from "@/server/auth-guard";

export const metadata: Metadata = {
  title: "Admin — Mudkraft",
  robots: { index: false, follow: false },
};

/**
 * Admin pages must never be cached or statically rendered: they show
 * per-request, per-user data behind an authorisation check.
 */
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // The real authorisation boundary. src/proxy.ts only checks for a cookie.
  const session = await requireAdmin();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminTopbar email={session.user.email} name={session.user.name} />
      <AdminSidebar />

      {/* Offsets: on mobile the in-flow nav strip carries the top offset; on md+ the fixed rail does. */}
      <main className="md:pt-[4.25rem] md:pl-24">
        <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
