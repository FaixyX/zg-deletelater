import type { Metadata } from "next";

import CapacityForm from "@/components/CapacityForm";
import ContactPreloader from "@/components/ContactPreloader";
import { Safe } from "@/components/Safe";

const TITLE = "Request capacity — Zia Goods";
const DESCRIPTION =
  "Tell us what you're moving and where. Zia Goods carries edible oil, molasses, chemicals, finished goods and dry cargo on contract across Pakistan.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { type: "website", siteName: "Zia Goods", title: TITLE, description: DESCRIPTION, url: "/contact" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

/**
 * /contact: the capacity request. The copy on the left says what happens
 * next; the slip on the right is the form (CapacityForm). Under a short,
 * skippable preloader (ContactPreloader).
 */
export default function ContactPage() {
  return (
    <>
      <Safe name="contact preloader">
        <ContactPreloader />
      </Safe>
      <main id="contact-page" className="ct">
        <div className="ct-wrap">
          <section className="ct-intro" aria-labelledby="ct-title">
            <p className="svc-eyebrow" data-eyebrow="01">
              <i />
              Request capacity
            </p>
            <h1 className="ct-title" id="ct-title">
              Tell us
              <br />
              the load.
            </h1>
            <p className="ct-lede">
              What you&apos;re moving, where from and where to. We&apos;ll match it to equipment kept for
              that cargo and come back with a schedule for the lane.
            </p>
            <ol className="ct-steps">
              <li>
                <span>01</span>You send the lane and the cargo.
              </li>
              <li>
                <span>02</span>We call back to survey the route and loading points.
              </li>
              <li>
                <span>03</span>You get equipment, schedule and terms in writing.
              </li>
            </ol>
          </section>

          <CapacityForm />
        </div>
      </main>
    </>
  );
}
