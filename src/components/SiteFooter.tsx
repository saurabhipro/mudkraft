import Link from "next/link";
import { ShareButton } from "@/components/ShareButton";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { whatsappLink } from "@/lib/whatsapp";

const ENQUIRY_EMAIL = "hello@mudkraft.com";

const whatsappEnquiry = () => whatsappLink(["Namaste Mudkraft! I have an enquiry."]);


export function SiteFooter() {
  return (
    <footer className="relative bg-earth text-cream px-6 md:px-10 pt-20 pb-10 mt-10">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
        <div className="md:col-span-2">
          <Link href="/" className="flex items-center gap-3">
            <span className="relative flex items-center justify-center shrink-0">
              <span
                className="relative w-12 h-12 rounded-full flex items-center justify-center shadow-sm overflow-hidden -rotate-6"
                style={{ background: "var(--gradient-clay)" }}
              >
                <span
                  className="absolute inset-0 opacity-25"
                  style={{
                    backgroundImage: "radial-gradient(circle at center, #000 1px, transparent 1px)",
                    backgroundSize: "3px 3px",
                  }}
                />
                <span className="relative font-display text-cream text-2xl font-semibold leading-none -mt-0.5">M</span>
              </span>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-earth"
                style={{ backgroundColor: "var(--gold)" }}
              />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-4xl font-display text-gold leading-none tracking-tight">Mud<span className="italic">kraft</span></span>
              <span className="flex items-center gap-2 mt-2">
                <span className="h-px w-5 bg-gold/40" />
                <span className="text-[9px] uppercase tracking-[0.28em] text-gold/70 font-sans">Slow Craft Studio</span>
              </span>
            </span>
          </Link>
          <p className="mt-6 font-hand text-2xl text-gold">made from earth, made with love</p>
          <p className="mt-4 text-cream/70 leading-relaxed max-w-sm">
            A slow craft studio from the banks of the Ganges. Each vessel is thrown by hand,
            dried under sky, and fired in a wood kiln.
          </p>
        </div>

        <div>
          <div className="text-xs tracking-[0.3em] uppercase text-gold mb-5">Explore</div>
          <ul className="space-y-3 text-cream/80">
            <li><Link href="/#collection" className="hover:text-gold transition-colors">Collection</Link></li>
            <li><Link href="/benefits" className="hover:text-gold transition-colors">Benefits of Clay</Link></li>
            <li><Link href="/workshops" className="hover:text-gold transition-colors">Workshops & Soil Report</Link></li>
            <li><Link href="/#story" className="hover:text-gold transition-colors">Story</Link></li>
            <li><Link href="/care/season-your-handi" className="hover:text-gold transition-colors">Care Guide</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-xs tracking-[0.3em] uppercase text-gold mb-5">Support</div>
          <ul className="space-y-3 text-cream/80">
            <li><Link href="/track" className="hover:text-gold transition-colors">Track Order</Link></li>
            <li><Link href="/faq" className="hover:text-gold transition-colors">FAQ</Link></li>
            <li><Link href="/shipping-returns" className="hover:text-gold transition-colors">Shipping & Returns</Link></li>
            <li><Link href="/trust" className="hover:text-gold transition-colors">Trust & Privacy</Link></li>
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
              <a href={`mailto:${ENQUIRY_EMAIL}`} className="hover:text-gold transition-colors">
                {ENQUIRY_EMAIL}
              </a>
            </li>
            <li>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-cream/15 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-cream/60">
        <div>© {new Date().getFullYear()} Mudkraft Studio · Khurja, India</div>
        <div className="flex items-center gap-4">
          <span className="tracking-[0.3em] uppercase hidden sm:inline">Handmade · Slow · Soulful</span>
          <span className="text-cream [&_button]:text-cream/70 [&_button:hover]:text-gold">
            <ShareButton title="Mudkraft — Slow Craft Studio" text="Handcrafted clay from the banks of the Ganges." label="Share" compact />
          </span>
        </div>
      </div>

      {/* Floating WhatsApp */}
      <a
        href={whatsappEnquiry()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 sm:bottom-6 sm:right-6 z-40 inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white shadow-2xl hover:scale-110 transition-transform"
      >
        <WhatsAppIcon className="w-6 h-6 sm:w-7 sm:h-7" />
      </a>
    </footer>
  );
}
