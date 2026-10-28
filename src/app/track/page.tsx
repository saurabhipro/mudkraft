import type { Metadata } from "next";

import { OG_IMAGE } from "@/lib/seo";
import { TrackPage } from "./track-page";

const TITLE = "Track Your Order — Mudkraft";

export const metadata: Metadata = {
  title: TITLE,
  description:
    "Check the status of your Mudkraft clay order. Enter your order number and email, or track directly with your courier AWB.",
  openGraph: {
    title: TITLE,
    description:
      "Check the status of your Mudkraft clay order using your order number and email.",
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE] },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ order?: string | string[] }>;
}) {
  const { order } = await searchParams;
  // Scanned from the shipping label: the order number is filled in.
  const initialOrder = (Array.isArray(order) ? order[0] : order)?.slice(0, 40) ?? "";
  return <TrackPage initialOrder={initialOrder} />;
}
