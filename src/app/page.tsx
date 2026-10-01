import type { Metadata } from "next";

import Approach from "@/components/Approach";
import CorridorMap from "@/components/CorridorMap";
import Faq from "@/components/Faq";
import Hero from "@/components/Hero";
import { Safe } from "@/components/Safe";
import ScrollTransition from "@/components/ScrollTransition";
import Services from "@/components/Services";
import { CARGO } from "@/lib/cargo";
import { SITE } from "@/lib/site";

/* Title and description come from the layout. The canonical is set here
   rather than there, where every page would inherit it and point search
   engines at the home page. */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/* Who Zia Goods is, for search engines: the business, the country it
   serves and the five services, in the cargo cards' own words. The FAQ
   section carries its own FAQPage data. */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE}/#org`,
      name: "Zia Goods",
      url: SITE,
      logo: `${SITE}/favicon-512.png`,
      description:
        "Contract carrier moving edible oil, molasses, chemicals, finished goods and dry cargo by road from Port Qasim, Karachi to refineries, mills and plants across Pakistan.",
      areaServed: { "@type": "Country", name: "Pakistan" },
      knowsAbout: [
        "Edible oil transport",
        "Palm oil transportation",
        "Food-grade tanker freight",
        "Bulk liquid transport",
        "Contract logistics",
        "Road freight in Pakistan",
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Contract carriage",
        itemListElement: CARGO.map((c) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: `${c.name} transport`,
            description: c.body,
            provider: { "@id": `${SITE}/#org` },
            areaServed: { "@type": "Country", name: "Pakistan" },
          },
        })),
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: SITE,
      name: "Zia Goods",
      inLanguage: "en-PK",
      publisher: { "@id": `${SITE}/#org` },
    },
  ],
};

export default function Home() {
  return (
    <main id="home">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Hero />
      {/* Mounted between the two sections it joins, so its ScrollTrigger is
          created in page order and refreshes before anything below it. */}
      <Safe name="hero hand-off">
        <ScrollTransition />
      </Safe>
      <Approach map={<CorridorMap />} />
      <Services />
      <Faq />
    </main>
  );
}
