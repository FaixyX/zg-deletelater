import type { Metadata } from "next";

import "lenis/dist/lenis.css";
import "./lab.css";

/* The design lab: throwaway direction pages, not part of the site. It is a
   root layout of its own, so none of the old site's chrome, scripts or
   stylesheet reach it, and it is kept out of search engines. */
export const metadata: Metadata = {
  title: "Zia Goods — design lab",
  robots: { index: false, follow: false },
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
