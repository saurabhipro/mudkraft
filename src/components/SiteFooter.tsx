import { Link } from "@tanstack/react-router";
import { ShareButton } from "@/components/ShareButton";

const WHATSAPP_NUMBER = "919990649990";
const ENQUIRY_EMAIL = "hello@mudkraft.com";

const whatsappEnquiry = () =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Namaste Mudkraft! I have an enquiry."
  )}`;

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.84c0 2.09.55 4.13 1.6 5.93L0 24l6.4-1.68a11.82 11.82 0 0 0 5.64 1.44h.01c6.54 0 11.84-5.3 11.84-11.84 0-3.16-1.23-6.13-3.37-8.44ZM12.05 21.4h-.01a9.55 9.55 0 0 1-4.87-1.34l-.35-.21-3.8 1 1.02-3.7-.23-.38a9.53 9.53 0 0 1-1.46-5.08c0-5.28 4.3-9.58 9.6-9.58 2.56 0 4.97.99 6.78 2.8a9.53 9.53 0 0 1 2.81 6.79c0 5.28-4.3 9.58-9.59 9.58Zm5.26-7.18c-.29-.14-1.7-.84-1.96-.94-.26-.1-.45-.14-.64.14-.19.29-.74.94-.9 1.13-.17.19-.33.21-.62.07-.29-.14-1.22-.45-2.32-1.43-.86-.77-1.44-1.72-1.6-2-.17-.29-.02-.44.13-.58.13-.13.29-.33.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.64-1.54-.88-2.11-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.38 0 1.4 1.02 2.75 1.17 2.94.14.19 2.02 3.09 4.9 4.33.68.29 1.22.47 1.63.6.68.22 1.31.19 1.8.11.55-.08 1.7-.7 1.94-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.34Z"/>
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative bg-earth text-cream px-6 md:px-10 pt-20 pb-10 mt-10">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-3">
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
            <li><Link to="/" hash="collection" className="hover:text-gold transition-colors">Collection</Link></li>
            <li><Link to="/benefits" className="hover:text-gold transition-colors">Benefits of Clay</Link></li>
            <li><Link to="/workshops" className="hover:text-gold transition-colors">Workshops & Soil Report</Link></li>
            <li><Link to="/" hash="story" className="hover:text-gold transition-colors">Story</Link></li>
            <li><Link to="/care/season-your-handi" className="hover:text-gold transition-colors">Care Guide</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-xs tracking-[0.3em] uppercase text-gold mb-5">Support</div>
          <ul className="space-y-3 text-cream/80">
            <li><Link to="/track" className="hover:text-gold transition-colors">Track Order</Link></li>
            <li><Link to="/faq" className="hover:text-gold transition-colors">FAQ</Link></li>
            <li><Link to="/shipping-returns" className="hover:text-gold transition-colors">Shipping & Returns</Link></li>
            <li><Link to="/trust" className="hover:text-gold transition-colors">Trust & Privacy</Link></li>
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
        className="fixed bottom-6 right-6 z-40 inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-2xl hover:scale-110 transition-transform"
      >
        <WhatsAppIcon className="w-7 h-7" />
      </a>
    </footer>
  );
}
