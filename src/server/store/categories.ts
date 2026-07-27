import { asc } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { db } from "../db";
import { category } from "../db/schema/catalog";
import { CACHE_TAGS, CACHE_TTL_SECONDS } from "./tags";

export interface StoreCategory {
  id: string;
  slug: string;
  name: string;
}

async function queryCategories(): Promise<StoreCategory[]> {
  return db
    .select({ id: category.id, slug: category.slug, name: category.name })
    .from(category)
    .orderBy(asc(category.sortOrder), asc(category.name));
}

export const getCategories = cache(
  unstable_cache(queryCategories, ["categories"], {
    tags: [CACHE_TAGS.categories],
    revalidate: CACHE_TTL_SECONDS.catalog,
  }),
);
