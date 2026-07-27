import { notFound } from "next/navigation";

import { PageHeader, StatusBadge, productStatusTone } from "@/components/admin/ui";
import { formatPaise } from "@/lib/money";
import { getAdminCategories, getAdminProductBySlug } from "@/server/store/admin";

import { ImageManager } from "./image-manager";
import { ProductForm } from "./product-form";

export default async function AdminProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [productRow, categories] = await Promise.all([
    getAdminProductBySlug(slug),
    getAdminCategories(),
  ]);

  if (!productRow) notFound();

  const derived = [
    { label: "Chargeable weight", value: productRow.chargeableWeightGrams ? `${(productRow.chargeableWeightGrams / 1000).toFixed(1)} kg` : "—" },
    { label: "Blended freight", value: productRow.blendedShippingPaise === null ? "—" : formatPaise(productRow.blendedShippingPaise) },
    { label: "Breakage provision", value: productRow.breakageProvisionPaise === null ? "—" : formatPaise(productRow.breakageProvisionPaise) },
    { label: "Total landed cost", value: productRow.totalCostPaise === null ? "—" : formatPaise(productRow.totalCostPaise) },
    { label: "Selling price", value: formatPaise(productRow.pricePaise) },
    { label: "MRP", value: productRow.compareAtPaise === null ? "—" : formatPaise(productRow.compareAtPaise) },
  ];

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Products", href: "/admin/products" },
          { label: productRow.name },
        ]}
        title={
          <>
            {productRow.name} <span className="text-clay">{productRow.sizeLabel}</span>
          </>
        }
        description={`/shop/${productRow.slug}`}
        actions={
          <StatusBadge tone={productStatusTone(productRow.status)}>{productRow.status}</StatusBadge>
        }
      />

      <section className="mt-8 rounded-2xl border border-earth/15 bg-cream/40 p-6">
        <h2 className="text-xs tracking-[0.3em] uppercase text-clay">Derived pricing</h2>
        <p className="mt-2 text-sm text-foreground/70 max-w-3xl leading-relaxed">
          Calculated from the cost inputs below and the active rate card
          {productRow.pricingConfig ? ` (v${productRow.pricingConfig.version})` : ""}. Saving the
          form recalculates all of it — these fields cannot be edited directly, because a price
          nobody can reproduce is a price nobody can defend.
        </p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          {derived.map((item) => (
            <div key={item.label}>
              <dt className="text-[11px] tracking-widest uppercase text-earth/60">{item.label}</dt>
              <dd className="mt-1 font-display text-xl text-earth">{item.value}</dd>
            </div>
          ))}
        </dl>
        {!productRow.measurementsVerified && (
          <p className="mt-5 text-sm text-clay">
            ⚠ Dimensions and weight are unverified estimates, so the freight figure above — and
            therefore the price — is provisional.
          </p>
        )}
      </section>

      <section className="mt-8">
        <ImageManager
          productSlug={productRow.slug}
          images={productRow.images.map((img) => ({
            id: img.id,
            publicId: img.publicId,
            version: img.version,
            alt: img.alt,
            isPrimary: img.isPrimary,
            resourceType: img.resourceType,
          }))}
        />
      </section>

      <section className="mt-8">
        <ProductForm
          product={{
            slug: productRow.slug,
            name: productRow.name,
            tag: productRow.tag,
            note: productRow.note,
            description: productRow.description,
            story: productRow.story,
            sizeLabel: productRow.sizeLabel,
            status: productRow.status,
            fulfilmentMode: productRow.fulfilmentMode,
            categoryId: productRow.categoryId,
            stockQty: productRow.stockQty,
            trackInventory: productRow.trackInventory,
            measurementsVerified: productRow.measurementsVerified,
            mfgCostInr: productRow.mfgCostPaise / 100,
            packingCostInr: productRow.packingCostPaise / 100,
            productLengthCm: (productRow.productLengthMm ?? 0) / 10,
            productWidthCm: (productRow.productWidthMm ?? 0) / 10,
            productHeightCm: (productRow.productHeightMm ?? 0) / 10,
            packedWeightGrams: productRow.packedWeightGrams ?? 0,
          }}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      </section>
    </div>
  );
}
