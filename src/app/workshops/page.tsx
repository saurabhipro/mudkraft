import type { Metadata } from "next";

import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import { WorkshopsPage } from "./workshops-page";

const URL = `${SITE_URL}/workshops`;
const TITLE = "Workshops & Soil Report — Mudkraft";

export const metadata: Metadata = {
  title: TITLE,
  description:
    "Book a Mudkraft pottery workshop for schools, birthdays and private parties. Read the full soil report of our river clay from the banks of the Ganges.",
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description:
      "Pottery workshops for schools, birthdays and parties — plus the full soil report of our river clay.",
    type: "website",
    url: URL,
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE] },
};

const courseJsonLd = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "Mudkraft Pottery Workshops",
  description:
    "Pottery workshops for schools, birthdays, private parties and corporate offsites — throw on the wheel, hand-build, and take home fired pieces.",
  provider: {
    "@type": "Organization",
    name: "Mudkraft",
    url: SITE_URL,
  },
  url: URL,
  hasCourseInstance: [
    {
      "@type": "CourseInstance",
      name: "School Workshop — Little Hands, Living Earth",
      courseMode: "onsite",
      courseWorkload: "PT2H",
    },
    {
      "@type": "CourseInstance",
      name: "Wheel-side Birthday",
      courseMode: "onsite",
      courseWorkload: "PT3H",
    },
    {
      "@type": "CourseInstance",
      name: "Private Party — The Slow Evening",
      courseMode: "onsite",
      courseWorkload: "PT4H",
    },
    {
      "@type": "CourseInstance",
      name: "Corporate Studio Offsite",
      courseMode: "onsite",
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <WorkshopsPage />
    </>
  );
}
