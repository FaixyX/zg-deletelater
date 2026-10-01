"use client";

import { gsap } from "gsap";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FAQ, FAQ_TOPICS, type FaqItem, type FaqTopicId } from "@/lib/faq";
import { scrollToY } from "@/lib/motion";

const TOPIC = Object.fromEntries(FAQ_TOPICS.map((t) => [t.id, t])) as Record<
  FaqTopicId,
  (typeof FAQ_TOPICS)[number]
>;
/* Q.01, Q.02 ... by place in the full list, so a question keeps its
   number however the list is filtered. */
const NUMBER = Object.fromEntries(FAQ.map((f, i) => [f.id, `Q.${String(i + 1).padStart(2, "0")}`]));
const TEXT = Object.fromEntries(
  FAQ.map((f) => [f.id, [f.q, ...f.a, ...(f.facts ?? []), TOPIC[f.topic].label].join(" ").toLowerCase()])
);

/* How many matching answers a search opens by itself. */
const OPEN_ON_SEARCH = 3;
/* How long "Link copied" shows, ms. */
const COPIED_FOR = 1800;

type Filter = FaqTopicId | "all";

const termsOf = (query: string) => query.trim().toLowerCase().split(/\s+/).filter(Boolean);
const matches = (item: FaqItem, terms: string[]) => terms.every((t) => TEXT[item.id].includes(t));
/* Filtering moves rows whose entrance (FaqMotion) hasn't played up into
   view, where it would never fire: once the list is being used, every
   row simply shows. */
