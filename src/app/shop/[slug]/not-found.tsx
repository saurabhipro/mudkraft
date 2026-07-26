import Link from "next/link";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function NotFoundPiece() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="text-xs tracking-[0.3em] uppercase text-clay">404</div>
        <h1 className="mt-4 font-display text-5xl text-earth">This piece has wandered off</h1>
        <p className="mt-4 text-muted-foreground">
          The clay piece you&apos;re looking for isn&apos;t in our collection right now.
        </p>
        <Link
          href="/#collection"
          className="mt-8 inline-flex items-center gap-2 bg-earth text-cream px-6 py-3 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition"
        >
          Browse the Collection
        </Link>
      </div>
      <SiteFooter />
    </div>
  );
}
