import { A, ArticleLayout, H2, P, UL, articleMetadata, type ArticleFaq } from "@/components/ArticleLayout";
import { ARTICLES } from "@/lib/articles";

const a = ARTICLES.find((x) => x.href === "/journal/mitti-ke-bartan-buying-guide")!;

export const metadata = articleMetadata(a.href, a.title, a.description);

const FAQS: ArticleFaq[] = [
  {
    q: "How do I know a clay pot is unglazed?",
    a: "Look and feel the inside: an unglazed pot is matte and slightly rough, with no shine. A glazed pot has a glassy, smooth surface. If you put a few drops of water on an unglazed pot, the clay absorbs them.",
  },
  {
    q: "Which clay pot size should I buy for a family of four?",
    a: "As a rough guide, a 2.5 L handi suits a family dal or rice for four to five people. Choose one size up if you often cook for guests.",
  },
  {
    q: "Can I use a clay pot on gas?",
    a: "Yes, on a low to medium flame once the pot is seasoned, starting cold. Induction does not work with clay.",
  },
  {
    q: "How do I check a clay pot for cracks?",
    a: "Tap the rim gently with a knuckle. A clear ring usually means the pot is sound; a dull, flat sound can point to a hairline crack. Also look for cracks inside and at the base before you buy.",
  },
];

export default function Page() {
  return (
    <ArticleLayout
      href={a.href}
      title={a.title}
      description={a.description}
      date={a.date}
      intro="Choosing clay cookware is easier when you know what to look for. This guide covers which shape to pick, how big, how to tell a good unglazed pot, and what to do before the first meal."
      faqs={FAQS}
      shop={{ href: "/clay-cookware", label: "Clay cookware" }}
    >
      <H2>1. Pick the shape for how you cook</H2>
      <UL>
        <li>
          <strong>Handi:</strong> a deep, rounded pot for dal, rice, biryani and curries. The all-rounder. See{" "}
          <A href="/clay-handi">clay handis</A>.
        </li>
        <li>
          <strong>Kadai:</strong> wider and shallower, good for sabzi, paneer and thick gravies. See{" "}
          <A href="/clay-kadai">clay kadais</A>.
        </li>
        <li>
          <strong>Bhagona:</strong> a larger pot for cooking for a group.
        </li>
        <li>
          <strong>Dahi handi:</strong> for setting and serving curd. See <A href="/dahi-handi">dahi handis</A>.
        </li>
        <li>
          <strong>Matka and jug:</strong> for drinking water. See <A href="/clay-water-pot">matkas and water pots</A>.
        </li>
      </UL>

      <H2>2. Choose the size</H2>
      <P>
        As a rough guide, 1.5 L suits two or three people, 2.5 L suits four or five, and 4 L suits a bigger family or
        guests. Clay holds heat well, so a pot that is two-thirds full cooks better than one filled to the brim. When in
        doubt, go one size up.
      </P>

      <H2>3. Check that it is really unglazed</H2>
      <UL>
        <li>The inside should be matte and slightly rough, not shiny.</li>
        <li>A few drops of water should soak in rather than bead up.</li>
        <li>Ask the seller whether any glaze or paint is used and for the lab report on the clay. Ours is on the <A href="/soil-report">soil report page</A>.</li>
      </UL>

      <H2>4. Inspect before you buy</H2>
      <UL>
        <li>Tap the rim: a clear ring is a good sign, a dull sound can mean a hairline crack.</li>
        <li>Run a finger over the base and inside for cracks or rough chips.</li>
        <li>Check that the base sits flat and the lid, if any, fits well.</li>
      </UL>

      <H2>5. Know your stove</H2>
      <P>
        Clay works on a low to medium gas flame and on a wood fire. It does not work on induction. Always start cold,
        heat slowly, and place a hot pot on a wooden board or cloth, never a cold counter.
      </P>

      <H2>6. Season it before the first meal</H2>
      <P>
        A new pot should be soaked, dried in the shade, oiled and given a first batch of rice on the lowest flame. The
        full steps are in our <A href="/care/season-your-handi">seasoning guide</A>. After that, wash with warm water and
        a soft brush, skip the soap, and dry fully before storing.
      </P>
    </ArticleLayout>
  );
}
