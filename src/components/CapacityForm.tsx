"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";

import { type Field, type RequestState, requestCapacity } from "@/app/contact/actions";
import { CARGO } from "@/lib/cargo";
import { CONTACT, DUR, EASE, LIFT_Y, STAGGER, scrollToY, withMotion } from "@/lib/motion";

import CargoIcon from "./CargoIcon";

/**
 * The capacity request, as a booking slip: the powder-blue plate of the
 * services page, riveted, in numbered sections -- cargo, lane, volume,
 * you. Submitted through a server action (app/contact/actions.ts), so it
 * works before the page's script has loaded and checks everything again
 * on the server.
 *
 * Sent, the slip is stamped RECEIVED with a reference to quote, as the
 * manifest on /services is stamped CLEARED.
 */

const INITIAL: RequestState = { status: "idle" };

function Err({ id, msg }: { id: string; msg?: string }) {
  return (
    <span className="ct-err" id={id} aria-live="polite">
      {msg}
    </span>
  );
}

export default function CapacityForm() {
  const [state, action, pending] = useActionState(requestCapacity, INITIAL);
  const root = useRef<HTMLDivElement>(null);
  const v = state.values ?? {};
  const e = state.errors ?? {};

  /* Props for a text field: its value kept across a failed send, and its
     error tied to it for screen readers. */
  const field = (name: Field) => ({
    id: `ct-${name}`,
    name,
    defaultValue: v[name],
    "aria-invalid": e[name] ? true : undefined,
    "aria-describedby": e[name] ? `ct-${name}-err` : undefined,
  });

  /* The slip comes up section by section as the page arrives: a CSS
     animation (.ct-rise), so it plays from the very first paint. Played
     from script it had to hide what the server had already drawn, once
     the page's script arrived -- the form showed, vanished, then rose. */
  const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

  /* A failed check sends focus to the first field that needs attention. */
  useEffect(() => {
    if (state.status !== "invalid" || !state.errors) return;
    const first = Object.keys(state.errors)[0];
    const el = root.current?.querySelector<HTMLElement>(
      first === "cargo" ? "input[name=cargo]" : `#ct-${first}`
    );
    el?.focus();
  }, [state]);

  /* Received: the stamp comes down on the slip. */
  useGSAP(
    () => {
      if (state.status !== "sent") return;
      /* The slip is shorter sent than it was as a form, so bring it into
         view below the header rather than leave the page scrolled past it. */
      const slip = root.current;
      if (slip) scrollToY(Math.max(0, slip.getBoundingClientRect().top + window.scrollY - CONTACT.clearHeader));
      withMotion(() =>
        gsap
          .timeline()
          .from(".ct-done > *", { autoAlpha: 0, y: LIFT_Y, duration: DUR.settle, ease: EASE.lift, stagger: STAGGER })
          .fromTo(
            ".ct-stamp",
            { autoAlpha: 0, scale: CONTACT.stampFrom, rotation: CONTACT.stampTilt + 6 },
            { autoAlpha: 1, scale: 1, rotation: CONTACT.stampTilt, duration: CONTACT.stamp, ease: CONTACT.thump },
            0.15
          )
      );
    },
    { scope: root, dependencies: [state.status] }
  );

  if (state.status === "sent") {
    return (
      <div className="ct-slip ct-slip--done" ref={root}>
        <div className="ct-done" role="status">
          <p className="ct-kicker">Request logged</p>
          <p className="ct-done-title">Thank you. Your request is with dispatch.</p>
          <p className="ct-done-body">
            We&apos;ll come back to you with equipment and a schedule for the lane. If you call us
            before then, quote this reference:
          </p>
          <p className="ct-ref">{state.ref}</p>
          <Link href="/services" className="ct-link">
            See how we carry each cargo →
          </Link>
        </div>
        <div className="ct-stamp" aria-hidden="true">
          RECEIVED
          <small>BY DISPATCH</small>
        </div>
        <Rivets />
      </div>
    );
  }

  return (
    <div className="ct-slip" ref={root}>
      <form action={action} noValidate className="ct-form" aria-describedby="ct-form-note">
        {/* Hidden from people and from screen readers; a bot filling in
            every field fills this one too. */}
        <div className="ct-hp" aria-hidden="true">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <fieldset className="ct-sec ct-rise" style={rise(0)}>
          <legend>
            <span>01</span> What are you moving?
          </legend>
          <div
            className="ct-cargo"
            role="radiogroup"
            aria-invalid={e.cargo ? true : undefined}
            aria-describedby={e.cargo ? "ct-cargo-err" : undefined}
          >
            {CARGO.map((c) => (
              <label key={c.kind} className="ct-chip">
                <input
                  type="radio"
                  name="cargo"
                  value={c.kind}
                  defaultChecked={v.cargo === c.kind}
                  required
                />
                <CargoIcon kind={c.kind} uid={`ct-${c.kind}`} className="ct-chip-icon" />
                <span>{c.name}</span>
              </label>
            ))}
          </div>
          <Err id="ct-cargo-err" msg={e.cargo} />
        </fieldset>

        <fieldset className="ct-sec ct-rise" style={rise(1)}>
          <legend>
            <span>02</span> The lane
          </legend>
          <div className="ct-row">
            <label className="ct-field" htmlFor="ct-from">
              <span className="ct-label">From</span>
              <input {...field("from")} type="text" placeholder="Port Qasim, Karachi" autoComplete="off" required />
              <Err id="ct-from-err" msg={e.from} />
            </label>
            <span className="ct-arrow" aria-hidden="true">→</span>
            <label className="ct-field" htmlFor="ct-to">
              <span className="ct-label">To</span>
              <input {...field("to")} type="text" placeholder="Refinery, Lahore" autoComplete="off" required />
              <Err id="ct-to-err" msg={e.to} />
            </label>
          </div>
          <label className="ct-field" htmlFor="ct-volume">
            <span className="ct-label">
              Volume <em>optional</em>
            </span>
            <input {...field("volume")} type="text" placeholder="e.g. 400 tonnes a month, or 3 loads a week" autoComplete="off" />
          </label>
        </fieldset>

        <fieldset className="ct-sec ct-rise" style={rise(2)}>
          <legend>
            <span>03</span> Who we call back
          </legend>
          <div className="ct-grid">
            <label className="ct-field" htmlFor="ct-name">
              <span className="ct-label">Name</span>
              <input {...field("name")} type="text" autoComplete="name" required />
              <Err id="ct-name-err" msg={e.name} />
            </label>
            <label className="ct-field" htmlFor="ct-company">
              <span className="ct-label">
                Company <em>optional</em>
              </span>
              <input {...field("company")} type="text" autoComplete="organization" />
            </label>
            <label className="ct-field" htmlFor="ct-phone">
              <span className="ct-label">Phone or WhatsApp</span>
              <input {...field("phone")} type="tel" inputMode="tel" autoComplete="tel" placeholder="+92" required />
              <Err id="ct-phone-err" msg={e.phone} />
            </label>
            <label className="ct-field" htmlFor="ct-email">
              <span className="ct-label">
                Email <em>optional</em>
              </span>
              <input {...field("email")} type="email" inputMode="email" autoComplete="email" />
              <Err id="ct-email-err" msg={e.email} />
            </label>
          </div>
          <label className="ct-field" htmlFor="ct-notes">
            <span className="ct-label">
              Anything else <em>optional</em>
            </span>
            <textarea {...field("notes")} rows={3} placeholder="Start date, loading hours, special handling…" />
          </label>
        </fieldset>

        <div className="ct-foot ct-rise" style={rise(3)}>
          <p className="ct-note" id="ct-form-note" aria-live="polite">
            {state.status === "failed"
              ? "We couldn't send this just now. Your details are still here, so please try again in a moment."
              : state.status === "invalid"
                ? "A few details need a look. They're marked above."
                : "We use these details only to reply to this request."}
          </p>
          <button type="submit" className="glass glass--cta glass--primary ct-submit" disabled={pending}>
            {pending ? "Sending…" : "Send request"}
          </button>
        </div>
      </form>
      <Rivets />
    </div>
  );
}

function Rivets() {
  return (
    <>
      <i className="ct-rivet" aria-hidden="true" />
      <i className="ct-rivet" aria-hidden="true" />
      <i className="ct-rivet" aria-hidden="true" />
      <i className="ct-rivet" aria-hidden="true" />
    </>
  );
}
