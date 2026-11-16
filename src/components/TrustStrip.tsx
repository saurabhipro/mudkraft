import { Banknote, Hand, ShieldCheck, Truck } from "lucide-react";

/** The four promises under a product grid, from the reference sellers' "your trust is important" row. */
const PROMISES = [
  { icon: Hand, text: "Handmade in Khurja, no moulds" },
  { icon: Truck, text: "24-hour delivery in Delhi NCR" },
  { icon: ShieldCheck, text: "Lab-tested, lead-free" },
  { icon: Banknote, text: "Breakage replaced free · COD" },
];

export function TrustStrip({ className = "" }: { className?: string }) {
  return (
    <ul
      className={`grid gap-5 rounded-3xl border border-border bg-[oklch(0.985_0.008_75)] px-6 py-5 sm:grid-cols-2 lg:grid-cols-4 ${className}`}
    >
      {PROMISES.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-center gap-3.5 text-sm text-earth">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sand text-clay-deep">
            <Icon className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
          </span>
          {text}
        </li>
      ))}
    </ul>
  );
}