const settleRows = () => gsap.set("#faq .faq-row", { clearProps: "opacity,transform" });
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The text with every search term in it marked. */
function Marked({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>;
  const parts = text.split(new RegExp(`(${terms.map(escape).join("|")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 ? <mark key={i}>{part}</mark> : <Fragment key={i}>{part}</Fragment>
      )}
    </>
  );
}

/**
 * The questions as a manifest: numbered rows that open in place, a
 * search that filters and marks as you type, topics with live counts,
 * and a link to every answer (/#faq-<id>) that opens it on arrival.
 */
export default function FaqExplorer() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<Set<string>>(() => new Set([FAQ[0].id]));
  const [copied, setCopied] = useState<string | null>(null);
  const search = useRef<HTMLInputElement>(null);

  const terms = useMemo(() => termsOf(query), [query]);
  const found = useMemo(() => FAQ.filter((f) => matches(f, terms)), [terms]);
  const shown = filter === "all" ? found : found.filter((f) => f.topic === filter);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: found.length };
    for (const f of found) c[f.topic] = (c[f.topic] ?? 0) + 1;
    return c;
  }, [found]);
  const allOpen = shown.length > 0 && shown.every((f) => open.has(f.id));

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onSearch = (value: string) => {
    settleRows();
    setQuery(value);
    const t = termsOf(value);
    /* A search opens its first few answers, so the match shows in
       context; clearing it leaves open whatever was. */
    if (t.length) {
      const hits = FAQ.filter((f) => matches(f, t) && (filter === "all" || f.topic === filter));
      setOpen(new Set(hits.slice(0, OPEN_ON_SEARCH).map((f) => f.id)));
    }
  };

  /* Arriving on /#faq-<id>, or following one on the page: open it, clear
     anything that would hide it, and bring it into view. */
  const reveal = useCallback(() => {
    const id = window.location.hash.replace(/^#faq-/, "");
    if (id === window.location.hash || !FAQ.some((f) => f.id === id)) return;
    settleRows();
    setQuery("");
    setFilter("all");
    setOpen((prev) => new Set(prev).add(id));
    requestAnimationFrame(() => {
      const row = document.getElementById(`faq-${id}`);
      /* Clear of the header by the row's own scroll-margin, which grows
         with the design on a large screen. */
      if (row)
        scrollToY(row.getBoundingClientRect().top + window.scrollY - parseFloat(getComputedStyle(row).scrollMarginTop));
    });
  }, []);

  /* Arriving: after the first frame, once the rows are laid out to be
     scrolled to. */
  useEffect(() => {
    const arrival = requestAnimationFrame(reveal);
    window.addEventListener("hashchange", reveal);
    return () => {
      cancelAnimationFrame(arrival);
      window.removeEventListener("hashchange", reveal);
    };
  }, [reveal]);

  /* "/" goes to the search, as it does on most sites with one. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      const section = document.getElementById("faq");
      if (!section) return;
      const r = section.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      e.preventDefault();
      search.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(null), COPIED_FOR);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copyLink = async (id: string) => {
    const url = `${window.location.origin}/#faq-${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
    } catch {
      window.location.hash = `faq-${id}`;
    }
  };

  return (
    <div className="faq-body">
      <aside className="faq-side">
        <label className="faq-search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M15.5 15.5 L21 21" />
          </svg>
          <span className="sr-only">Search the questions</span>
          <input
            ref={search}
            type="search"
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search: rates, winter, seals…"
            autoComplete="off"
            spellCheck={false}
          />
          {query ? (
            <button type="button" className="faq-search-clear" onClick={() => onSearch("")} aria-label="Clear search">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6 L18 18 M18 6 L6 18" />
              </svg>
            </button>
          ) : (
            <kbd aria-hidden="true">/</kbd>
          )}
        </label>

        <div className="faq-topics" role="group" aria-label="Filter by topic">
          {[{ id: "all" as const, label: "All questions", code: "ALL" }, ...FAQ_TOPICS].map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={filter === t.id}
              disabled={!counts[t.id] && filter !== t.id}
              onClick={() => {
                settleRows();
                setFilter(t.id);
              }}
            >
              <span className="faq-topic-code">{t.code}</span>
              <span className="faq-topic-label">{t.label}</span>
              <span className="faq-topic-count">{String(counts[t.id] ?? 0).padStart(2, "0")}</span>
            </button>
          ))}
        </div>

        <div className="faq-ask">
          <p className="faq-ask-title">Still have a question?</p>
          <p className="faq-ask-body">
            Tell us the lane and the cargo. We call back, survey the route, and put equipment,
            schedule and rates in writing.
          </p>
          <Link href="/contact" className="faq-ask-cta">
            Get a quote
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12 H19 M13 6 L19 12 L13 18" />
            </svg>
          </Link>
        </div>
      </aside>

      <div className="faq-main">
        <div className="faq-bar">
          <p aria-live="polite">
            Showing <b>{String(shown.length).padStart(2, "0")}</b> of {String(FAQ.length).padStart(2, "0")}
            {filter !== "all" && <> in {TOPIC[filter].label.toLowerCase()}</>}
            {terms.length > 0 && <> for “{query.trim()}”</>}
          </p>
          <button
            type="button"
            className="faq-bar-toggle"
            disabled={!shown.length}
            onClick={() =>
              setOpen((prev) => {
                const next = new Set(prev);
                for (const f of shown) {
                  if (allOpen) next.delete(f.id);
                  else next.add(f.id);
                }
                return next;
              })
            }
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        </div>

        {shown.length ? (
          <ol className="faq-list">
            {shown.map((item) => {
              const isOpen = open.has(item.id);
              return (
                <li className="faq-row" id={`faq-${item.id}`} key={item.id} data-open={isOpen ? "" : undefined}>
                  <h3 className="faq-h">
                    <button
                      type="button"
                      className="faq-q"
                      id={`faq-${item.id}-q`}
                      aria-expanded={isOpen}
                      aria-controls={`faq-${item.id}-a`}
                      onClick={() => toggle(item.id)}
                    >
                      <span className="faq-num">{NUMBER[item.id]}</span>
                      <span className="faq-q-text">
                        <Marked text={item.q} terms={terms} />
                        {item.popular && <span className="faq-hot">Most asked</span>}
                      </span>
                      <span className="faq-code">{TOPIC[item.topic].code}</span>
                      <span className="faq-plus" aria-hidden="true">
                        <i />
                        <i />
                      </span>
                    </button>
                  </h3>
                  <div
                    className="faq-panel"
                    id={`faq-${item.id}-a`}
                    role="region"
                    aria-labelledby={`faq-${item.id}-q`}
                    inert={!isOpen}
                  >
                    <div className="faq-panel-inner">
                      <div className="faq-answer">
                        {item.a.map((p, i) => (
                          <p key={i}>
                            <Marked text={p} terms={terms} />
                          </p>
                        ))}
                        {item.facts && (
                          <ul className="faq-facts">
                            {item.facts.map((f) => (
                              <li key={f}>{f}</li>
                            ))}
                          </ul>
                        )}
                        <button type="button" className="faq-link" onClick={() => copyLink(item.id)}>
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M10 14 a4 4 0 0 0 5.66 0 l3-3 a4 4 0 0 0 -5.66 -5.66 l-1 1" />
                            <path d="M14 10 a4 4 0 0 0 -5.66 0 l-3 3 a4 4 0 0 0 5.66 5.66 l1 -1" />
                          </svg>
                          <span aria-live="polite">{copied === item.id ? "Link copied" : "Copy link to answer"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="faq-empty">
            <p className="faq-empty-title">Nothing on the manifest for “{query.trim()}”.</p>
            <p>
              Try a shorter word, or{" "}
              <button type="button" onClick={() => { onSearch(""); setFilter("all"); }}>
                show every question
              </button>
              . Or ask us directly: <Link href="/contact">request capacity</Link> and we will call
              back.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
