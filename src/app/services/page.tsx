import type { Metadata } from "next";

import Dispatch from "@/components/Dispatch";
import ManifestPreloader from "@/components/ManifestPreloader";
import { SafeGate } from "@/components/Safe";
import type { CargoKind } from "@/lib/cargo";
import { CHAPTERS } from "@/lib/services";
import { SITE } from "@/lib/site";

/* The phrase buyers search for first, then the cargoes by name: the
   title and the snippet under it in a search result. */
const TITLE = "Freight & Tanker Transport Services in Pakistan — Zia Goods";
const DESCRIPTION =
  "Edible oil, molasses, chemical, FMCG and coal transport in Pakistan, on contract: dedicated tankers and trucks from Port Qasim to every major city.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/services" },
  /* A page's openGraph replaces the layout's rather than merging, so the
     shared card carries this page's own words (and the site's image). */
  openGraph: { type: "website", siteName: "Zia Goods", title: TITLE, description: DESCRIPTION, url: "/services" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

/* Each service as people search for it. */
const SERVICE_NAME: Record<CargoKind, string> = {
  "edible-oil": "Edible oil transport",
  molasses: "Molasses transport",
  chemicals: "Chemical transport",
  "finished-goods": "Finished goods & FMCG transport",
  "dry-cargo": "Coal & dry cargo transport",
};

/* The five services for search engines, in the chapters' own words, and
   where the page sits in the site. The business itself is described on
   the home page, under the same @id. */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ItemList",
      name: "Freight transport services in Pakistan",
      itemListElement: CHAPTERS.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Service",
          "@id": `${SITE}/services#svc-${c.kind}`,
          name: SERVICE_NAME[c.kind],
          serviceType: "Road freight transport",
          description: c.lede,
          url: `${SITE}/services#svc-${c.kind}`,
          provider: { "@id": `${SITE}/#org` },
          areaServed: { "@type": "Country", name: "Pakistan" },
        },
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: "Services", item: `${SITE}/services` },
      ],
    },
  ],
};

/**
 * /services: the manifest is printed, cleared and torn away, and the
 * dispatch office rises in beneath it. The preloader animates #svc-page
 * and marks it revealed, which is the board's cue to flip.
 */
export default function ServicesPage() {
  return (
    <>
      <SafeGate name="manifest preloader">
        <ManifestPreloader />
      </SafeGate>
      <main id="svc-page" className="svcp">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <Dispatch />
      </main>
    </>
  );
}
