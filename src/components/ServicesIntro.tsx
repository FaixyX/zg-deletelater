"use client";

import { useEffect, useState } from "react";

import { CARGO, type CargoKind } from "@/lib/cargo";
import { onCargoShown, selectCargo } from "@/lib/liquid";

import CargoIcon from "./CargoIcon";

/**
 * "One fleet. Five cargoes." -- the contract carriage intro on the home
 * page's services deck. Each `.svc-rise` is brought in by the deck.
 *
 * The chips are the cover flow's index: pick one and its card comes
 * forward (and into view); the chip for the card at the centre is lit.
 */
export default function ServicesIntro() {
  const [shown, setShown] = useState<CargoKind>(CARGO[0].kind);
  useEffect(() => onCargoShown(setShown), []);

  return (
    <div className="svc-intro">
      <p className="svc-rise svc-eyebrow" data-eyebrow="04">
        <i />
        Contract carriage
      </p>
      <h2 className="svc-rise svc-title" id="cc-title">
        One fleet.
        <br />
        Five cargoes.
      </h2>
      <p className="svc-rise svc-lede">
        Contract logistics for the manufacturers who keep Pakistan&apos;s shelves stocked:
        edible oil, molasses, bulk chemicals, finished goods and dry cargo, each on equipment
        kept for that cargo alone.
      </p>
      <ul className="svc-rise svc-chips">
        {CARGO.map((c) => (
          <li key={c.kind}>
            <button
              type="button"
              aria-current={shown === c.kind ? "true" : undefined}
              aria-label={`Show ${c.name}`}
              onClick={() => selectCargo(c.kind)}
            >
              <CargoIcon kind={c.kind} uid={`chip-${c.kind}`} className="svc-chip-icon" />
              {c.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
