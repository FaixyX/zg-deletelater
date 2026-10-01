# Design: Contract Ledger

Chosen direction (A) from `docs/directions.md`. Product truth lives in `PRODUCT.md`. This file records the
visual system for the redesign. The old dark-navy, all-mono, glowing dot-map site is an anti-reference.

## Idea

Zia Goods' product is a contract kept, so the site is built like the paperwork the trade runs on: a waybill, a
weighing slip, a seal. Cream paper, ink-blue type, thin ruled lines. It should look like something that has been
signed, never like a glowing interface.

## Colour

Neutrals are all tinted toward the blue. There is no pure black and no pure grey.

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `paper` | `#F5EEDF` | page ground | n/a |
| `ink` | `#0C2467` | text, rules, primary buttons | 12.4:1 on paper |
| `deep` | `#071544` | dark bands (the ledger, footer) | paper on deep 15.2:1 |
| `stamp` | `#2146C7` | links, the seal, one emphasised word, key figures | 6.6:1 on paper |
| `rule` | `#B9C4E4` | hairline dividers | 1.5:1, decorative only, never text |
| `seal` | `#B8791A` | the logo's amber, a single dot on the seal | 3.1:1, graphic only |

On `deep`: body text `paper`, secondary `#C4CFF0`, hairlines `#3B4F94`.

Rules: amber appears only where the ZG mark already carries it. No gradients, glows or glass. Text that must be
read is `ink` or `paper`, not `stamp`, below 18px.

## Type

All faces are SIL OFL, self-hosted through `next/font/google`.

- **Newsreader** (display and text, with italics): headlines, figures, the motto in Roman Urdu.
- **Public Sans**: UI, navigation, body copy.
- **IBM Plex Mono**, 12–13px only: slip data such as route codes and seal numbers. Never for headlines or body.
- **Noto Nastaliq Urdu**: the motto in Urdu script, دیکھ مگر پیار سے, at line-height of about 2.1.

Scale on a 1.25 ratio from a 17px body: 17 / 21 / 27 / 34 / 42, with a hero line of `clamp(56px, 8vw, 112px)` at
weight 400, tracking `-0.025em` and line-height 0.98. Figures use lining, tabular numerals. One word of the hero
headline is set in Newsreader italic in `stamp`.

## Layout

- A single wide column with generous side padding (`clamp(20px, 5vw, 72px)`), page-wide hairline rules.
- The hero opens with a waybill strip (consignor, from, road, seal no.) over a huge serif line, with the seal at
  the right. On phones the seal moves above the headline and the strip folds to two columns.
- Figures sit in a ruled slip table, not a row of counting cards.
- Services is a ledger: five ruled rows (number, name, a line, the body, three specs) on the `deep` band.
- Numbers in the margin are real clause or cargo numbers, never decoration. No numbered eyebrow labels.

## Motion

One signature moment: on load the seal presses onto the slip, `scale 1.12 → 1` with a slight rotation, 380ms
on a `cubic-bezier(.2,.8,.2,1)` curve, while the ruled lines draw left to right. Everything else is still paper.

- Tokens live in `src/lib/motion.ts`: `EASE` (all decelerating, no bounce or overshoot), `DUR` (0.32–0.7s, loops
  at 5s), `STAGGER` 0.06s, `LIFT_Y` 14px from below, and `SMOOTH` for Lenis (`lerp` 0.14, `jump` 0.8s).
- Hover: an underline that inks in over about 320ms. Buttons change fill and nothing else.
- No scroll-jacking, no pinned scenes, no preloader, no custom cursor.
- Under `prefers-reduced-motion` every moment shows its finished state.

## Components

- **Buttons:** square corners, 1.5px `ink` border. Primary is `ink` filled with `paper` text. On hover both turn `stamp`.
- **Contact paths:** "Request capacity" and "Call or WhatsApp" have equal weight, side by side. The phone and
  WhatsApp numbers are not yet supplied.
- **Header:** the ink version of the ZG mark (`public/zia-goods-mark-ink.svg`) at 44px tall, a hairline underneath,
  plain text navigation.

## Do

- Show proof: named roads, the real figures (22, 20, 14, 8), procedures a buyer could check.
- Keep rules, margins and alignment exact. The care has to be visible.
- Lead with "Twenty years on the road, nationwide."

## Don't

- Don't use dark-navy heroes, glows, glass, dot-fields or pulsing animation.
- Don't use cards with icon tiles, numbered eyebrow labels, or stat strips that count up.
- Don't use Inter, purple gradients, pure black or grey, or bounce easing.
- Don't invent proof. Certifications, named clients, photography and fleet facts must come from the client.
- Don't state the Karachi to Lahore distance as fact until it is rechecked with M-4 on the route.

## Open

- Phone and WhatsApp numbers, who answers them, and the Urdu motto wording to be confirmed by the client.
- Real photography, certifications, named clients and fleet facts: none are in the repo yet.
- The lab reference implementation is `src/app/(lab)/lab/directions/a/`. It is throwaway code, not the production system.
