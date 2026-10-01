"use client";

/**
 * Header nav, modelled on rekorderstudios.com.
 *
 * At rest it's a dark glass pill, top-centre, carrying the wordmark and a
 * dot. Hover it (tap it on touch) and the pill draws in to a tab around
 * the wordmark while a bar springs out underneath with the links, which
 * rise in one after another, left to right. Each link is a tile: a dot
 * over its label, rolling to label-over-dot on hover.
 *
 * One amber highlight lives in the bar and glides between the tiles on a
 * spring (react-spring): it follows the pointer, and rests on the section
 * in view. Being one shape rather than a fill per tile is what makes the
 * row read as connected.
 *
 * The shape changes are CSS (see "Site nav" in globals.css), driven by
 * the wrapper's data-open attribute. Each time the home page's preloader
 * hands off, the nav introduces itself (see the introduction below): oil
 * runs through the pill, the dot rings, and a strip eases out to show the
 * links waiting underneath.
 */

import { animated, to, useSpring } from "@react-spring/web";
import { gsap } from "gsap";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { EASE, NAV_HINT, SPRING, onRevealed, prefersReducedMotion, scrollToY } from "@/lib/motion";

type NavItem = { label: string; target: string; href?: string };

/* `target` is the id of the section a link scrolls to, in page order.
   An item with an `href` has a page of its own: from anywhere else it
   goes there. Our Story is the home page's "Under one roof" section
   until it has a page of its own. */
const ITEMS: NavItem[] = [
  { label: "Home", target: "hero-track" },
  { label: "Our Story", target: "approach" },
  { label: "Services", target: "svc-page", href: "/services" },
  { label: "Contact", target: "contact-page", href: "/contact" },
];

/* A section is current once its top passes this far down the viewport. */
const SPY_LINE = 0.4;

