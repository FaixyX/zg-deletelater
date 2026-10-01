import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Space_Mono } from "next/font/google";
import Link from "next/link";

import Alive from "@/components/Alive";
import CustomCursor from "@/components/CustomCursor";
import EyebrowReveal from "@/components/EyebrowReveal";
import HeaderAutoHide from "@/components/HeaderAutoHide";
import { Safe } from "@/components/Safe";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import SmoothScroll from "@/components/SmoothScroll";
import { SITE } from "@/lib/site";

import "lenis/dist/lenis.css";
import "../globals.css";

/* The site's one face. Space Mono is cut in two weights only, so anything
   set between them resolves to one of these. */
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

/* The watchdog: plain text in the page, run before anything else, because
   it has to work when the rest of the script does not.
   - If the page's script has not started within ten seconds (Alive marks
     the document the moment it has), the preloaders come away and the page
     shows as the server sent it, its counted figures at their real values
     (lib/rescue.ts, and the html[data-rescue] rules in globals.css).
   - It counts starts: a page that keeps starting and never lasting ten
     seconds is crashing the browser, and from the third start is given the
     light version for half an hour (lib/lite.ts, html[data-lite]). Kept in
     step with the constants there: 90s window, 3 starts, 30 minutes. */
const WATCHDOG = `(function(d){var A=function(k,v){d.setAttribute(k,v)};try{var s=window.localStorage,n=Date.now(),B="zg:boots",L="zg:lite",q=location.search;if(/[?&]lite=1(&|$)/.test(q))s.setItem(L,String(n+864e5));if(/[?&]lite=0(&|$)/.test(q)){s.removeItem(L);s.removeItem(B)}var b=JSON.parse(s.getItem(B)||"[]").filter(function(t){return n-t<9e4});b.push(n);s.setItem(B,JSON.stringify(b));if(b.length>=3)s.setItem(L,String(n+18e5));if(+s.getItem(L)>n)A("data-lite","")}catch(e){}try{if(navigator.deviceMemory&&navigator.deviceMemory<=2)A("data-lite","")}catch(e){}setTimeout(function(){if(!d.hasAttribute("data-alive")){A("data-rescue","timeout");Array.prototype.forEach.call(document.querySelectorAll(".num[data-to]"),function(e){e.textContent=e.getAttribute("data-to")})}},10000)})(document.documentElement)`;

/* The home page's title and description, and the default for any page
   that doesn't set its own. The phrase buyers search for comes first;
   the description reads as a sentence, since it is the snippet under the
   result. */
const TITLE = "Edible Oil Tanker Transport in Pakistan — Zia Goods";
const DESCRIPTION =
  "Food-grade oil tankers from Port Qasim, Karachi to refineries and ghee mills in Lahore, Multan and across Pakistan. Own fleet, on contract, 20 years running.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Zia Goods",
  /* The card a link shows when it is pasted into WhatsApp, LinkedIn,
     Slack or an email: the image is app/opengraph-image.tsx. */
  openGraph: {
    type: "website",
    siteName: "Zia Goods",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_PK",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

/* The browser chrome in the site's navy: the address bar on a phone
   and the overscroll above the page match the hero instead of flashing
   white. */
export const viewport: Viewport = {
  themeColor: "#011f7b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={spaceMono.variable}>
      <body className="bg-navy font-sans text-cream">
        <script dangerouslySetInnerHTML={{ __html: WATCHDOG }} />
        <Alive />
        {/* Fixed and transparent so it sits over the hero exactly where the
            old in-hero bar did. Wrapper ignores pointer events; children
            take them back, so the map underneath stays unobstructed. The
            logo is centred on the header's line (--header-mid), as the
            nav pill is, so the two read as one row. */}
        <header id="site-header" className="pointer-events-none fixed inset-x-0 top-0 z-[3] flex items-center justify-between px-[var(--page-pad)] pt-[calc(var(--header-mid)_-_var(--logo-h)_/_2)] max-[900px]:pt-[20px] [&>*]:pointer-events-auto">
          {/* The ZG mark, its swoosh a motorway -- lane lines, an amber
              centre line and a destination dot -- on its own: the nav pill
              beside it already carries the name. On phones the pill runs
              the full width, so the mark gives way. */}
          <Link className="relative block shrink-0 leading-[0] max-[900px]:hidden" href="/" aria-label="Zia Goods — home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/zia-goods-mark.svg"
              alt="Zia Goods"
              width={630}
              height={310}
              className="h-[var(--logo-h)] w-auto"
            />
            {/* The same mark in ink, shown only over the part of the logo
                that sits on a light ground, so the logo splits exactly
                where the page changes colour under it (ScrollTransition).
                Its own file rather than the cream one inverted, so the
                centre line and the destination stay amber. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/zia-goods-mark-ink.svg"
              alt=""
              aria-hidden="true"
              width={630}
              height={310}
              className="logo-ink h-[var(--logo-h)] w-auto"
            />
          </Link>
        </header>

        {/* Each of these only moves or decorates the page: if one throws
            it stops alone, and the page carries on (components/Safe.tsx). */}
        <Safe name="smooth scroll">
          <SmoothScroll />
        </Safe>
        <Safe name="nav">
          <SiteNav />
        </Safe>
        <Safe name="header auto-hide">
          <HeaderAutoHide />
        </Safe>
        <Safe name="eyebrow reveal">
          <EyebrowReveal />
        </Safe>

        {children}

        <SiteFooter />
        <Safe name="cursor">
          <CustomCursor />
        </Safe>

        {/* Real visitors' load and interaction timings (Core Web Vitals)
            and page views, reported to the Vercel dashboard. Both are
            no-ops outside a Vercel deployment. */}
        <Safe name="analytics">
          <SpeedInsights />
          <Analytics />
        </Safe>
      </body>
    </html>
  );
}
