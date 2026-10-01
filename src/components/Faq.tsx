import { FAQ } from "@/lib/faq";

import FaqExplorer from "./FaqExplorer";
import FaqLip from "./FaqLip";
import FaqMotion from "./FaqMotion";
import { Safe, SafeGate } from "./Safe";
import LaneBoard from "./LaneBoard";

/**
 * The home page's questions, on the cream ground after the navy of
 * contract carriage.
 *
 *   #faq ── head: the title, and the lane board beside it (LaneBoard)
 *        └─ body: search and topics down the side, the questions as a
 *           manifest of numbered rows (FaqExplorer)
 *
 * Server-rendered, with the answers in the markup whether a row is open
 * or not, so they read without script and are there for search engines.
 * The same words go out as FAQPage structured data.
 */
export default function Faq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a.join(" ") },
    })),
  };

  return (
    <section className="faq section-light" id="faq" aria-labelledby="faq-title">
      <Safe name="FAQ lip">
        <FaqLip />
      </Safe>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="faq-wrap">
        <header className="faq-head">
          <div className="faq-head-copy">
            <p className="faq-eyebrow faq-rise" data-eyebrow="06">
              <i />
              Questions from the loading bay
            </p>
            <h2 className="faq-title faq-rise" id="faq-title">
              Ask before
              <br />
              you load.
            </h2>
            <p className="faq-lede faq-rise">
              What refinery buyers, ghee mill managers and supply chain teams ask before they trust
              us with a load, answered straight. Search, filter by topic, or pick a city on the
              board for its distance and road time from Port Qasim.
            </p>
          </div>

          <div className="faq-rise">
            <LaneBoard />
          </div>
        </header>

        <FaqExplorer />
      </div>

      <SafeGate name="FAQ entrances">
        <FaqMotion />
      </SafeGate>
    </section>
  );
}
