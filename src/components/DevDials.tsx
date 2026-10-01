"use client";

import dynamic from "next/dynamic";

/**
 * The gate that keeps DialKit out of production.
 *
 * Next inlines NODE_ENV, so the production branch folds to `null` and the
 * chunk holding DevPanels -- DialKit, its `motion` peer and its
 * stylesheet -- is never requested. Measured before this split, those
 * libraries were 395KB and 269KB of the 838KB of JS a visitor
 * downloaded, for a panel DialKit hides in production anyway.
 *
 * The stylesheet is the other reason for the split: it opens with an
 * @import of Google Fonts, and imported at the top level that lands in
 * the page's main stylesheet. (The PostCSS plugin strips it as well --
 * belt and braces, because the two failure modes are independent.)
 */
const DevPanels = dynamic(() => import("./DevPanels"), { ssr: false });

export default function DevDials() {
  if (process.env.NODE_ENV === "production") return null;
  return <DevPanels />;
}
