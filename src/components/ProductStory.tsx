import Link from "next/link";
import {
  BookOpen,
  Check,
  Clock,
  Coffee,
  Droplets,
  Flame,
  Hand,
  Instagram,
  Leaf,
  Phone,
  Recycle,
  ShieldCheck,
  Soup,
  ThermometerSnowflake,
  X,
  type LucideIcon,
} from "lucide-react";

import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { INSTAGRAM_URL, SALES_PHONE_DISPLAY } from "@/lib/catalogue";
import { NCR_CITIES, POLICY } from "@/lib/policy";
import type { ProductView } from "@/lib/product-view";
import {
  COOK_BENEFITS,
  COOK_CARE,
  TEA_BENEFITS,
  TEA_STEPS,
  WATER_BENEFITS,
  WATER_STEPS,
  storyFor,
  type Benefit,
  type ProductStory,
  type StoryIcon,
} from "@/lib/product-stories";
import { whatsappLink } from "@/lib/whatsapp";

const ICONS: Record<StoryIcon, LucideIcon> = {
  flame: Flame,
  droplets: Droplets,
  soup: Soup,
  clock: Clock,
  shield: ShieldCheck,
  hand: Hand,
  cool: ThermometerSnowflake,
  leaf: Leaf,
  recycle: Recycle,
  coffee: Coffee,
};

const COUNT_WORDS = ["", "One", "Two", "Three", "Four", "Five"];

/** Every picture of the piece, the cutout first: it sits on any colour. */
function photosOf(p: ProductView): string[] {
  return [...new Set([p.cutout, ...p.gallery, p.img].filter((x): x is string => Boolean(x)))];
}

/**
 * A product photo on a light panel. Bikriup photos are shot on white, so a photo that is not a
 * cutout is multiplied into the panel, the same way ClayPlinth does it, instead of sitting there
 * as a white rectangle. Keep these panels light: multiply darkens a photo on a dark one.
 */
function PieceImage({
  p,
  src,
  alt,
  className = "",
}: {
  p: ProductView;
  src: string;
  alt: string;
  className?: string;
}) {
  const blended = src !== p.cutout;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`object-contain ${blended ? "mix-blend-multiply brightness-[1.06] contrast-[1.06]" : ""} ${className}`}
    />
  );
}

function Eyebrow({ children, tone = "clay" }: { children: string; tone?: "clay" | "gold" }) {
  return (
    <p
      className={`text-[11px] uppercase tracking-[0.22em] ${tone === "gold" ? "text-gold" : "text-clay-deep"}`}
    >
      {children}
    </p>
  );
}

/** Product page sections under the buy box: B for cookware, C for water and tea. */
export function ProductStorySections({
  product,
  sizes,
}: {
  product: ProductView;
  sizes: ProductView[];
}) {
  const story = storyFor(product);
  if (!story) return null;
  if (story.kind === "cook") return <CookStory p={product} story={story} />;
  return <BenefitSheet p={product} story={story} sizes={sizes} />;
}

/* ───────────────────────── B · cookware: uses, why clay, care ───────────────────────── */

const USE_TONES = [
  "bg-sand",
  "bg-[oklch(0.86_0.06_60)]",
  "bg-[oklch(0.93_0.02_90)]",
  "bg-[oklch(0.88_0.045_50)]",
];

