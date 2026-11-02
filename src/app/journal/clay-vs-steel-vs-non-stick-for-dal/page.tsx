import { A, ArticleLayout, H2, P, UL, articleMetadata, type ArticleFaq } from "@/components/ArticleLayout";
import { ARTICLES } from "@/lib/articles";

const a = ARTICLES.find((x) => x.href === "/journal/clay-vs-steel-vs-non-stick-for-dal")!;

export const metadata = articleMetadata(a.href, a.title, a.description);

const ROWS: Array<[string, string, string, string]> = [
  ["Heat", "Heats slowly, holds heat long after the flame is off", "Heats fast, cools fast; thin steel can scorch at the base", "Heats fast; coating limits how hot it should go"],
  ["Flame", "Low to medium gas or wood; start cold", "Any heat", "Low to medium; avoid high heat"],
  ["Induction", "No, clay is not magnetic", "Usually yes, if the base is magnetic steel", "Only if the base is made for it"],
  ["Care", "No soap, season before first use, dry fully", "Easiest: wash and go", "No metal spoons; coating wears over time"],
  ["Breakage", "Can crack if heated fast or dropped", "Very durable", "Durable, but the coating can scratch"],
  ["Best for", "Slow dal, biryani, curries, dahi", "Tadka, quick sabzi, everyday cooking", "Eggs, low-oil quick cooking"],
];

const FAQS: ArticleFaq[] = [
  {
    q: "Is dal cooked in a clay handi different?",
    a: "Many people like the slow, even simmer clay gives, which suits dal that is cooked low for a long time. It is a matter of taste and method rather than a guaranteed difference.",
  },
  {
    q: "Can I do the tadka in a clay handi?",
    a: "You can, on a low flame once the pot is seasoned. Many cooks make the tadka in a small steel pan and pour it over, which is quicker and gentler on the clay.",
  },
  {
    q: "Is clay cookware worth it if I only cook quickly?",
    a: "Probably not for every day. Clay shines when you cook slowly. If most of your cooking is fast and hot, keep steel for that and use clay for the dishes that benefit from slow heat.",
  },
];

export default function Page() {
  return (
    <ArticleLayout
      href={a.href}
      title={a.title}
      description={a.description}
      date={a.date}
      intro="There is no best pot, only the right pot for the dish. Here is a plain comparison of clay, steel and non-stick for cooking dal, including the cases where clay is the wrong choice."
      faqs={FAQS}
      shop={{ href: "/clay-handi", label: "Clay handi" }}
    >
      <H2>Side by side</H2>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead className="bg-earth text-cream">
            <tr>
              {["", "Clay handi", "Steel", "Non-stick"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, ...cells], i) => (
              <tr key={label} className={i % 2 ? "bg-cream/30" : "bg-cream/60"}>
                <th scope="row" className="px-4 py-3 text-left font-medium text-earth">
                  {label}
                </th>
                {cells.map((c) => (
                  <td key={c} className="px-4 py-3 align-top text-foreground/80">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2>When clay is the right pot</H2>
      <UL>
        <li>You cook dal, rajma, biryani or curries slowly on a low flame.</li>
        <li>You want a pot that goes from the stove to the table and keeps food warm.</li>
        <li>You do not mind a little care: seasoning once, no soap, drying fully.</li>
      </UL>

      <H2>When it is not</H2>
      <UL>
        <li>You cook on an induction hob. Clay will not work on it.</li>
        <li>You need quick, high-heat cooking every day.</li>
        <li>You are likely to move a hot pot to a cold surface or wash everything with soap and a scourer.</li>
      </UL>

      <H2>A practical way to use both</H2>
      <P>
        Cook the dal slowly in clay, and make the tadka in a small steel pan. You get the slow simmer where it helps and
        the speed where it matters. If you are new to clay, <A href="/care/season-your-handi">season your handi first</A>{" "}
        and choose the size using our <A href="/journal/mitti-ke-bartan-buying-guide">buying guide</A>.
      </P>
    </ArticleLayout>
  );
}