export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  /* The tile the highlight is on: the one under the pointer, or else
     the current section's. */
  const [hover, setHover] = useState<number | null>(null);
  const lit = hover ?? active;
  const rootRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLElement>(null);
  const [glide, glideApi] = useSpring(() => ({ x: 0, y: 0, w: 0, h: 0, config: SPRING.snap }));
  const router = useRouter();
  /* A dependency of the scroll-spy below: moving between pages in the
     browser keeps this component mounted, so it re-measures on arrival. */
  const pathname = usePathname();

  /* Scroll-spy: the last section whose top is above the spy line. Read on
     scroll, throttled to one measurement per frame. */
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      /* The section whose top is nearest above the line -- not the last
         in the list, since a section can sit inside another. */
      const line = window.innerHeight * SPY_LINE;
      let current = 0;
      let nearest = -Infinity;
      /* On a page of its own, that page's item is current throughout. */
      const own = ITEMS.findIndex((item) => item.href === window.location.pathname);
      if (own >= 0) {
        setActive(own);
        return;
      }
      ITEMS.forEach((item, i) => {
        const top = document.getElementById(item.target)?.getBoundingClientRect().top;
        if (top !== undefined && top <= line && top > nearest) {
          nearest = top;
          current = i;
        }
      });
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  /* Touch opens on tap, so it has to close on a tap anywhere else, and
     Escape closes it for keyboard users. */
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /* The highlight's target: the lit tile's box inside the bar. Snapped
     into place while the bar is closed, so it never slides in from a
     stale spot when it opens; sprung once the bar is open. */
  useLayoutEffect(() => {
    const grid = itemsRef.current;
    if (!grid) return;
    const place = (immediate: boolean) => {
      const tile = grid.children[lit] as HTMLElement | undefined;
      if (!tile) return;
      glideApi.start({
        x: tile.offsetLeft,
        y: tile.offsetTop,
        w: tile.offsetWidth,
        h: tile.offsetHeight,
        immediate: immediate || !open || prefersReducedMotion(),
      });
    };
    place(false);
    /* And again whenever the grid changes size -- the bar opening round
       it, a phone's grid reflowing, the window resized -- so the
       highlight is always the tile's own shape, never one measured
       while the bar was still drawn in. */
    const ro = new ResizeObserver(() => place(true));
    ro.observe(grid);
    return () => ro.disconnect();
  }, [lit, open, glideApi]);

  /* The introduction, on the home page, every time the preloader hands
     the page over (a refresh included), once the headline has had its
     moment: oil runs through the pill, the dot rings twice, and a strip
     eases out beneath it with the links' dots, a ripple running along
     them, before it tucks away. Everything eases in and out of rest --
     nothing starts or stops dead. Anything the visitor does to the nav
     first cuts it short. */
  useEffect(() => {
    const root = rootRef.current;
    const hero = document.getElementById("hero");
    if (!root || !hero || prefersReducedMotion()) return;
    const oil = root.querySelector<HTMLElement>(".site-nav__oil");
    const rings = root.querySelectorAll<HTMLElement>(".site-nav__ring");
    const peek = root.querySelector<HTMLElement>(".site-nav__peek");
    const dots = root.querySelectorAll<HTMLElement>(".site-nav__peek i");
    if (!oil || !peek) return;

    const H = NAV_HINT;
    let tl: gsap.core.Timeline | null = null;
    const stop = onRevealed(hero, () => {
      tl = gsap
        .timeline({ delay: H.delay, defaults: { ease: EASE.settle } })
        /* Oil runs through the pill, left to right, at an even, liquid
           pace, and drains out the far side. x is zeroed: GSAP would
           otherwise keep the stylesheet's parking offset (-105%) as px
           on top of the sweep, and the oil would stop two thirds of the
           way across and sit there until the end wiped it at once. */
        .fromTo(oil, { x: 0, xPercent: -110 }, { x: 0, xPercent: 110, duration: H.sweep, ease: EASE.flow }, 0)
        /* The dot rings, twice, each ring slowing as it spreads. */
        .fromTo(
          rings,
          { scale: 1, opacity: 0.85 },
          { scale: H.ringScale, opacity: 0, duration: H.ring, stagger: H.ringGap },
          H.ringAt
        )
        /* A strip eases out beneath the pill -- dropping a little as it
           opens, the way the bar itself will -- and the links' dots come
           up in it one after another. */
        .fromTo(
          peek,
          { x: 0, xPercent: -50, y: -H.peekDrop, autoAlpha: 0, clipPath: "inset(0% 0% 100% 0% round 999px)" },
          { x: 0, xPercent: -50, y: 0, autoAlpha: 1, clipPath: "inset(0% 0% 0% 0% round 999px)", duration: H.peek, ease: EASE.lift },
          H.peekAt
        )
        .fromTo(
          dots,
          { scale: 0.4, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: H.dot, stagger: H.dotStagger, ease: EASE.lift },
          `<${H.peek * 0.35}`
        )
        /* A ripple runs along them, left to right: they are connected. */
        .to(
          dots,
          { y: -H.rippleLift, duration: H.ripple, ease: EASE.flow, stagger: H.dotStagger, yoyo: true, repeat: 1 },
          ">-0.1"
        )
        /* And it flows back in: the dots drain toward the middle from
           both ends, the strip draws in after them from its ends and
           lifts up under the pill, and one last soft ring off the dot
           says it has all come home. Every part eases to rest. */
        .addLabel("out", `>${H.hold}`)
        .to(
          dots,
          {
            scale: 0.3,
            y: -2,
            autoAlpha: 0,
            duration: H.dotOut,
            ease: "power2.in",
            stagger: { each: H.dotStagger, from: "edges" },
          },
          "out"
        )
        /* Both insets spelled out in full, four sides each: the browser
           shortens a computed inset, and GSAP pairs the numbers up by
           position, so a short start against a long end tweens nonsense. */
        .fromTo(
          peek,
          { clipPath: "inset(0% 0% 0% 0% round 999px)" },
          {
            y: -H.peekDrop,
            clipPath: "inset(0% 50% 0% 50% round 999px)",
            duration: H.tuck,
            ease: "power3.inOut",
            immediateRender: false,
          },
          `out+=${H.tuckLag}`
        )
        /* It fades only over the back half, so the drawing in reads. */
        .to(
          peek,
          { autoAlpha: 0, duration: H.tuck * 0.55, ease: "power1.in" },
          `out+=${H.tuckLag + H.tuck * 0.45}`
        )
        .fromTo(
          rings[0] ?? [],
          { scale: 1, opacity: 0.45 },
          { scale: H.settleScale, opacity: 0, duration: H.settle, ease: "sine.out" },
          `out+=${H.tuckLag + H.tuck * 0.7}`
        )
        .set([oil, peek, ...rings, ...dots], { clearProps: "all" });
    });
    /* The visitor got there first. */
    const cut = () => {
      if (tl && tl.isActive()) tl.progress(1);
    };
    root.addEventListener("pointerenter", cut);
    root.addEventListener("focusin", cut);
    return () => {
      stop();
      tl?.kill();
      root.removeEventListener("pointerenter", cut);
      root.removeEventListener("focusin", cut);
    };
  }, []);

  /* Hover only opens for a real pointer. On touch the synthetic
     mouseenter fires just before the click, which would open the menu and
     have the toggle's click close it again in the same tap. */
  const onPointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") setOpen(true);
  };
  const onPointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") setOpen(false);
  };

  /* Between pages the router moves in the browser: no reload, so the
     fonts, the scripts and the smooth scroll carry straight over and the
     next page's own entrance plays at once. */
  const go = useCallback((e: React.MouseEvent<HTMLAnchorElement>, item: NavItem, index: number) => {
    e.preventDefault();
    if (item.href && window.location.pathname !== item.href) {
      setOpen(false);
      router.push(item.href);
      return;
    }
    const el = document.getElementById(item.target);
    /* On a page without that section, go to it on the home page. */
    if (!el) {
      setOpen(false);
      router.push(index === 0 ? "/" : `/#${item.target}`);
      return;
    }
    scrollToY(index === 0 ? 0 : el.getBoundingClientRect().top + window.scrollY);
    history.replaceState(null, "", index === 0 ? " " : `#${item.target}`);
    setOpen(false);
  }, [router]);

  return (
    <div
      ref={rootRef}
      className="site-nav"
      data-open={open ? "" : undefined}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={(e) => {
        /* Keyboard focus only: a mouse click focuses the toggle too, and
           opening on that focus would let the click close it again. */
        if ((e.target as HTMLElement).matches(":focus-visible")) setOpen(true);
      }}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <div className="site-nav__bar">
        <nav
          aria-label="Main"
          className="site-nav__items"
          id="site-nav-items"
          ref={itemsRef}
          onPointerLeave={() => setHover(null)}
        >
          {ITEMS.map((item, i) => (
            <a
              key={item.target}
              href={item.href ?? `#${item.target}`}
              onClick={(e) => go(e, item, i)}
              onPointerEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              className="site-nav__item"
              data-own-scroll=""
              style={{ "--i": i } as React.CSSProperties}
              aria-current={i === active ? "location" : undefined}
              data-lit={i === lit ? "" : undefined}
              tabIndex={open ? 0 : -1}
            >
              {/* Label, dot, label: at rest the window shows the dot over
                  the lower label; hover slides the column down so the
                  upper copy and the dot fill it instead. */}
              <span className="site-nav__roll" aria-hidden="true">
                <span className="site-nav__label">{item.label}</span>
                <span className="site-nav__dot" />
                <span className="site-nav__label">{item.label}</span>
              </span>
              <span className="sr-only">{item.label}</span>
            </a>
          ))}
          {/* The one highlight, gliding under whichever tile is lit. */}
          <animated.span
            className="site-nav__glide"
            aria-hidden="true"
            style={{
              transform: to([glide.x, glide.y], (x, y) => `translate3d(${x}px, ${y}px, 0)`),
              width: glide.w,
              height: glide.h,
            }}
          />
        </nav>
      </div>

      {/* The introduction's peek: a strip under the pill carrying the
          links' dots. Clipped shut except while it plays. */}
      <span className="site-nav__peek" aria-hidden="true">
        {ITEMS.map((item) => (
          <i key={item.target} />
        ))}
      </span>

      {/* The whole tab is the toggle, as on the reference: tap anywhere on
          the pill to open it. With a mouse, hover has already opened it. */}
      <button
        type="button"
        className="site-nav__tab"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="site-nav-items"
        onClick={() => setOpen((o) => !o)}
      >
        {/* The introduction's oil, run through the pill once. */}
        <span className="site-nav__oil" aria-hidden="true" />
        {/* The logo, docked: away from the top of the page the ZG mark
            leaves its corner and sits here, before the name, so the header
            is one piece over the content. See "The docked logo". */}
        <span className="site-nav__mark" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/zia-goods-mark.svg" alt="" width={630} height={310} />
          <i />
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="site-nav__wordmark" src="/zia-goods-wordmark-navy.svg" alt="Zia Goods" width={318.5} height={53.5} />
        <span className="site-nav__toggle-dot" aria-hidden="true">
          <span className="site-nav__ring" />
          <span className="site-nav__ring" />
        </span>
      </button>
    </div>
  );
}
