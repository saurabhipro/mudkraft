import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { ShareButton } from "@/components/ShareButton";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { FACEBOOK_URL, SALES_EMAIL } from "@/lib/catalogue";
import { whatsappLink } from "@/lib/whatsapp";

const ENQUIRY_EMAIL = SALES_EMAIL;

const QUICK_LINKS = [
  { label: "Products", href: "/#collection" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/trust" },
  { label: "Shipping & Returns", href: "/shipping-returns" },
  { label: "Track Order", href: "/track" },
  { label: "FAQ", href: "/faq" },
];

const whatsappEnquiry = () => whatsappLink(["Namaste Mudkraft! I have an enquiry."]);

export function SiteFooter() {
  return (
    <footer className="relative bg-earth text-cream px-6 md:px-10 pt-20 pb-10 mt-10">
      <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-5 gap-12">
        <div className="sm:col-span-2">
          <Link href="/" className="group flex items-center gap-4" aria-label="Mudkraft home">
            <BrandLogo className="w-20 h-20 transition-transform duration-700 ease-[var(--ease-clay)] group-hover:-rotate-6 group-hover:scale-105" />
            <span className="flex flex-col leading-none">
              <span className="text-4xl font-display text-gold leading-none tracking-tight">
                Mud<span className="italic">kraft</span>
              </span>
              <span className="flex items-center gap-2 mt-2">
                <span className="h-px w-5 bg-gold/40" />
                <span className="text-[9px] uppercase tracking-[0.28em] text-gold/70 font-sans">
                  Slow Craft Studio
                </span>
              </span>
            </span>
          </Link>
          <p className="mt-6 font-hand text-2xl text-gold">made from earth, made with love</p>
          <p className="mt-4 text-cream/70 leading-relaxed max-w-sm">
            A slow craft studio from the banks of the Ganges. Each vessel is thrown by hand, dried
            under sky, and fired in a wood kiln.
          </p>
        </div>

        <div>
          <div className="text-xs tracking-[0.3em] uppercase text-gold mb-5">Explore</div>
          <ul className="space-y-3 text-cream/80">
            <li>
              <Link href="/benefits" className="hover:text-gold transition-colors mk-link">
                Benefits of Clay
              </Link>
            </li>
            <li>
              <Link href="/workshops" className="hover:text-gold transition-colors mk-link">
                Workshops
              </Link>
            </li>
            <li>
              <Link href="/soil-report" className="hover:text-gold transition-colors mk-link">
                Soil Report
              </Link>
            </li>
            <li>
              <a
                href="/brochure/Mudkraft-Catalogue-2026.pdf"
                download
                className="hover:text-gold transition-colors mk-link"
              >
                Catalogue 2026 (PDF)
              </a>
            </li>
            <li>
              <Link href="/#story" className="hover:text-gold transition-colors mk-link">
                Story
              </Link>
            </li>
            <li>
              <Link href="/videos" className="hover:text-gold transition-colors mk-link">
                Videos
              </Link>
            </li>
            <li>
              <Link
                href="/care/season-your-handi"
                className="hover:text-gold transition-colors mk-link"
              >
                Care Guide
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-xs tracking-[0.3em] uppercase text-gold mb-5">Quick links</div>
          <ul className="space-y-3 text-cream/80">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-gold transition-colors mk-link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-xs tracking-[0.3em] uppercase text-gold mb-5">Support</div>
          <ul className="space-y-3 text-cream/80">
            <li>
              <a
                href={whatsappEnquiry()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-gold transition-colors"
              >
                <WhatsAppIcon className="w-4 h-4" /> WhatsApp
              </a>
            </li>
            <li>
              <a
                href={`mailto:${ENQUIRY_EMAIL}`}
                className="hover:text-gold transition-colors mk-link"
              >
                {ENQUIRY_EMAIL}
              </a>
            </li>
            <li>
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold transition-colors mk-link"
              >
                Facebook
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold transition-colors mk-link"
              >
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>

      <p
        aria-hidden="true"
        className="mk-reveal max-w-7xl mx-auto mt-16 font-display text-center leading-[0.8] tracking-[-0.04em] whitespace-nowrap text-[clamp(4.5rem,19vw,18rem)] text-cream/[0.07] select-none"
      >
        mudkraft
      </p>

      <div className="max-w-7xl mx-auto mt-10 pt-8 border-t border-cream/15 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-cream/60">
        <div>© {new Date().getFullYear()} Mudkraft Studio · Khurja, India</div>
        <div className="flex items-center gap-4">
          <span className="tracking-[0.3em] uppercase hidden sm:inline">
            Handmade · Slow · Soulful
          </span>
          <span className="text-cream [&_button]:text-cream/70 [&_button:hover]:text-gold">
            <ShareButton
              title="Mudkraft — Slow Craft Studio"
              text="Handcrafted clay from the banks of the Ganges."
              label="Share"
              compact
            />
          </span>
        </div>
      </div>

      {/* Floating WhatsApp */}
      <a
        href={whatsappEnquiry()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 sm:bottom-6 sm:right-6 z-40 inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white shadow-2xl hover:scale-110 transition-transform duration-500 ease-[var(--ease-spring)]"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-[#25D366] animate-ring-pulse [animation-duration:3s]"
        />
        <WhatsAppIcon className="relative w-6 h-6 sm:w-7 sm:h-7" />
      </a>
    </footer>
  );
}
