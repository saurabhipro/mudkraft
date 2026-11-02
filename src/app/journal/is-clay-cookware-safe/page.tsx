import { A, ArticleLayout, H2, P, UL, articleMetadata, type ArticleFaq } from "@/components/ArticleLayout";
import { ARTICLES } from "@/lib/articles";

const a = ARTICLES.find((x) => x.href === "/journal/is-clay-cookware-safe")!;

export const metadata = articleMetadata(a.href, a.title, a.description);

const FAQS: ArticleFaq[] = [
  {
    q: "What did the lab test in your clay?",
    a: "The Central Glass & Ceramic Research Institute tested our Khurja river clay for pH, composition, water absorption and the heavy metals lead, cadmium and arsenic. Lead, cadmium and arsenic were not detected above the lab's detection limits, and the pH was 7.2.",
  },
  {
    q: "Is there any glaze or paint on a Mudkraft pot?",
    a: "No. Our cookware is unglazed and unpainted, so food only touches fired clay. The pots are wood-fired for 48 hours at 920–1040 °C.",
  },
  {
    q: "Can a clay pot crack on the stove?",
    a: "Yes, any clay pot can if it is heated too fast. Season a new pot first, start on a low flame, never put a hot pot on a cold surface, and use a diffuser on a gas ring if you want extra protection.",
  },
];

export default function Page() {
  return (
    <ArticleLayout
      href={a.href}
      title={a.title}
      description={a.description}
      date={a.date}
      intro="Clay is one of the oldest cooking materials there is, but not every clay pot is made the same way. Here is what actually matters for safety, what our lab report says, and how to question any seller."
      faqs={FAQS}
      shop={{ href: "/clay-cookware", label: "Clay cookware" }}
    >
      <H2>Where the real risk is: glaze and soil</H2>
      <P>
        Plain fired clay is not the usual worry. The concerns people raise about clay pots come from two things:
      </P>
      <UL>
        <li>
          <strong>Glazes and paints.</strong> Some glazes, especially on cheap or decorative ware, can contain lead or
          cadmium. Decorative pots are not meant for food at all.
        </li>
        <li>
          <strong>The clay itself.</strong> Clay dug from contaminated ground can carry heavy metals into the finished
          pot. This is why the source of the clay matters.
        </li>
      </UL>

      <H2>What our lab report found</H2>
      <P>
        Our river clay from Khurja was tested by the Central Glass &amp; Ceramic Research Institute (CGCRI). The numbers
        that matter most:
      </P>
      <UL>
        <li>
          <strong>Lead, cadmium and arsenic:</strong> not detected above the lab&apos;s detection limits.
        </li>
        <li>
          <strong>pH:</strong> 7.2, which is near-neutral.
        </li>
        <li>
          <strong>Water absorption (fired):</strong> 12.8%. The walls stay porous, which is why a new handi is soaked
          before first use and why a matka cools water.
        </li>
        <li>
          <strong>Firing:</strong> a 48-hour wood kiln cycle in the 920–1040 °C range.
        </li>
        <li>
          <strong>Glaze:</strong> none on any cookware piece.
        </li>
      </UL>
      <P>
        The complete figures are on our <A href="/soil-report">soil report page</A>.
      </P>

      <H2>What this does not claim</H2>
      <P>
        A lab report on the clay is not a promise about health outcomes, and we do not make any. It tells you what was
        measured: no detectable lead, cadmium or arsenic, and no glaze. It also does not make a pot unbreakable. Clay
        is fragile and needs a little care, covered in our <A href="/care/season-your-handi">seasoning guide</A>.
      </P>

      <H2>Three questions to ask any clay pot seller</H2>
      <UL>
        <li>
          <strong>Is it glazed inside?</strong> For cooking, an unglazed interior avoids the question of what is in the
          glaze.
        </li>
        <li>
          <strong>Can I see a lab report for the clay?</strong> Ask for the lab&apos;s name and the report number, not
          just a statement that it is safe.
        </li>
        <li>
          <strong>Where is the clay from and how was the pot fired?</strong> A proper, long firing gives a strong pot.
        </li>
      </UL>
      <P>
        If you would like to see how ours is made, read about <A href="/clay-handi">our clay handis</A> or{" "}
        <A href="/journal/mitti-ke-bartan-buying-guide">how to choose mitti ke bartan</A>.
      </P>
    </ArticleLayout>
  );
}
