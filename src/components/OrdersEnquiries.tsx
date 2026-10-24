import Link from "next/link";

import { BrandLogo } from "@/components/BrandLogo";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { SALES_EMAIL, SALES_PHONE_DISPLAY } from "@/lib/catalogue";
import { WHATSAPP_NUMBER, whatsappLink } from "@/lib/whatsapp";

const whatsappOrder = () => whatsappLink(["Namaste Mudkraft! I'd like to place an order."]);

/** The "Orders & enquiries" block from the back page of the printed catalogue. */
export function OrdersEnquiries() {
  return (
    <section className="px-6 md:px-10 py-20 md:py-28">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-10 md:gap-14">
        <BrandLogo className="w-36 h-36 md:w-48 md:h-48 shrink-0" />
        <div className="flex-[999_1_480px] min-w-0">
          <p className="text-[11px] tracking-[0.32em] uppercase text-clay-deep font-medium">
            Orders &amp; enquiries
          </p>
          <h2 className="mt-3 font-display font-normal text-[clamp(2.25rem,4vw,3.4rem)] leading-[1.05] text-earth">
            Find your perfect handcrafted piece.
          </h2>
          <dl className="mt-7 grid grid-cols-[auto_1fr] gap-x-8 gap-y-4 items-baseline">
            <dt className="text-[11px] tracking-[0.24em] uppercase text-muted-foreground">
              Call / WhatsApp
            </dt>
            <dd className="text-xl font-medium">
              <a
                href={`tel:+${WHATSAPP_NUMBER}`}
                className="text-earth hover:text-clay-deep transition-colors"
              >
                {SALES_PHONE_DISPLAY}
              </a>
            </dd>
            <dt className="text-[11px] tracking-[0.24em] uppercase text-muted-foreground">Email</dt>
            <dd className="text-xl font-medium min-w-0 break-words">
              <a
                href={`mailto:${SALES_EMAIL}`}
                className="text-clay-deep hover:text-earth transition-colors"
              >
                {SALES_EMAIL}
              </a>
            </dd>
          </dl>
        </div>
        <div className="basis-full grid sm:grid-cols-2 gap-4">
          <Link
            href="/#collection"
            className="flex items-center gap-4 rounded-[1.25rem] bg-sand p-6 hover:-translate-y-0.5 transition-transform duration-500 ease-[var(--ease-clay)]"
          >
            <span className="grid place-items-center w-[52px] h-[52px] shrink-0 rounded-full bg-earth text-cream">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden="true"
                className="w-[22px] h-[22px]"
              >
                <path d="M5 8h14l-1.2 11H6.2z" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" />
              </svg>
            </span>
            <span>
              <span className="block font-display text-[1.65rem] leading-tight text-earth">
                Shop &amp; review
              </span>
              <span className="block mt-0.5 text-sm text-muted-foreground">
                Order online and rate your piece on mudkraft.com
              </span>
            </span>
          </Link>
          <a
            href={whatsappOrder()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-[1.25rem] bg-sand p-6 hover:-translate-y-0.5 transition-transform duration-500 ease-[var(--ease-clay)]"
          >
            <span className="grid place-items-center w-[52px] h-[52px] shrink-0 rounded-full bg-[#25D366] text-white">
              <WhatsAppIcon className="w-6 h-6" />
            </span>
            <span>
              <span className="block font-display text-[1.65rem] leading-tight text-earth">
                Order on WhatsApp
              </span>
              <span className="block mt-0.5 text-sm text-muted-foreground">
                Chat with us directly to place an order
              </span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
