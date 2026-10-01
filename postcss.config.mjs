import { fileURLToPath } from "node:url";

/* Resolved from this file rather than written as "./…": Turbopack's
   PostCSS loader resolves plugin keys from its own working directory, not
   from the config's, so a relative path fails to resolve. Deriving it
   from import.meta.url keeps it correct on any machine. */
const dropRemoteFontImports = fileURLToPath(
  new URL("./postcss-drop-remote-font-imports.cjs", import.meta.url)
);

/* Copies every reduced-motion rule under html[data-lite], the light page
   (src/lib/lite.ts). See the plugin. */
const liteMirror = fileURLToPath(new URL("./postcss-lite-mirror.cjs", import.meta.url));

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    [liteMirror]: {},
    /* Strips the Google Fonts @import that dialkit/styles.css opens with,
       so the built site keeps making no third-party font requests. See the
       plugin for why it is stripped here rather than vendored. */
    [dropRemoteFontImports]: {},
  },
};

export default config;
