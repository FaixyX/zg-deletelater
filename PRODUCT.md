# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Mill owners and others with the authority to arrange freight contracts: refinery, ghee-mill, sugar-mill and plant management in Pakistan. They are corporate buyers placing a contract, not walk-up shippers. They decide on reliability and standards, and they are judging whether Zia Goods can be trusted with a season's volume. They often arrive on a phone, and Pakistani buyers often prefer to call or message first.

## Product Purpose

Zia Goods is a contract carrier. It moves edible oil, molasses, chemicals, finished goods and dry cargo by road, with its own fleet and drivers, from Port Qasim, Karachi to refineries, mills and plants across Pakistan.

The site exists to:
1. win new contracts,
2. build trust with corporate shippers, and
3. build brand recognition.

Within the first ten seconds a visitor should believe: **Zia Goods has hauled for twenty years, nationwide.** Success is a capacity request, a phone call or a WhatsApp message from someone with contracting authority.

## Positioning

An owner-operated fleet on contract, not the spot market: 22 food-grade oil tankers, committed to a buyer's lanes at agreed rates, answerable end to end. Twenty years hauling edible oil, from Port Qasim to every major refining centre, with a nationwide motorway and highway network behind it.

## Operating Context

- Origin is Port Qasim, Karachi. Destinations include Hyderabad, Sukkur, Rahim Yar Khan, Multan, Faisalabad, Lahore, Sheikhupura, Islamabad-Rawalpindi and Peshawar, and Gwadar by the N-10 along the Makran coast.
- The corridor is the motorway and national-highway network. Karachi to Lahore runs **M-9, N-5, M-5, M-4, M-3** (the client confirmed M-4 is on this route).
- Demand is seasonal: Ramadan and Eid for ghee and cooking oil, and the sugar-mill crushing season (roughly November to March) for molasses.
- Contract paperwork is part of the work: seal numbers on the bill of lading, checked at discharge; the safety data sheet and placards for chemicals.
- The motto painted on the back of the trucks is part of the culture of the work.

## Capabilities and Constraints

- Five cargoes: edible oil (food-grade, oil-only tanks), molasses, chemicals, finished goods, dry cargo.
- Confirmed figures: **22** food-grade oil tankers, **20** years hauling edible oil, **14** motorways and highways, **8** corridors (the seven core inland corridors plus the N-10 Gwadar leg).
- Contact paths, with equal weight: the capacity-request form (cargo, lane, who to call back) **and** direct phone / WhatsApp. The numbers and the person who answers them are not yet supplied.
- Languages: English only. The motto appears in Roman Urdu and in Urdu script as a brand line; there is no full Urdu site and no right-to-left layout requirement.
- Maps matter to the client. Boundary data comes from GADM, and the client reports GADM has given permission to use it. Keep attribution, and ask the client for a copy of the written permission. Road data comes from OpenStreetMap (ODbL, attribution required).
- Typefaces must be free for commercial web use unless the client confirms a licence.
- The ZG mark in `brand/` is fixed.

**Undecided or unverified:**
- Karachi to Lahore is about 1,215 km and 24–28 hours of road time on the old site's figures. Recheck with the M-4 on the route.
- The old site's FAQ (`src/lib/faq.ts`) leaves M-4 off the Karachi to Lahore route and disagrees with the footer and night-run copy. Fix it when the real pages are built.
- Competitors and sites the client dislikes were not provided.

## Brand Commitments

- **Name and mark:** Zia Goods; the ZG mark (`brand/zia-goods-*.svg`) is fixed.
- **Motto:** "Dekh magar pyar se" (look, but with love), as painted on the trucks. In Urdu script: دیکھ مگر پیار سے. The Urdu-script wording is to be confirmed by the client.
- **Brand palette:** not fixed. The client asked for a generated palette built on a strong contrast of blue and cream-white. Amber survives only as the logo's accent.
- **Personality the client asked for:** a reputable brand that honours its contracts, with a broader vision to grow.
- **Must never feel like:** a company that neglects detail or does not check its standards.
- **Admired site:** unitedcarriers.com. The old site is an anti-reference.

## Evidence on Hand

- The client says the following exist and still need collecting. None are in the repo, and nothing may be invented in their place:
  - certifications and standards
  - named clients (with permission to show them)
  - real photography of the fleet, drivers and yard
  - fleet and tracking facts such as fleet age, GPS, insurance, and tank cleaning and sealing procedures
- In the repo: the five cargo descriptions (`src/lib/cargo.ts`), FAQ and lane-board data (`src/lib/faq.ts`), the corridor routes (`src/lib/corridor-routes.ts`), the map data (`src/data/pakistan-map.json`, `data-raw/`), and the old-site audit (`docs/audit.md`).
- Until photos arrive, imagery is drawn, typographic or cartographic.

## Product Principles

1. **Proof before polish.** Every claim the site makes is one a buyer could check: a number, a named road, a procedure, a certificate.
2. **Twenty years, nationwide, first.** Track record and reach lead; everything else supports them.
3. **Reach a person.** The capacity form and a direct phone or WhatsApp line carry equal weight and are never more than one step away.
4. **Show the care.** The attention to detail the client wants to be known for has to be visible in the site's own detail: alignment, copy, figures and states.
5. **Plain and specific over clever.** Name the road, the cargo and the procedure. No effect should stand between a mill owner and the answer.

## Accessibility & Inclusion

Target WCAG 2.2 AA for contrast and keyboard use, and honour `prefers-reduced-motion`. Many visitors are on mid-range phones and uneven mobile connections, so the site must stay fast and legible there. The Urdu script motto needs a face that renders correctly, with line-height that accommodates Nastaliq.
