import { A, ArticleLayout, H2, P, UL, articleMetadata, type ArticleFaq } from "@/components/ArticleLayout";
import { ARTICLES } from "@/lib/articles";

const a = ARTICLES.find((x) => x.href === "/journal/how-to-cook-dal-in-a-clay-handi")!;

export const metadata = articleMetadata(a.href, a.title, a.description);

const FAQS: ArticleFaq[] = [
  {
    q: "Can I cook dal in a clay handi on a gas stove?",
    a: "Yes, on a low to medium flame once the handi is seasoned. Start with the pot cold and let it warm slowly with the dal and water already inside. Clay does not work on induction.",
  },
  {
    q: "How long does dal take in a clay handi?",
    a: "It is slower than a pressure cooker. As a rough guide, toor dal takes about 45 to 60 minutes on a low flame, and quicker dals like masoor take less. Check by pressing a grain between your fingers.",
  },
  {
    q: "Can I add cold water to a hot clay pot?",
    a: "No. A sudden temperature change can crack the pot. If the dal needs more water, add hot water.",
  },
  {
    q: "Can I do the tadka in the handi?",
    a: "You can on a low flame, but many cooks make it in a small steel pan and pour it over. It is quicker and gentler on the clay.",
  },
];

export default function Page() {
  return (
    <ArticleLayout
      href={a.href}
      title={a.title}
      description={a.description}
      date={a.date}
      intro="Dal is the dish a clay handi was made for: a slow, low simmer that you set going and leave. Here is the method step by step, with the few rules that keep the pot from cracking."
      faqs={FAQS}
      shop={{ href: "/clay-handi", label: "Clay handi" }}
    >
      <H2>Before you start</H2>
      <UL>
        <li>
          Your handi should be <A href="/care/season-your-handi">seasoned</A>. A new, unseasoned pot is more likely to
          crack.
        </li>
        <li>Use a low to medium gas flame or a wood fire. Clay does not work on induction.</li>
        <li>Keep the flame no wider than the base of the pot. A flame licking up the sides stresses the clay.</li>
      </UL>

      <H2>What you need</H2>
      <UL>
        <li>1 cup toor dal (or any dal you like), washed</li>
        <li>About 3 cups of water</li>
        <li>½ teaspoon turmeric and salt to taste</li>
        <li>For the tadka: ghee or oil, cumin, garlic, a dried red chilli, asafoetida</li>
      </UL>

      <H2>Step by step</H2>
      <ol className="mt-4 list-decimal space-y-3 pl-6 text-[1.0625rem] leading-relaxed text-foreground/85">
        <li>
          <strong>Soak the dal</strong> for 20 to 30 minutes, then drain. It helps it cook evenly in the gentle heat.
        </li>
        <li>
          <strong>Add everything cold.</strong> Put the dal, water, turmeric and salt into the handi while it is
          still cold, and set it on the stove.
        </li>
        <li>
          <strong>Heat slowly.</strong> Start on the lowest flame for a few minutes, then raise it to low-medium.
          Never start a clay pot on high heat.
        </li>
        <li>
          <strong>Simmer, partly covered.</strong> Let it come to a gentle simmer and cook, stirring now and then with
          a wooden spoon. Skim any foam. Expect around 45 to 60 minutes for toor dal.
        </li>
        <li>
          <strong>Top up with hot water only.</strong> If it thickens too much, add hot water, never cold.
        </li>
        <li>
          <strong>Make the tadka separately.</strong> In a small pan, heat the ghee, then the cumin, garlic, chilli and
          asafoetida until fragrant. Pour it over the dal.
        </li>
        <li>
          <strong>Rest, covered, for 5 minutes.</strong> The pot keeps the heat in, so the flavours settle. Serve from
          the handi at the table.
        </li>
      </ol>

      <H2>After cooking</H2>
      <P>
        Let the pot cool on a wooden board or folded cloth, never on a cold counter. Wash it with warm water and a
        soft brush, skip the soap, and dry it fully in the sun. More care tips are in the{" "}
        <A href="/journal/mitti-ke-bartan-buying-guide">buying guide</A>, and you can compare it with other pots in{" "}
        <A href="/journal/clay-vs-steel-vs-non-stick-for-dal">clay vs steel vs non-stick for dal</A>.
      </P>
    </ArticleLayout>
  );
}
