"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateProduct } from "@/server/actions/products";

export interface ProductFormValues {
  slug: string;
  name: string;
  tag: string;
  note: string;
  description: string;
  story: string;
  sizeLabel: string;
  status: "draft" | "active" | "archived";
  fulfilmentMode: "ship_nationwide" | "local_delivery_only" | "pickup_only";
  categoryId: string | null;
  stockQty: number;
  trackInventory: boolean;
  measurementsVerified: boolean;
  mfgCostInr: number;
  packingCostInr: number;
  productLengthCm: number;
  productWidthCm: number;
  productHeightCm: number;
  packedWeightGrams: number;
}

const inputCls =
  "mt-2 w-full rounded-xl border border-earth/25 bg-background px-4 py-2.5 text-earth " +
  "placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-earth/30";

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-[0.25em] uppercase text-clay">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-700">{error}</span>}
    </label>
  );
}

export function ProductForm({
  product,
  categories,
}: {
  product: ProductFormValues;
  categories: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(product);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      setMessage(null);
      setFieldErrors({});
      const result = await updateProduct(values);
      if (result.ok) {
        setMessage("Saved. Price recalculated and the storefront cache cleared.");
        router.refresh();
      } else {
        setMessage(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <fieldset className="rounded-2xl border border-earth/15 bg-cream/40 p-6">
        <legend className="px-2 text-xs tracking-[0.3em] uppercase text-clay">Listing</legend>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Name" error={fieldErrors.name}>
            <input className={inputCls} value={values.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Size label" hint="Shown next to the name, e.g. 2.5 L">
            <input className={inputCls} value={values.sizeLabel} onChange={(e) => set("sizeLabel", e.target.value)} />
          </Field>
          <Field label="Tag" hint="Cookware · 2.5 L">
            <input className={inputCls} value={values.tag} onChange={(e) => set("tag", e.target.value)} />
          </Field>
          <Field label="Note" hint="One poetic line for the grid card">
            <input className={inputCls} value={values.note} onChange={(e) => set("note", e.target.value)} />
          </Field>
          <Field label="Category">
            <select
              className={inputCls}
              value={values.categoryId ?? ""}
              onChange={(e) => set("categoryId", e.target.value || null)}
            >
              <option value="">Uncategorised</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status" hint="Draft products are invisible on the storefront">
            <select
              className={inputCls}
              value={values.status}
              onChange={(e) => set("status", e.target.value as ProductFormValues["status"])}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
        </div>

        <div className="mt-5 grid gap-5">
          <Field label="Description">
            <textarea rows={4} className={inputCls} value={values.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Field label="Story">
            <textarea rows={3} className={inputCls} value={values.story} onChange={(e) => set("story", e.target.value)} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-earth/15 bg-cream/40 p-6">
        <legend className="px-2 text-xs tracking-[0.3em] uppercase text-clay">
          Cost inputs — these drive the price
        </legend>

        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Manufacturing cost (₹)" error={fieldErrors.mfgCostInr}>
            <input type="number" step="0.01" min="0" className={inputCls} value={values.mfgCostInr} onChange={(e) => set("mfgCostInr", Number(e.target.value))} />
          </Field>
          <Field label="Packing material (₹)" error={fieldErrors.packingCostInr}>
            <input type="number" step="0.01" min="0" className={inputCls} value={values.packingCostInr} onChange={(e) => set("packingCostInr", Number(e.target.value))} />
          </Field>
          <Field label="Packed weight (g)" error={fieldErrors.packedWeightGrams}>
            <input type="number" step="1" min="1" className={inputCls} value={values.packedWeightGrams} onChange={(e) => set("packedWeightGrams", Number(e.target.value))} />
          </Field>
          <Field label="Length (cm)" hint="Product, not box — padding is added automatically" error={fieldErrors.productLengthCm}>
            <input type="number" step="0.1" min="0.1" className={inputCls} value={values.productLengthCm} onChange={(e) => set("productLengthCm", Number(e.target.value))} />
          </Field>
          <Field label="Width (cm)" error={fieldErrors.productWidthCm}>
            <input type="number" step="0.1" min="0.1" className={inputCls} value={values.productWidthCm} onChange={(e) => set("productWidthCm", Number(e.target.value))} />
          </Field>
          <Field label="Height (cm)" error={fieldErrors.productHeightCm}>
            <input type="number" step="0.1" min="0.1" className={inputCls} value={values.productHeightCm} onChange={(e) => set("productHeightCm", Number(e.target.value))} />
          </Field>
          <Field
            label="Fulfilment"
            hint="Pickup-only excludes freight from the price entirely"
          >
            <select
              className={inputCls}
              value={values.fulfilmentMode}
              onChange={(e) => set("fulfilmentMode", e.target.value as ProductFormValues["fulfilmentMode"])}
            >
              <option value="ship_nationwide">Ship nationwide</option>
              <option value="local_delivery_only">Local delivery only (Zone A freight)</option>
              <option value="pickup_only">Studio pickup only (no freight)</option>
            </select>
          </Field>
          <Field label="Stock quantity" error={fieldErrors.stockQty}>
            <input type="number" step="1" min="0" className={inputCls} value={values.stockQty} onChange={(e) => set("stockQty", Number(e.target.value))} />
          </Field>
        </div>

        <div className="mt-6 space-y-3">
          <label className="flex items-start gap-3 text-sm text-earth/85">
            <input
              type="checkbox"
              checked={values.measurementsVerified}
              onChange={(e) => set("measurementsVerified", e.target.checked)}
              className="mt-1"
            />
            <span>
              Dimensions and weight verified against a real packed unit.
              <span className="block text-xs text-muted-foreground">
                Leave unticked while these are estimates — freight is billed on box volume, so the
                price is only as trustworthy as these numbers.
              </span>
            </span>
          </label>

          <label className="flex items-center gap-3 text-sm text-earth/85">
            <input
              type="checkbox"
              checked={values.trackInventory}
              onChange={(e) => set("trackInventory", e.target.checked)}
            />
            Track inventory for this product
          </label>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center bg-earth text-cream px-8 py-3.5 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save and re-price"}
        </button>
        {message && <span className="text-sm text-earth/80">{message}</span>}
      </div>
    </form>
  );
}
