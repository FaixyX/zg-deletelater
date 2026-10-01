"use server";

import { CARGO } from "@/lib/cargo";

/**
 * The capacity request, received on the server.
 *
 * Checked here whatever the browser did -- the form's own `required` and
 * `type` attributes are a courtesy to the visitor, not a guarantee -- and
 * then delivered by the first channel that is configured:
 *
 *   RESEND_API_KEY + CONTACT_TO     an email to the sales inbox, via Resend,
 *                                   with Reply-To set to the visitor
 *   CONTACT_WEBHOOK_URL             the request as JSON, POSTed anywhere
 *                                   (Slack, Zapier, Make, a CRM)
 *
 * With neither set, nothing can reach anyone, so the form says it could
 * not send rather than pretending it did. Every request is also written to
 * the server log, so one is never lost to a delivery failure.
 */

export type Field = "cargo" | "from" | "to" | "volume" | "name" | "company" | "phone" | "email" | "notes";

export type RequestState = {
  status: "idle" | "invalid" | "failed" | "sent";
  errors?: Partial<Record<Field, string>>;
  values?: Partial<Record<Field, string>>;
  ref?: string;
};

const LIMITS: Record<Field, number> = {
  cargo: 40,
  from: 80,
  to: 80,
  volume: 80,
  name: 80,
  company: 120,
  phone: 30,
  email: 120,
  notes: 2000,
};

const text = (data: FormData, key: Field) => String(data.get(key) ?? "").trim().slice(0, LIMITS[key]);

/* A reference the visitor can quote back: date and a short random tail. */
function reference() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const tail = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ZG-RQ-${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${tail}`;
}

export async function requestCapacity(_prev: RequestState, data: FormData): Promise<RequestState> {
  /* The honeypot: a field people never see, and bots fill in. Such a
     request is answered as if it went through, so the bot learns nothing. */
  if (String(data.get("website") ?? "")) return { status: "sent", ref: reference() };

  const values = Object.fromEntries(
    (Object.keys(LIMITS) as Field[]).map((k) => [k, text(data, k)])
  ) as Record<Field, string>;

  const errors: Partial<Record<Field, string>> = {};
  if (!CARGO.some((c) => c.kind === values.cargo)) errors.cargo = "Choose what you are moving.";
  if (!values.from) errors.from = "Where does the load start?";
  if (!values.to) errors.to = "Where is it going?";
  if (!values.name) errors.name = "Your name, please.";
  const digits = values.phone.replace(/\D/g, "");
  if (!/^[+\d\s()-]*$/.test(values.phone) || digits.length < 7 || digits.length > 15)
    errors.phone = "A number we can call, e.g. +92 300 1234567.";
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
    errors.email = "That email doesn't look right.";

  if (Object.keys(errors).length) return { status: "invalid", errors, values };

  const ref = reference();
  const cargo = CARGO.find((c) => c.kind === values.cargo)!.name;
  const lines = [
    `Capacity request ${ref}`,
    "",
    `Cargo:    ${cargo}`,
    `Lane:     ${values.from} → ${values.to}`,
    `Volume:   ${values.volume || "—"}`,
    "",
    `Name:     ${values.name}`,
    `Company:  ${values.company || "—"}`,
    `Phone:    ${values.phone}`,
    `Email:    ${values.email || "—"}`,
    "",
    values.notes ? `Notes:\n${values.notes}` : "Notes: —",
  ];
  const body = lines.join("\n");

  /* Always on record, whatever happens to delivery. */
  console.info(`[capacity-request]\n${body}`);

  try {
    const delivered = await deliver({ ref, cargo, values, body });
    if (!delivered) {
      console.error("[capacity-request] No delivery channel configured: set RESEND_API_KEY and CONTACT_TO, or CONTACT_WEBHOOK_URL.");
      return { status: "failed", values };
    }
  } catch (err) {
    console.error("[capacity-request] Delivery failed", err);
    return { status: "failed", values };
  }

  return { status: "sent", ref };
}

async function deliver({
  ref,
  cargo,
  values,
  body,
}: {
  ref: string;
  cargo: string;
  values: Record<Field, string>;
  body: string;
}): Promise<boolean> {
  const { RESEND_API_KEY, CONTACT_TO, CONTACT_FROM, CONTACT_WEBHOOK_URL } = process.env;

  if (RESEND_API_KEY && CONTACT_TO) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        /* Resend's shared sender works before a domain is verified;
           set CONTACT_FROM to an address on your own domain once it is. */
        from: CONTACT_FROM || "Zia Goods website <onboarding@resend.dev>",
        to: CONTACT_TO.split(",").map((s) => s.trim()),
        reply_to: values.email || undefined,
        subject: `Capacity request: ${cargo}, ${values.from} → ${values.to} (${ref})`,
        text: body,
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    return true;
  }

  if (CONTACT_WEBHOOK_URL) {
    const res = await fetch(CONTACT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      /* `text` as well as the fields, so a Slack incoming webhook posts it
         as it is. */
      body: JSON.stringify({ ...values, ref, cargo, text: body }),
    });
    if (!res.ok) throw new Error(`Webhook ${res.status}`);
    return true;
  }

  return false;
}
