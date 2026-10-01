/**
 * PostCSS plugin: gives the light page the reduced-motion stylesheet.
 *
 * The light page (src/lib/lite.ts) runs the site's reduced-motion version:
 * its scripts take their still, unscrubbed paths. But a stylesheet can only
 * answer a media query, and "a device that could not carry the full page"
 * is not one -- so every rule the site has written for
 * `@media (prefers-reduced-motion: reduce)` (its own, and Tailwind's
 * `motion-reduce:` utilities) would be missing, and the stills would be
 * laid out for the full page: the night run's two lines on top of each
 * other, scenes held open for a scroll that is not driving them.
 *
 * So each such block is copied, rule for rule, under `html[data-lite]`.
 * Done here, at build time, so the two can never drift apart as the
 * stylesheet changes. The copy is more specific than the original, which
 * is harmless: both mean the same thing.
 *
 * It lives in its own module for the reason the font plugin does:
 * Turbopack's PostCSS loader resolves plugins by name and calls them.
 */
const REDUCED = /^\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)$/;

/* `:root[...] .x` -> `:root[data-lite][...] .x`; `html ...` likewise;
   anything else is simply put under `html[data-lite] `. */
const lite = (selector) => {
  const s = selector.trim();
  if (s.startsWith(":root")) return ":root[data-lite]" + s.slice(":root".length);
  if (/^html(?![\w-])/.test(s)) return "html[data-lite]" + s.slice("html".length);
  return "html[data-lite] " + s;
};

const plugin = () => ({
  postcssPlugin: "lite-mirror-reduced-motion",
  AtRule: {
    media: (atRule) => {
      if (!REDUCED.test(atRule.params.trim()) || atRule.__liteMirrored) return;
      atRule.__liteMirrored = true;

      const mirror = [];
      atRule.each((node) => {
        if (node.type === "rule") {
          const copy = node.clone({ selectors: node.selectors.map(lite) });
          mirror.push(copy);
        } else if (node.type === "atrule" && node.name !== "keyframes") {
          /* An at-rule nested in the block (a @supports, say): copied as it
             is, with its own rules put under the light page. */
          const copy = node.clone();
          copy.walkRules((r) => {
            r.selectors = r.selectors.map(lite);
          });
          mirror.push(copy);
        }
      });
      if (mirror.length) atRule.after(mirror);
    },
  },
});

plugin.postcss = true;

module.exports = plugin;
