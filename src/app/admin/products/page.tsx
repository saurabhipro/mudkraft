import { Package } from "lucide-react";

import {
  FilterSelect,
  ResetFilters,
  SearchField,
} from "@/components/admin/filters";
import { RowMenu } from "@/components/admin/RowMenu";
import { Tabs } from "@/components/admin/Tabs";
import {
  EmptyState,
  IdentityCell,
  PageHeader,
  Panel,
  StatusBadge,
  TD,
  TH,
  THead,
  TR,
  Table,
  Toolbar,
  productStatusTone,
} from "@/components/admin/ui";
import { cloudinaryThumb } from "@/lib/cloudinary";
import { formatPaise } from "@/lib/money";
import { getAdminCategories, getAdminProducts } from "@/server/store/admin";

import { ImportExport } from "./import-export";

const FULFILMENT_LABELS: Record<string, string> = {
  ship_nationwide: "Nationwide",
  local_delivery_only: "Local delivery",
  pickup_only: "Studio pickup",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const single = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const filters = {
    q: single("q"),
    status: single("status"),
    categorySlug: single("category"),
    fulfilment: single("fulfilment"),
    view: single("view"),
  };

  const [products, categories, all] = await Promise.all([
    getAdminProducts(filters),
    getAdminCategories(),
    getAdminProducts(),
  ]);

  const liveCount = all.filter((p) => p.status === "active").length;
  const incompleteCount = all.filter((p) => p.gaps.length > 0).length;

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Products" }]}
        title="Products"
        description="Prices are derived from each product's cost inputs and the active rate card. Edit costs here or in bulk via Excel — never type a price directly."
        actions={<ImportExport />}
      />

      <Tabs
        param="view"
        ariaLabel="Product views"
        items={[
          { value: "", label: "All products", icon: "list", count: all.length },
          { value: "live", label: "Live", icon: "live", count: liveCount },
          {
            value: "incomplete",
            label: "Needs attention",
            icon: "warning",
            count: incompleteCount,
          },
        ]}
      />

      <Panel className="mt-5">
        <Toolbar>
          <SearchField name="q" placeholder="Search by name or slug" label="Search products" />
          <FilterSelect
            name="status"
            label="Status"
            options={[
              { value: "active", label: "Active" },
              { value: "draft", label: "Draft" },
              { value: "archived", label: "Archived" },
            ]}
          />
          <FilterSelect
            name="category"
            label="Category"
            options={categories.map((c) => ({ value: c.slug, label: c.name }))}
          />
          <FilterSelect
            name="fulfilment"
            label="Fulfilment"
            options={Object.entries(FULFILMENT_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <ResetFilters keys={["q", "status", "category", "fulfilment", "view"]} />
          <span className="ml-auto text-xs text-muted-foreground">
            {products.length} of {all.length}
          </span>
        </Toolbar>

        {products.length === 0 ? (
          <EmptyState
            title="No products match"
            description="Try clearing the filters, or import a spreadsheet to add products in bulk."
          />
        ) : (
          <Table minWidth={1080}>
            <THead>
              <tr>
                <TH>Product</TH>
                <TH>Category</TH>
                <TH>Fulfilment</TH>
                <TH align="right">Cost</TH>
                <TH align="right">Freight</TH>
                <TH align="right">Price</TH>
                <TH align="right">Stock</TH>
                <TH>Needs attention</TH>
                <TH>Status</TH>
                <TH align="right">Actions</TH>
              </tr>
            </THead>
            <tbody>
              {products.map((p) => (
                <TR key={p.id}>
                  <TD>
                    <IdentityCell
                      href={`/admin/products/${p.slug}`}
                      image={
                        p.primaryImage
                          ? cloudinaryThumb(p.primaryImage.publicId, 88, p.primaryImage.version)
                          : null
                      }
                      title={`${p.name} ${p.sizeLabel}`.trim()}
                      subtitle={p.slug}
                    />
                  </TD>
                  <TD className="text-earth/75">{p.categoryName ?? "—"}</TD>
                  <TD className="text-xs text-earth/70">
                    {FULFILMENT_LABELS[p.fulfilmentMode] ?? p.fulfilmentMode}
                  </TD>
                  <TD align="right" className="text-earth/55">
                    {p.totalCostPaise === null ? "—" : formatPaise(p.totalCostPaise)}
                  </TD>
                  <TD align="right" className="text-earth/55">
                    {p.blendedShippingPaise === null ? "—" : formatPaise(p.blendedShippingPaise)}
                  </TD>
                  <TD align="right">
                    <span className="text-earth">{formatPaise(p.pricePaise)}</span>
                    {p.compareAtPaise && (
                      <span className="block text-xs text-muted-foreground line-through">
                        {formatPaise(p.compareAtPaise)}
                      </span>
                    )}
                  </TD>
                  <TD align="right" className="text-earth/75">
                    {p.trackInventory ? p.stockQty : "—"}
                  </TD>
                  <TD>
                    {p.gaps.length === 0 ? (
                      <span className="text-xs text-emerald-700">Complete</span>
                    ) : (
                      <span className="text-xs text-clay-deep">{p.gaps.join(" · ")}</span>
                    )}
                  </TD>
                  <TD>
                    <StatusBadge tone={productStatusTone(p.status)}>{p.status}</StatusBadge>
                  </TD>
                  <TD align="right">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/admin/products/${p.slug}`}
                        className="text-xs tracking-wider uppercase text-clay hover:text-earth"
                      >
                        Edit
                      </a>
                      <RowMenu
                        label={`Actions for ${p.name}`}
                        items={[
                          { label: "Edit product", href: `/admin/products/${p.slug}` },
                          {
                            label: "View on storefront",
                            href: `/shop/${p.slug}`,
                            disabled: p.status !== "active",
                          },
                        ]}
                      />
                    </div>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Package className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Excel import matches rows on slug. An unknown slug creates a new product as a draft; the
        calculated columns are ignored on import because prices are always recomputed from the cost
        inputs.
      </p>
    </div>
  );
}
