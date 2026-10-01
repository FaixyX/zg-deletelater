/**
 * PostCSS plugin: removes remote font @imports from third-party CSS.
 *
 * `dialkit/styles.css` opens with
 *
 *     @import url('https://fonts.googleapis.com/css2?family=Geist+Mono...')
 *
 * which would make every page pulling in that stylesheet fetch a Google
 * Fonts stylesheet at load. This app self-hosts its fonts through
 * next/font precisely so it makes no third-party font requests, and a dev
 * tool should not quietly undo that.
 *
 * The font is used for three numeric readouts in the DialKit panel, each
 * of which already declares `monospace` as its fallback, so removing the
 * import costs the panel a typeface and nothing else.
 *
 * Stripping it here rather than vendoring the stylesheet keeps DialKit
 * upgradable: `npm update dialkit` needs no follow-up.
 *
 * It lives in its own module because Turbopack's PostCSS loader resolves
 * plugins by name and calls them; an inline plugin object in
 * postcss.config.mjs fails with "i is not a function".
 */
const REMOTE_FONT_HOST = /https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com)/;

const plugin = () => ({
  postcssPlugin: "drop-remote-font-imports",
  AtRule: {
    import: (rule) => {
      if (REMOTE_FONT_HOST.test(rule.params)) rule.remove();
    },
  },
});

plugin.postcss = true;

module.exports = plugin;