function CookStory({ p, story }: { p: ProductView; story: ProductStory }) {
  const photos = photosOf(p);
  // The name, not the Bikriup type: types can read "Drinkware · Single".
  const kind = p.name;
  return (
    <section className="border-t border-border px-6 md:px-10 py-20 md:py-28">
      <div className="max-w-7xl mx-auto flex flex-col gap-20 md:gap-24">
        {story.uses.length > 0 && (
          <div>
            <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
              <div>
                <Eyebrow>{`One ${kind}, many meals`}</Eyebrow>
                <h2 className="mk-reveal mt-3 font-display font-normal text-[clamp(2.5rem,5vw,4rem)] leading-[0.95] text-earth">
                  {COUNT_WORDS[story.uses.length] ?? "Many"} kitchens,{" "}
                  <em className="font-light text-clay">one pot.</em>
                </h2>
              </div>
              <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">
                The same {kind} moves from stove to table. Cook in it, serve from it, and leave the
                lid on to keep it warm.
              </p>
            </div>
            {/* A swipe row on phones, a grid from tablets up. */}
            <ol className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
              {story.uses.map((use, i) => (
                <li
                  key={use.title}
                  className={`mk-reveal flex w-[78%] shrink-0 snap-start flex-col overflow-hidden rounded-[1.75rem] sm:w-auto ${USE_TONES[i % USE_TONES.length]}`}
                >
                  <div className="relative grid h-44 place-items-center">
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-[26%] bottom-6 h-4 rounded-[50%] bg-earth/15 blur-[2px]"
                    />
                    {photos.length > 0 && (
                      <PieceImage
                        p={p}
                        src={photos[i % photos.length]}
                        alt={`Clay ${p.name} for ${use.title.toLowerCase()}`}
                        className="relative h-32 w-[78%]"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5 px-6 pb-6 pt-2">
                    <span className="font-display text-xl text-clay">0{i + 1}</span>
                    <h3 className="font-display text-[1.9rem] leading-none text-earth">
                      {use.title}
                    </h3>
                    <p lang="hi" className="font-hindi text-[17px] text-muted-foreground">
                      {use.hindi}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-earth/75">{use.body}</p>
                    <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                      {use.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-cream/80 px-2.5 py-1 text-[11px] text-earth/80"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div>
            <Eyebrow>Why cook in clay</Eyebrow>
            <h2 className="mk-reveal mt-3 mb-10 font-display font-normal text-[clamp(2.25rem,4vw,3.25rem)] leading-[0.95] text-earth">
              What steel <em className="font-light text-clay">can&rsquo;t do.</em>
            </h2>
            <ul className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {COOK_BENEFITS.map((b) => (
                <BenefitRow key={b.title} b={b} />
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-6 rounded-[2rem] bg-earth p-7 text-cream md:p-9">
            {story.rule && (
              <div className="rounded-[1.4rem] bg-clay px-6 py-5">
                <p className="font-hand text-2xl">One rule from the potter</p>
                <p className="mt-1 font-display text-[1.75rem] leading-tight">{story.rule.en}</p>
                <p lang="hi" className="font-hindi mt-1.5 text-[15px] opacity-90">
                  {story.rule.hi}
                </p>
              </div>
            )}
            <div className="grid gap-6 sm:grid-cols-2">
              <CareList title="Do" items={COOK_CARE.do} ok />
              <CareList title="Don't" items={COOK_CARE.dont} />
            </div>
            <Link
              href="/care/season-your-handi"
              className="mk-link mt-auto self-start text-xs uppercase tracking-[0.16em] text-gold"
            >
              Full seasoning guide →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function BenefitRow({ b }: { b: Benefit }) {
  const Icon = ICONS[b.icon];
  return (
    <li className="mk-reveal flex items-start gap-4">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sand text-clay-deep">
        <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
      </span>
      <div>
        <h3 className="font-display text-2xl leading-tight text-earth">{b.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{b.body}</p>
      </div>
    </li>
  );
}

function CareList({ title, items, ok = false }: { title: string; items: string[]; ok?: boolean }) {
  const Icon = ok ? Check : X;
  return (
    <div>
      <p
        className={`mb-3 text-[11px] uppercase tracking-[0.2em] ${ok ? "text-gold" : "text-ember"}`}
      >
        {title}
      </p>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-snug text-cream/85">
            <Icon
              className={`mt-0.5 h-4 w-4 shrink-0 ${ok ? "text-gold" : "text-ember"}`}
              aria-hidden="true"
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────────────── C · water and tea: bilingual benefits, sizes, steps ───────────────────── */

/** "12 L" -> 12. Sizes reach the page with their unit already added (see withUnit). */
function litres(label: string): number | null {
  const m = label.match(/([\d.]+)\s*(?:l|ltr|litres?|liters?)\b/i);
  return m ? Number.parseFloat(m[1]) : null;
}

function BenefitSheet({
  p,
  story,
  sizes,
}: {
  p: ProductView;
  story: ProductStory;
  sizes: ProductView[];
}) {
  const water = story.kind === "water";
  const benefits = water ? WATER_BENEFITS : TEA_BENEFITS;
  const steps = water ? WATER_STEPS : TEA_STEPS;
  const photo = photosOf(p)[0];
  const kind = p.name;
  const [left, right] = [benefits.slice(0, 2), benefits.slice(2, 4)];

  return (
    <section className="bg-sand">
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="mb-12 flex items-start justify-between gap-8">
          <div>
            <Eyebrow>{`${kind} · ${story.hindiName}`}</Eyebrow>
            <p
              lang="hi"
              className="font-hindi mt-3 text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.2] text-earth"
            >
              {story.benefitsHindi}
            </p>
            <h2 className="mk-reveal font-display font-normal text-[clamp(2.25rem,4.5vw,3.5rem)] leading-none text-earth">
              {water ? "Water that remembers " : "Chai the way "}
              <em className="font-light text-clay">{water ? "the river." : "it should be."}</em>
            </h2>
          </div>
          <span className="hidden h-28 w-28 shrink-0 -rotate-[8deg] place-items-center rounded-full border-[1.5px] border-dashed border-clay-deep text-center text-clay-deep sm:grid">
            <span className="font-display text-[1.75rem] leading-[0.9]">
              100%
              <span className="mt-1 block font-sans text-[9.5px] uppercase tracking-[0.2em]">
                Handmade
              </span>
            </span>
          </span>
        </div>

        {/* No photo yet: the four cards close up into a 2 × 2 instead of framing an empty arch. */}
        <div
          className={`grid items-center gap-6 lg:gap-8 ${
            photo ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)_minmax(0,1fr)]" : "md:grid-cols-2"
          }`}
        >
          {photo && (
            <div className="relative order-first mx-auto h-[420px] w-full max-w-[400px] overflow-hidden rounded-t-full rounded-b-[2.5rem] bg-cream md:h-[560px] lg:order-none">
              <span
                lang="hi"
                aria-hidden="true"
                className="font-hindi absolute inset-x-0 top-16 text-center text-[96px] leading-tight text-clay-deep/[0.07]"
              >
                {story.hindiName}
              </span>
              <span
                aria-hidden="true"
                className="absolute inset-x-[18%] bottom-10 h-8 rounded-[50%] bg-earth/15 blur-[2px]"
              />
              <PieceImage
                p={p}
                src={photo}
                alt={`${p.name} ${p.sizeLabel} – unglazed clay, handmade in Khurja`.replace(
                  /\s+/g,
                  " ",
                )}
                className="absolute inset-x-[10%] bottom-14 h-[70%] w-[80%] object-bottom"
              />
            </div>
          )}
          <div className="flex flex-col gap-5 lg:order-first">
            {left.map((b) => (
              <BilingualCard key={b.title} b={b} />
            ))}
          </div>
          <div className="flex flex-col gap-5">
            {right.map((b) => (
              <BilingualCard key={b.title} b={b} />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-earth text-cream grain">
        <div className="max-w-7xl mx-auto grid gap-12 px-6 py-16 md:px-10 md:py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
          <div className="flex flex-col gap-6">
            <div>
              <Eyebrow tone="gold">
                {sizes.length > 1 ? "Pick your size" : "Delivered fast"}
              </Eyebrow>
              <h2 className="mt-3 font-display font-normal text-[clamp(2.25rem,4vw,3.25rem)] leading-[0.95]">
                {water ? "How much does your " : "Pour for "}
                <em className="font-light text-ember">
                  {water ? "home drink?" : "the whole table."}
                </em>
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {sizes.map((s) => {
                const l = water ? litres(s.sizeLabel) : null;
                const on = s.slug === p.slug;
                return (
                  <Link
                    key={s.slug}
                    href={`/shop/${s.slug}`}
                    aria-current={on ? "page" : undefined}
                    className={`flex flex-col gap-1 rounded-3xl border p-5 transition-colors ${
                      on
                        ? "border-cream bg-cream text-earth"
                        : "border-cream/20 hover:border-cream/60"
                    }`}
                  >
                    <span className="font-display text-[2.5rem] leading-none">
                      {s.sizeLabel || s.name}
                    </span>
                    {l && (
                      <span className="text-[13px] opacity-75">
                        about {Math.round((l * 1000) / 250)} glasses
                      </span>
                    )}
                    <span className="mt-2 font-display text-2xl">{s.price}</span>
                  </Link>
                );
              })}
            </div>
            <p className="text-[13px] text-cream/60">
              {water ? "Glasses counted at 250 ml. " : ""}
              {POLICY.ncr} ({NCR_CITIES.join(", ")}). Breakage replaced free.
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <Eyebrow tone="gold">
              {water ? "Before the first fill" : "Before the first chai"}
            </Eyebrow>
            <ol className="flex flex-col gap-6">
              {steps.map((step, i) => (
                <li key={step.title} className="flex items-start gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold font-display text-xl text-gold">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-[1.6rem] leading-tight">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-cream/70">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

function BilingualCard({ b }: { b: Benefit }) {
  const Icon = ICONS[b.icon];
  return (
    <div className="mk-reveal flex flex-col gap-2 rounded-[1.75rem] bg-[oklch(0.985_0.008_75)] p-6 shadow-[0_20px_40px_-30px_oklch(0.28_0.04_40/0.5)] md:p-7">
      <span className="mb-1 grid h-14 w-14 place-items-center rounded-full bg-sand text-clay-deep">
        <Icon className="h-6 w-6" strokeWidth={1.6} aria-hidden="true" />
      </span>
      {b.hindi && (
        <p lang="hi" className="font-hindi text-[22px] leading-snug text-earth">
          {b.hindi}
        </p>
      )}
      <h3 className="font-display text-[1.75rem] leading-none text-clay-deep">{b.title}</h3>
      <span aria-hidden="true" className="my-1.5 h-px bg-border" />
      <p className="text-sm leading-relaxed text-muted-foreground">{b.body}</p>
    </div>
  );
}

/* ───────────────────────── D · need help with your clay? ───────────────────────── */

export function NeedHelpBand({ product: p }: { product: ProductView }) {
  const photo = photosOf(p).find((src) => src !== p.cutout) ?? photosOf(p)[0];
  const tel = `tel:${SALES_PHONE_DISPLAY.replace(/[^\d+]/g, "")}`;
  const wa = whatsappLink([
    "Namaste Mudkraft 🙏",
    `I have a question about the ${p.name}${p.sizeLabel ? ` (${p.sizeLabel})` : ""}.`,
  ]);
  const rows = [
    {
      label: "WhatsApp",
      value: SALES_PHONE_DISPLAY,
      href: wa,
      external: true,
      icon: <WhatsAppIcon className="h-5 w-5" />,
    },
    {
      label: "Call",
      value: SALES_PHONE_DISPLAY,
      href: tel,
      external: false,
      icon: <Phone className="h-5 w-5" aria-hidden="true" />,
    },
    ...(INSTAGRAM_URL
      ? [
          {
            label: "Instagram",
            value: "@" + INSTAGRAM_URL.replace(/\/$/, "").split("/").pop(),
            href: INSTAGRAM_URL,
            external: true,
            icon: <Instagram className="h-5 w-5" aria-hidden="true" />,
          },
        ]
      : []),
    {
      label: "Read first",
      value: "Care guide →",
      href: "/care/season-your-handi",
      external: false,
      icon: <BookOpen className="h-5 w-5" aria-hidden="true" />,
    },
  ];
  return (
    <section className="bg-kiln text-cream px-6 md:px-10 py-20 md:py-24">
      <div
        className={`max-w-7xl mx-auto grid items-center gap-10 lg:gap-16 ${
          photo ? "lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]" : ""
        }`}
      >
        <div
          className={`relative h-[420px] overflow-hidden rounded-[2rem] bg-sand ${photo ? "hidden lg:block" : "hidden"}`}
        >
          <span
            aria-hidden="true"
            className="absolute inset-x-[18%] bottom-20 h-8 rounded-[50%] bg-earth/15 blur-[2px]"
          />
          {photo && (
            <PieceImage
              p={p}
              src={photo}
              alt={`Handmade unglazed clay ${p.name} from Mudkraft`}
              className="absolute inset-x-[10%] top-[12%] h-[66%] w-[80%]"
            />
          )}
          <p className="absolute bottom-5 left-6 font-hand text-[26px] text-clay-deep">
            — from the Mudkraft family
          </p>
        </div>
        <div className="flex flex-col gap-7">
          <div>
            <Eyebrow tone="gold">Care &amp; help</Eyebrow>
            <h2 className="mt-3 font-display font-normal text-[clamp(2.5rem,5vw,4rem)] leading-[0.95]">
              Need help with <em className="font-light text-ember">your clay?</em>
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-cream/75">
              Seasoning a new pot, a hairline crack, a smell that won&rsquo;t leave: ask us. The
              people who fired your pot will answer.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {rows.map((r) => (
              <li key={r.label}>
                <a
                  href={r.href}
                  {...(r.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="flex min-h-[76px] items-center gap-4 rounded-[1.4rem] bg-cream/[0.07] px-5 transition-colors hover:bg-cream/[0.13]"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold text-kiln">
                    {r.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] uppercase tracking-[0.18em] text-cream/60">
                      {r.label}
                    </span>
                    <span className="block truncate font-display text-[1.6rem] leading-tight">
                      {r.value}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
