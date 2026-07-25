import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { useState } from "react";
import handsClay from "@/assets/hands-clay.jpg";
import studentPottery from "@/assets/student-pottery.jpg";

export const Route = createFileRoute("/workshops")({
  head: () => ({
    meta: [
      { title: "Workshops & Soil Report — Mudkraft" },
      {
        name: "description",
        content:
          "Book a Mudkraft pottery workshop for schools, birthdays and private parties. Read the full soil report of our river clay from the banks of the Ganges.",
      },
      { property: "og:title", content: "Workshops & Soil Report — Mudkraft" },
      {
        property: "og:description",
        content:
          "Pottery workshops for schools, birthdays and parties — plus the full soil report of our river clay.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://mudkraft.lovable.app/workshops" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&family=Caveat:wght@400;600&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Course",
          name: "Mudkraft Pottery Workshops",
          description:
            "Pottery workshops for schools, birthdays, private parties and corporate offsites — throw on the wheel, hand-build, and take home fired pieces.",
          provider: {
            "@type": "Organization",
            name: "Mudkraft",
            url: "https://mudkraft.lovable.app",
          },
          url: "https://mudkraft.lovable.app/workshops",
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
        }),
      },
    ],
  }),

  component: WorkshopsPage,
});

const WHATSAPP_NUMBER = "919990649990";
const ENQUIRY_EMAIL = "hello@mudkraft.com";

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

const soilRows = [
  { k: "Origin", v: "River bank silt · Ganges tributary, Khurja (Uttar Pradesh)" },
  { k: "Depth of extraction", v: "1.8 – 2.4 metres, below topsoil horizon" },
  { k: "Colour (wet / fired)", v: "Warm ochre-brown / deep terracotta at 980 °C" },
  { k: "Plasticity index", v: "22.4 (highly plastic — excellent for wheel work)" },
  { k: "Particle size", v: "Clay 58% · Silt 34% · Fine sand 8%" },
  { k: "Shrinkage (wet → fired)", v: "9.7% total (5.1% drying + 4.6% firing)" },
  { k: "Water absorption (fired)", v: "12.8% — ideal for cooling matkas & surahis" },
  { k: "pH", v: "7.2 (near-neutral)" },
  { k: "Organic content", v: "1.8% (screened & aged 90 days before use)" },
  { k: "Iron oxide (Fe₂O₃)", v: "6.4% — source of natural terracotta hue" },
  { k: "Silica (SiO₂)", v: "58.1%" },
  { k: "Alumina (Al₂O₃)", v: "18.3%" },
  { k: "Heavy metals (Pb, Cd, As)", v: "Below detectable limits · food-safe" },
  { k: "Firing range", v: "920 – 1040 °C · wood kiln, 48 hrs slow cycle" },
  { k: "Lab & date", v: "Central Glass & Ceramic Research Inst. · Mar 2026" },
];

function WorkshopsPage() {
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
              <a href="#soil" className="text-sm text-earth underline underline-offset-4 decoration-clay/40 hover:decoration-clay">
                Read the soil report
              </a>
            </div>
          </div>
          <div className="md:col-span-5">
            <img
              src={handsClay}
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
              className="group relative rounded-[1.5rem] border border-border bg-cream/50 p-8 hover:border-clay transition-colors"
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
              <div className="mt-8 flex items-baseline justify-between border-t border-border/60 pt-5">
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
              src={studentPottery}
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



      {/* SOIL REPORT */}
      <section id="soil" className="relative py-32 grain overflow-hidden bg-earth">
        <div className="max-w-6xl mx-auto px-6 md:px-10 text-cream">

          <div className="grid md:grid-cols-12 gap-10 mb-14 items-end">
            <div className="md:col-span-7">
              <p className="text-xs tracking-[0.4em] uppercase text-gold mb-6">— soil report</p>
              <h2 className="text-4xl md:text-6xl font-display text-balance">
                Where our <span className="italic text-gold">clay</span> is born.
              </h2>
            </div>
            <p className="md:col-span-5 text-cream/70 leading-relaxed">
              Each batch of our river clay is lab-tested for food safety, mineral balance and
              firing behaviour. Below is the most recent report — filed with the Central Glass
              & Ceramic Research Institute.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-cream/15 bg-cream/[0.04] backdrop-blur overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {soilRows.map((r, i) => (
                <div
                  key={r.k}
                  className={`px-6 py-5 border-cream/10 ${i % 2 === 0 ? "md:border-r" : ""} border-b`}
                >
                  <div className="text-[11px] tracking-[0.3em] uppercase text-gold/80">{r.k}</div>
                  <div className="mt-2 text-cream/90 font-display text-lg leading-snug">{r.v}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-8 text-xs text-cream/50 max-w-2xl">
            Report reference: CGCRI/KHRJ/2026-03-118. A full PDF can be shared on request —
            write to us at{" "}
            <a href={`mailto:${ENQUIRY_EMAIL}`} className="underline decoration-gold/60 hover:text-gold">
              {ENQUIRY_EMAIL}
            </a>
            .
          </p>
        </div>
      </section>

      {/* BOOKING FORM */}
      <section id="book" className="py-24 px-6 md:px-10 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs tracking-[0.4em] uppercase text-clay mb-6">— book with us</p>
          <h2 className="text-4xl md:text-6xl font-display text-earth text-balance">
            Tell us who's coming.
          </h2>
          <p className="mt-6 text-muted-foreground max-w-lg mx-auto">
            Share a few details and we'll come back on WhatsApp within a day with dates,
            pricing and a small ritual to hold the booking.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            window.open(whatsappHref(), "_blank");
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

      {/* FOOTER */}
      <footer className="bg-earth text-cream px-6 md:px-10 pt-16 pb-10 mt-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl md:text-6xl font-display text-gold leading-none tracking-tight"><span className="italic">Mudkraft</span></span>
          </Link>
          <div className="font-hand text-xl text-gold">made from earth, made with love</div>
          <div className="text-xs tracking-widest uppercase text-cream/60">© {new Date().getFullYear()} Mudkraft Studio</div>
        </div>
      </footer>
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
