"use client";

import { gsap } from "gsap";
import { useEffect, useRef } from "react";

import { DISPATCH, prefersReducedMotion } from "@/lib/motion";

/**
 * A line of split-flap tiles, like a station's departure board. The text
 * is rendered in full from the start (so it reads without script, and to
 * screen readers); when `play` turns true, or `text` changes after that,
 * each tile flips through a run of random characters before landing on
 * its own, left to right.
 *
 * Tiles can also land on a solid colour instead of a letter -- the colour
 * flaps of a Vestaboard -- given as `chips`, index to CSS colour. With
 * `fit`, the line sizes its tiles to fill its container's width exactly
 * (see .flaps--fit), so every line of a board with the same cell count
 * lines up column for column.
 *
 * Each tile is one character in a fixed-width cell, split across the
 * middle by a hairline (the <i>). A flip swaps the character and drops
 * the new face down from nearly edge-on to flat -- one transform per
 * step, nothing that reflows.
 */

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·/-";

type Props = {
  text: string;
  /** Pad to this many tiles, so a board's columns line up. */
  width?: number;
  /** Index -> colour: tiles that land on a colour rather than a letter. */
  chips?: Record<number, string>;
  /** Tiles from this index on are set in the accent colour. */
  accentFrom?: number;
  /** Size the tiles to fill the container's width. */
  fit?: boolean;
  play?: boolean;
  /** Seconds to wait before the first tile moves. */
  delay?: number;
  label?: string;
  className?: string;
};

export default function SplitFlap({
  text,
  width,
  chips,
  accentFrom,
  fit,
  play = true,
  delay = 0,
  label,
  className,
}: Props) {
  const root = useRef<HTMLSpanElement>(null);
  const played = useRef(false);
  const cells = Math.max(width ?? 0, text.length);
  const target = text.toUpperCase().padEnd(cells, " ");
  const chipKey = chips ? JSON.stringify(chips) : "";

  useEffect(() => {
    const el = root.current;
    if (!el || !play) return;
    const tiles = Array.from(el.querySelectorAll<HTMLElement>(".flap"));
    const land = (tile: HTMLElement, i: number) => {
      const face = tile.querySelector("b")!;
      /* A flat face needs no transform, and a leftover rotateX(0) keeps
         the tile on a GPU layer of its own. */
      face.style.transform = "";
      const chip = chips?.[i];
      face.textContent = chip ? " " : target[i];
      if (chip) {
        tile.dataset.chip = "";
        tile.style.setProperty("--chip", chip);
      } else delete tile.dataset.chip;
    };
    /* A line that isn't drawn at all -- the board's other layout, hidden
       at this width -- lands at once: spinning it is hundreds of tweens
       for nobody. */
    if (prefersReducedMotion() || !el.getClientRects().length) {
      tiles.forEach(land);
      return;
    }
    /* The first play spins the whole line; after that, only the tiles
       whose character actually changes. */
    const first = !played.current;
    played.current = true;
    const tl = gsap.timeline({ delay });
    tiles.forEach((tile, i) => {
      const face = tile.querySelector("b")!;
      const chip = chips?.[i];
      if (!first && face.textContent === (chip ? " " : target[i]) && !!chip === "chip" in tile.dataset) return;
      const blank = target[i] === " " && !chips?.[i];
      /* Blanks that are already blank stay put: a board doesn't spin
         empty cells. */
      if (blank && face.textContent === " " && !("chip" in tile.dataset)) return;
      const spins = DISPATCH.flapSpins + Math.floor(Math.random() * DISPATCH.flapSpinsJitter);
      const at = i * DISPATCH.flapStagger;
      for (let s = 0; s <= spins; s++) {
        const t = at + s * DISPATCH.flapStep;
        if (s === spins) tl.call(() => land(tile, i), undefined, t);
        else {
          const ch = CHARSET[Math.floor(Math.random() * CHARSET.length)];
          tl.call(() => {
            delete tile.dataset.chip;
            face.textContent = ch;
          }, undefined, t);
        }
        tl.fromTo(
          face,
          { rotationX: -DISPATCH.flapTilt },
          {
            rotationX: 0,
            duration: DISPATCH.flapStep,
            ease: DISPATCH.flapEase,
            immediateRender: false,
            /* Flat again: drop the transform, and the layer it held. */
            ...(s === spins && { clearProps: "transform" }),
          },
          t
        );
      }
    });
    return () => {
      tl.kill();
      tiles.forEach(land);
    };
    // chips is compared by value through chipKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play, target, delay, chipKey]);

  return (
    <span
      className={`flaps ${fit ? "flaps--fit" : ""} ${className ?? ""}`}
      style={{ "--n": cells } as React.CSSProperties}
      ref={root}
      role="img"
      aria-label={label ?? text}
    >
      {Array.from(target).map((ch, i) => {
        const chip = chips?.[i];
        return (
          <span
            className={`flap ${accentFrom !== undefined && i >= accentFrom ? "flap--accent" : ""}`}
            key={i}
            data-chip={chip ? "" : undefined}
            style={chip ? ({ "--chip": chip } as React.CSSProperties) : undefined}
          >
            <b>{chip ? " " : ch}</b>
            <i />
          </span>
        );
      })}
    </span>
  );
}
