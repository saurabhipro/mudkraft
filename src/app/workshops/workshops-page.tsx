"use client";

import { useState } from "react";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { OrdersEnquiries } from "@/components/OrdersEnquiries";
import { SALES_EMAIL } from "@/lib/catalogue";
import handsClay from "@/assets/hands-clay.jpg";
import studentPottery from "@/assets/student-pottery.jpg";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";
import { sendWorkshopEnquiry } from "@/server/actions/enquiries";

const ENQUIRY_EMAIL = SALES_EMAIL;

const experiences = [
  {
    tag: "Schools",
    title: "Little Hands, Living Earth",
    duration: "2 hrs · groups of 15–40",
    price: "from ₹450 / child",
    lines: [
      "Story of clay — from river bed to fired pot",
      "Hand-building: pinch pot & diya",
      "Take-home unfired piece + optional kiln firing",
    ],
  },
  {
    tag: "Birthdays",
    title: "Wheel-side Birthday",
    duration: "3 hrs · up to 20 guests",
    price: "from ₹18,000",
    lines: [
      "Live demo on the potter's wheel",
      "Everyone throws their own small bowl",
      "Chai in fresh kulhads · cake corner setup",
    ],
  },
  {
    tag: "Private Party",
    title: "The Slow Evening",
    duration: "4 hrs · up to 12 guests",
    price: "from ₹32,000",
    lines: [
      "Intimate wheel session with a master potter",
      "Wine, chai and clay — under kiln-lit lanterns",
      "Fired pieces couriered to each guest",
    ],
  },
  {
    tag: "Corporate",
    title: "Studio Offsite",
    duration: "Half day · 20–60 people",
    price: "on request",
    lines: [
      "Team hand-building + wheel rotations",
      "Talk on slow craft & Khurja heritage",
      "Custom branded pieces post-firing",
    ],
  },
];

// Headline figures only; the full report lives at /soil-report.
const SOIL_HIGHLIGHTS = [
  { v: "Not detected", k: "Lead, cadmium, arsenic" },
  { v: "7.2", k: "pH · near-neutral" },
  { v: "12.8%", k: "Water absorption" },
  { v: "48 h", k: "Wood-fired cycle" },
];

