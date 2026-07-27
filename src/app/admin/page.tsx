import Link from "next/link";
import { AlertTriangle, ArrowRight, Package, ShoppingBag, Star, Users } from "lucide-react";

import { PageHeader, Panel } from "@/components/admin/ui";
import { getAdminProducts, getAdminSummary } from "@/server/store/admin";
import { getActivePricingConfig } from "@/server/store/admin";

import { RecomputePricesButton } from "./recompute-prices-button";

export default async function AdminOverviewPage() {
  const [summary, products, pricing] = await Promise.all([
    getAdminSummary(),
    getAdminProducts(),
    getActivePricingConfig(),
  ]);

  const needsAttention = products.filter((p) => p.gaps.length > 0);

  const cards = [
    {
      label: "Products",
      value: summary.products,
      hint: `${summary.activeProducts} live on the storefront`,
      href: "/admin/products",
      icon: Package,
    },
    {
      label: "Reviews to moderate",
      value: summary.pendingReviews,
      hint: "Hidden from the site until approved",
      href: "/admin/reviews?status=pending",
      icon: Star,
    },
    {
      label: "Orders",
      value: summary.orders,
      hint: "All time",
      href: "/admin/orders",
      icon: ShoppingBag,
    },
    {
      label: "New enquiries",
      value: summary.newEnquiries,
      hint: "Not yet contacted",
      href: "/admin/enquiries?status=new",
      icon: Users,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Everything that needs a decision today, in one place."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-2xl border border-earth/12 bg-background p-5 transition-colors hover:border-clay"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] tracking-wider uppercase text-earth/50">
                  {card.label}
                </span>
                <Icon className="h-4 w-4 text-clay/70" aria-hidden="true" />
              </div>
              <div className="mt-3 font-display text-4xl text-earth">{card.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{card.hint}</div>
            </Link>
          );
        })}
      </div>

      {needsAttention.length > 0 && (
        <Panel className="mt-6 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-xl text-earth">
              <AlertTriangle className="h-4 w-4 text-clay" aria-hidden="true" />
              {needsAttention.length} product{needsAttention.length === 1 ? "" : "s"} need attention
            </h2>
            <Link
              href="/admin/products?view=incomplete"
              className="inline-flex items-center gap-1 text-xs tracking-wider uppercase text-clay hover:text-earth"
            >
              Review all
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <ul className="mt-4 divide-y divide-earth/8">
            {needsAttention.slice(0, 5).map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <Link
                  href={`/admin/products/${p.slug}`}
                  className="text-sm text-earth hover:text-clay"
                >
                  {p.name} {p.sizeLabel}
                </Link>
                <span className="text-xs text-clay-deep">{p.gaps.join(" · ")}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel className="mt-6 p-5">
        <h2 className="font-display text-xl text-earth">Pricing</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Prices are derived from each product&apos;s cost inputs and the active rate card
          {pricing ? ` (v${pricing.version}, ${pricing.marginBps / 100}% margin)` : ""}, never typed
          in by hand. After changing a courier rate, margin or the order-volume mix, re-price the
          whole catalogue so no product is left on the old assumptions.
        </p>
        <div className="mt-5">
          <RecomputePricesButton />
        </div>
      </Panel>
    </div>
  );
}
