/**
 * The way out when the page's motion falls over.
 *
 * Much of this site arrives hidden and is shown by script: the hero is
 * opacity 0 until its intro has run, a preloader covers the screen until
 * it has finished, rows and headlines wait off to one side for their
 * entrance. That is the design -- and it means a script that never runs,
 * or stops half way, would leave a visitor on a preloader or a blank page,
 * which from their side is a crash.
 *
 * `rescue()` undoes that: it marks the document (`data-rescue`, which the
 * stylesheet answers by taking the overlays away and showing the hero; its
 * value says why: "motion" for a component that threw, "timeout" from the
 * watchdog),
 * gives back the scroll a preloader was holding, and clears the inline
 * hidden states the entrances had set. It is safe to call at any time and
 * more than once. Callers: the boundaries in components/Safe.tsx when a
 * motion component throws, and the watchdog in app/layout.tsx when the
 * page's script has not started within a few seconds.
 */

/* What the entrances put away with an inline style, by selector. Only
   the properties the entrances write are cleared, so anything else
   inline on these elements is left alone. */
const ENTRANCES: [selector: string, props: string[]][] = [
  ["#hero h1 .ln span", ["transform", "translate"]],
  ["#hero .sub, #hero .actions, #hero .stats", ["transform", "translate", "--in"]],
  ["#hero .actions > *", ["--in"]],
  ["#faq .faq-row, #faq .faq-rise", ["opacity", "transform", "translate", "visibility"]],
  ["#svc-page, #svc-page .svc-rise", ["opacity", "transform", "translate", "scale", "visibility"]],
  [".ct-rise", ["opacity", "transform", "visibility"]],
];

export function rescue() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-rescue", "motion");
  root.classList.remove("scroll-lock");

  for (const [selector, props] of ENTRANCES) {
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      for (const p of props) el.style.removeProperty(p);
    });
  }

  /* The figures that count up, at the figure they were counting to. */
  document.querySelectorAll<HTMLElement>(".num[data-to]").forEach((el) => {
    if (el.dataset.to) el.textContent = el.dataset.to;
  });
}
