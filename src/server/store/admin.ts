import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";

import { db } from "../db";
import { user } from "../db/schema/auth";
import { category, product, productImage } from "../db/schema/catalog";
import { order, orderItem } from "../db/schema/orders";
import { pricingConfig } from "../db/schema/pricing";
import { review } from "../db/schema/reviews";
import { workshopEnquiry } from "../db/schema/workshops";

/**
 * Admin reads. Deliberately NOT cached.
 *
 * The public store layer caches aggressively because thousands of visitors read
 * the same rows. Admin traffic is a handful of people who have just changed
 * something and must see the result — serving them a cached copy of the row
 * they replaced is the classic "my edit didn't save" bug. Freshness beats
 * throughput here.
 */

export interface AdminProductFilters {
  /** Free text over name and slug. */
  q?: string;
  status?: string;
  categorySlug?: string;
  fulfilment?: string;
  /** "incomplete" narrows to products still missing images or measurements. */
  view?: string;
}

export async function getAdminProducts(filters: AdminProductFilters = {}) {
  const conditions: SQL[] = [];

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    const match = or(ilike(product.name, pattern), ilike(product.slug, pattern));
    if (match) conditions.push(match);
  }
  if (filters.status && ["draft", "active", "archived"].includes(filters.status)) {
    conditions.push(eq(product.status, filters.status as "draft" | "active" | "archived"));
  }
  if (
    filters.fulfilment &&
    ["ship_nationwide", "local_delivery_only", "pickup_only"].includes(filters.fulfilment)
  ) {
    conditions.push(
      eq(
        product.fulfilmentMode,
        filters.fulfilment as "ship_nationwide" | "local_delivery_only" | "pickup_only",
      ),
    );
  }
  if (filters.categorySlug) {
    // Sub-select rather than a join so the relational query API stays usable.
    const matching = db
      .select({ id: category.id })
      .from(category)
      .where(eq(category.slug, filters.categorySlug));
    conditions.push(inArray(product.categoryId, matching));
  }

  const rows = await db.query.product.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [asc(product.sortOrder), asc(product.name)],
    with: { category: true, images: true },
  });

  const mapped = rows.map((p) => {
    /**
     * The "what's missing" hint, in the spirit of a marketplace console's
     * listing-quality column: tell the admin what to fix rather than making
     * them open each product to find out.
     */
    const gaps: string[] = [];
    if (p.images.length === 0) gaps.push("no photograph");
    if (!p.measurementsVerified) gaps.push("unverified measurements");
    if (!p.description.trim()) gaps.push("no description");
    if (p.trackInventory && p.stockQty <= 0) gaps.push("out of stock");

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      sizeLabel: p.sizeLabel,
      status: p.status,
      fulfilmentMode: p.fulfilmentMode,
      pricePaise: p.pricePaise,
      compareAtPaise: p.compareAtPaise,
      totalCostPaise: p.totalCostPaise,
      blendedShippingPaise: p.blendedShippingPaise,
      stockQty: p.stockQty,
      trackInventory: p.trackInventory,
      measurementsVerified: p.measurementsVerified,
      categoryName: p.category?.name ?? null,
      categorySlug: p.category?.slug ?? null,
      imageCount: p.images.length,
      primaryImage: p.images.find((i) => i.isPrimary) ?? p.images[0] ?? null,
      gaps,
    };
  });

  // Applied after mapping because completeness depends on joined image rows.
  if (filters.view === "incomplete") return mapped.filter((p) => p.gaps.length > 0);
  if (filters.view === "live") return mapped.filter((p) => p.status === "active");
  return mapped;
}

export async function getAdminProductBySlug(slug: string) {
  return db.query.product.findFirst({
    where: eq(product.slug, slug),
    with: { category: true, images: true, pricingConfig: true },
  });
}

export async function getAdminCategories() {
  return db.select().from(category).orderBy(asc(category.sortOrder), asc(category.name));
}

export async function getActivePricingConfig() {
  return db.query.pricingConfig.findFirst({ where: eq(pricingConfig.isActive, true) });
}

export async function getAdminReviews(status?: "pending" | "approved" | "rejected") {
  return db
    .select({
      id: review.id,
      authorName: review.authorName,
      authorCity: review.authorCity,
      rating: review.rating,
      title: review.title,
      body: review.body,
      status: review.status,
      photoPublicId: review.photoPublicId,
      verifiedPurchase: review.verifiedPurchase,
      createdAt: review.createdAt,
      productSlug: product.slug,
      productName: product.name,
    })
    .from(review)
    .innerJoin(product, eq(review.productId, product.id))
    .where(status ? eq(review.status, status) : undefined)
    .orderBy(desc(review.createdAt));
}

export async function getAdminOrders() {
  return db
    .select({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalPaise: order.totalPaise,
      contactEmail: order.contactEmail,
      contactPhone: order.contactPhone,
      shippingName: order.shippingName,
      shippingCity: order.shippingCity,
      userId: order.userId,
      createdAt: order.createdAt,
      itemCount: sql<number>`(
        SELECT COALESCE(SUM(${orderItem.qty}), 0)
        FROM ${orderItem} WHERE ${orderItem.orderId} = ${order.id}
      )`.mapWith(Number),
    })
    .from(order)
    .orderBy(desc(order.createdAt));
}

export async function getAdminOrderById(id: string) {
  return db.query.order.findFirst({
    where: eq(order.id, id),
    with: { items: true, events: true, shipments: true, user: true },
  });
}

export async function getAdminEnquiries() {
  return db.select().from(workshopEnquiry).orderBy(desc(workshopEnquiry.createdAt));
}

export async function getAdminUsers() {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));
}

/** Dashboard counters. One round trip per counter, but this page is rarely hit. */
export async function getAdminSummary() {
  const [products, activeProducts, pendingReviews, orders, newEnquiries, users] = await Promise.all([
    db.select({ n: count() }).from(product),
    db.select({ n: count() }).from(product).where(eq(product.status, "active")),
    db.select({ n: count() }).from(review).where(eq(review.status, "pending")),
    db.select({ n: count() }).from(order),
    db.select({ n: count() }).from(workshopEnquiry).where(eq(workshopEnquiry.status, "new")),
    db.select({ n: count() }).from(user),
  ]);

  return {
    products: products[0]?.n ?? 0,
    activeProducts: activeProducts[0]?.n ?? 0,
    pendingReviews: pendingReviews[0]?.n ?? 0,
    orders: orders[0]?.n ?? 0,
    newEnquiries: newEnquiries[0]?.n ?? 0,
    users: users[0]?.n ?? 0,
  };
}

export type AdminProductListItem = Awaited<ReturnType<typeof getAdminProducts>>[number];
export type AdminReviewListItem = Awaited<ReturnType<typeof getAdminReviews>>[number];
export type AdminOrderListItem = Awaited<ReturnType<typeof getAdminOrders>>[number];
export type AdminUserListItem = Awaited<ReturnType<typeof getAdminUsers>>[number];
export type AdminEnquiryListItem = Awaited<ReturnType<typeof getAdminEnquiries>>[number];
export type { productImage };