export function WorkshopsPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    type: "School",
    date: "",
    guests: "",
    message: "",
  });

  const enquiryText = () =>
    encodeURIComponent(
      [
        "Namaste Mudkraft 🙏",
        `I'd like to book a ${form.type.toLowerCase()} workshop.`,
        form.name && `Name: ${form.name}`,
        form.phone && `Phone: ${form.phone}`,
        form.email && `Email: ${form.email}`,
        form.date && `Preferred date: ${form.date}`,
        form.guests && `Guests: ${form.guests}`,
        form.message && `Notes: ${form.message}`,
      ]
        .filter(Boolean)
        .join("\n")
    );

  const whatsappHref = () => `https://wa.me/${WHATSAPP_NUMBER}?text=${enquiryText()}`;

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader
        rightSlot={
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center text-xs tracking-widest uppercase bg-earth text-cream px-5 py-2.5 rounded-full hover:bg-clay transition-colors"
          >
            Enquire
          </a>
        }
      />

      {/* HERO */}
      <section className="relative pt-40 pb-24 grain">
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(ellipse at 30% 50%, oklch(0.88 0.06 65) 0%, oklch(0.955 0.018 75) 60%)",
            }}
          />
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-10 grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7">
            <p className="font-hand text-clay text-2xl mb-6">— come get your hands muddy</p>
            <h1 className="text-balance text-[clamp(2.5rem,6.5vw,5.5rem)] leading-[0.95] font-display text-earth">
              Learn the wheel.<br />
              <span className="italic text-clay-deep">Feel the earth</span> turn<br />
              beneath your palms.
            </h1>
            <p className="mt-8 max-w-xl text-lg text-muted-foreground leading-relaxed">
              We host pottery workshops for schools, birthdays, private parties and
              corporate offsites — inside our Khurja studio, or on-site anywhere in India.
              Every session begins with river clay and ends with a piece you shaped yourself.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#book"
                className="inline-flex items-center gap-3 bg-earth text-cream px-8 py-4 rounded-full text-sm tracking-widest uppercase hover:bg-clay transition-colors"
              >
                Book a workshop →
              </a>
              <a href="/soil-report" className="text-sm text-earth underline underline-offset-4 decoration-clay/40 hover:decoration-clay">
                Read the soil report
              </a>
            </div>
          </div>
          <div className="md:col-span-5">
            <img
              src={handsClay.src}
              alt="Hands on the potter's wheel"
              className="w-full aspect-[4/5] object-cover rounded-[2rem] shadow-[0_40px_100px_-30px_rgba(80,40,20,0.5)]"
            />
          </div>
        </div>
      </section>

      {/* EXPERIENCES */}
      <section className="py-24 px-6 md:px-10 max-w-7xl mx-auto">
        <div className="mb-16">
          <p className="text-xs tracking-[0.4em] uppercase text-clay mb-6">— our experiences</p>
          <h2 className="text-4xl md:text-6xl font-display text-earth text-balance max-w-3xl">
            Four ways to <span className="italic">gather</span> around clay.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {experiences.map((e) => (
            <div
              key={e.title}
              className="group relative rounded-[1.5rem] border border-border bg-cream/50 p-6 sm:p-8 hover:border-clay transition-colors"
            >
              <div className="text-xs tracking-widest uppercase text-clay">{e.tag}</div>
              <h3 className="mt-2 text-3xl font-display text-earth">{e.title}</h3>
              <div className="mt-2 text-sm text-muted-foreground">{e.duration}</div>
              <ul className="mt-6 space-y-2 text-earth/90">
                {e.lines.map((l) => (
                  <li key={l} className="flex gap-3">
                    <span className="text-clay mt-1">◦</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3 border-t border-border/60 pt-5">
                <div className="font-display text-2xl text-earth">{e.price}</div>
                <a
                  href="#book"
                  className="text-xs tracking-widest uppercase text-clay group-hover:text-earth transition-colors"
                >
                  Enquire →
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STUDENT AT THE WHEEL */}
      <section className="px-6 md:px-10 max-w-7xl mx-auto pb-16">
        <div className="grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7 order-2 md:order-1">
            <img
              src={studentPottery.src}
              alt="A student shaping a small bowl on the potter's wheel during a Mudkraft workshop"
              loading="lazy"
              width={1024}
              height={1024}
              className="w-full aspect-[4/3] object-cover rounded-[2rem] shadow-[0_40px_100px_-30px_rgba(80,40,20,0.5)]"
            />
          </div>
          <div className="md:col-span-5 order-1 md:order-2">
            <p className="font-hand text-clay text-2xl mb-4">— your first bowl</p>
            <h2 className="text-4xl md:text-5xl font-display text-earth leading-tight text-balance">
              A student, a wheel, and <span className="italic text-clay-deep">one quiet hour</span> with the earth.
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Most people who sit at our wheel have never touched wet clay before. By the end of the session, they walk out holding something they made — still soft, a little uneven, entirely theirs.
            </p>
          </div>
        </div>
      </section>



      {/* SOIL REPORT — teaser; the full tables are on /soil-report */}
      <section id="soil" className="relative py-24 md:py-28 grain overflow-hidden bg-earth">
        <div className="max-w-6xl mx-auto px-6 md:px-10 text-cream">
          <div className="grid md:grid-cols-12 gap-10 mb-12 items-end">
            <div className="md:col-span-7">
              <p className="text-xs tracking-[0.4em] uppercase text-gold mb-6">— soil report</p>
              <h2 className="text-4xl md:text-6xl font-display text-balance">
                Where our <span className="italic text-gold">clay</span> is born.
              </h2>
            </div>
            <p className="md:col-span-5 text-cream/70 leading-relaxed">
              The clay you throw in a workshop is the same river clay we cook in: tested by the
              Central Glass &amp; Ceramic Research Institute, March 2026.
            </p>
          </div>

          <dl className="grid grid-cols-2 md:grid-cols-4 rounded-[1.5rem] border border-cream/15 overflow-hidden">
            {SOIL_HIGHLIGHTS.map((r, i) => (
              <div
                key={r.k}
                className={`flex flex-col-reverse px-6 py-6 border-cream/10 ${i > 0 ? "md:border-l" : ""} ${i % 2 === 1 ? "border-l md:border-l" : ""} ${i < 2 ? "border-b md:border-b-0" : ""}`}
              >
                <dt className="mt-2 text-[11px] tracking-[0.24em] uppercase text-gold/80">{r.k}</dt>
                <dd className="font-display text-3xl leading-tight">{r.v}</dd>
              </div>
            ))}
          </dl>

          <a
            href="/soil-report"
            className="mt-8 inline-flex items-center gap-3 min-h-[50px] px-6 rounded-full border border-cream/30 text-sm tracking-[0.14em] uppercase hover:border-gold hover:text-gold transition-colors"
          >
            Read the full soil report →
          </a>
        </div>
      </section>

      {/* BOOKING FORM */}
      <section id="book" className="py-24 px-6 md:px-10 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs tracking-[0.4em] uppercase text-clay mb-6">— book with us</p>
          <h2 className="text-4xl md:text-6xl font-display text-earth text-balance">
            Tell us who&apos;s coming.
          </h2>
          <p className="mt-6 text-muted-foreground max-w-lg mx-auto">
            Share a few details and we&apos;ll come back on WhatsApp within a day with dates,
            pricing and a small ritual to hold the booking.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            window.open(whatsappHref(), "_blank");
            // A copy goes to the studio's enquiry list in Bikriup.
            void sendWorkshopEnquiry(form);
          }}
          className="grid md:grid-cols-2 gap-5 bg-cream/70 backdrop-blur border border-border rounded-[1.5rem] p-6 md:p-10"
        >
          <Field label="Your name">
            <input required value={form.name} onChange={onChange("name")} className={inputCls} placeholder="Ananya Rao" />
          </Field>
          <Field label="Phone / WhatsApp">
            <input required value={form.phone} onChange={onChange("phone")} className={inputCls} placeholder="+91 98…" />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={onChange("email")} className={inputCls} placeholder="you@email.com" />
          </Field>
          <Field label="Type of workshop">
            <select value={form.type} onChange={onChange("type")} className={inputCls}>
              <option>School</option>
              <option>Birthday</option>
              <option>Private party</option>
              <option>Corporate offsite</option>
              <option>Something else</option>
            </select>
          </Field>
          <Field label="Preferred date">
            <input type="date" value={form.date} onChange={onChange("date")} className={inputCls} />
          </Field>
          <Field label="How many guests?">
            <input value={form.guests} onChange={onChange("guests")} className={inputCls} placeholder="e.g. 25 children" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Anything else we should know?">
              <textarea rows={4} value={form.message} onChange={onChange("message")} className={inputCls} placeholder="Location, age group, occasion…" />
            </Field>
          </div>
          <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-4 pt-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 bg-earth text-cream px-8 py-4 rounded-full text-sm tracking-widest uppercase hover:bg-clay transition-colors w-full sm:w-auto"
            >
              Send enquiry via WhatsApp →
            </button>
            <a
              href={`mailto:${ENQUIRY_EMAIL}?subject=Workshop enquiry`}
              className="text-sm text-earth underline underline-offset-4 decoration-clay/40 hover:decoration-clay"
            >
              or email {ENQUIRY_EMAIL}
            </a>
          </div>
        </form>
      </section>

      <OrdersEnquiries />

      <SiteFooter />
    </div>
  );
}

const inputCls =
  "w-full bg-cream/60 border border-border rounded-xl px-4 py-3 text-earth placeholder:text-muted-foreground/70 focus:outline-none focus:border-clay transition";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-[0.3em] uppercase text-clay">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
