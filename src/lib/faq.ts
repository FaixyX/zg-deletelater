/**
 * The home page's questions, in the order a shipper tends to ask them:
 * what you carry, what it costs, how the cargo is kept, how it's
 * watched, where it goes, and the paperwork at the end. Read by the FAQ
 * section (FaqExplorer) and by its FAQPage structured data, so the words
 * a search engine shows are the words on the page.
 */

export type FaqTopicId = "booking" | "care" | "safety" | "network" | "paper";

export type FaqTopic = {
  id: FaqTopicId;
  label: string;
  /** Four letters, set like a route code on the row. */
  code: string;
};

export const FAQ_TOPICS: FaqTopic[] = [
  { id: "booking", label: "Booking & rates", code: "BOOK" },
  { id: "care", label: "Cargo care", code: "CARE" },
  { id: "safety", label: "Safety & crews", code: "SAFE" },
  { id: "network", label: "Network & timing", code: "LANE" },
  { id: "paper", label: "Paperwork & payment", code: "DOCS" },
];

export type FaqItem = {
  /** The row's anchor: /#faq-<id> opens it. */
  id: string;
  topic: FaqTopicId;
  q: string;
  /** Paragraphs. */
  a: string[];
  /** The short version, as tags under the answer. */
  facts?: string[];
  /** Flagged as one of the most asked. */
  popular?: boolean;
};

export const FAQ: FaqItem[] = [
  /* ---- Booking & rates ------------------------------------------- */
  {
    id: "what-we-carry",
    topic: "booking",
    q: "What does Zia Goods transport, and for whom?",
    a: [
      "Edible oil is our core: crude palm oil, palm olein, soybean and canola, from the storage terminals at Port Qasim to refineries and ghee mills across Pakistan. The country imports well over three million tonnes of palm oil a year, most of it through Port Qasim, and almost every litre of it moves inland by road. That road is where we have spent the last twenty years.",
      "Alongside it we carry molasses for sugar mills and distilleries, bulk liquid chemicals for industrial plants, and finished goods and dry cargo for manufacturers and distributors, from coal for cement and power plants to grain and fertiliser, each on equipment kept for that cargo.",
    ],
    facts: ["Edible oil · molasses · chemicals", "Finished goods · dry cargo", "Refineries, mills, plants, FMCG"],
    popular: true,
  },
  {
    id: "why-dedicated",
    topic: "booking",
    q: "Why hire a dedicated carrier instead of trucks off the open market?",
    a: [
      "The open market works until the week you need it most. Before Ramadan, when diesel jumps or a strike shuts a highway, spot trucks disappear or double their price, and a refinery that relied on them runs short. One missed tanker becomes an idle plant, a stopped ghee line and empty shelves downstream.",
      "A dedicated carrier takes that risk off your plan: tankers committed to your lanes, crews who know your loading points, rates fixed by contract and one team answerable for every load. It is how a supply chain stays steady when the market does not.",
    ],
    facts: ["Committed tankers, not spot hire", "Rates fixed by contract", "One team answerable end to end"],
    popular: true,
  },
  {
    id: "contract-or-spot",
    topic: "booking",
    q: "Do you offer contract transport, or can I book a single trip?",
    a: [
      "Contract carriage is what we are built for: tankers committed to your lanes for a season or a year, at agreed rates, with the same crews learning your loading points and your people. It is the surest way to keep a refinery fed when the market tightens in Ramadan or at the peak of the crushing season.",
      "Single trips are welcome too. When capacity allows we take spot loads, and plenty of our contract customers started with one.",
    ],
    facts: ["Seasonal or annual contracts", "Committed tankers & crews", "Spot loads when capacity allows"],
    popular: true,
  },
  {
    id: "pricing",
    topic: "booking",
    q: "How much does freight cost, and how is it priced?",
    a: [
      "Per tonne or per trip, by lane, quoted in rupees. The rate reflects the distance, the cargo, the time allowed for loading and discharge, and whether there is a return load to be had on the way back.",
      "Diesel is the one number nobody controls, so contract rates carry a fuel adjustment tied to the government's published fuel price revisions. When the price moves, the rate moves with it by a formula agreed in writing on day one: no renegotiating mid-season and no surprises on the invoice.",
    ],
    facts: ["PKR, per tonne or per trip", "Fuel clause agreed upfront", "Rates fixed for the contract term"],
    popular: true,
  },
  {
    id: "getting-started",
    topic: "booking",
    q: "How do we start a new route with you?",
    a: [
      "Send us the lane and the cargo through the quote form. We call back, survey the route and both loading points, and put equipment, schedule and terms to you in writing before the first tanker rolls.",
      "The survey is the part that pays off later: gate timings, weighbridges, turning space for a loaded tanker and the refinery's discharge window are all worked out before your cargo is on the road, not after.",
    ],
    facts: ["01 · Send lane & cargo", "02 · Route survey", "03 · Terms in writing"],
  },
  {
    id: "peak-season",
    topic: "booking",
    q: "Can you keep up with Ramadan and crushing-season demand?",
    a: [
      "Yes, because we plan for it. Ghee and cooking oil demand climbs ahead of Ramadan and Eid, and the sugar mills crush from roughly November to March. Contract customers have tankers committed through those peaks; the fleet is built up ahead of them and stood down after, so your volume does not depend on what the open market has left.",
    ],
    facts: ["Ramadan & Eid oil demand", "Crushing season Nov – Mar", "Capacity committed in advance"],
  },

  /* ---- Cargo care ------------------------------------------------ */
  {
    id: "food-grade",
    topic: "care",
    q: "How do you keep edible oil food-safe in transit?",
    a: [
      "Our edible oil tankers carry edible oil and nothing else, ever, so the previous cargo in the tank is always food. Each one is cleaned, inspected and sealed before every loading, and the seal numbers go on the bill of lading.",
      "That gives your quality team a clean chain from the terminal to your intake: what the tank last carried, when it was cleaned, and a seal that was checked intact at your gate.",
    ],
    facts: ["Dedicated food-grade tanks", "Cleaned & sealed every load", "Previous cargo always edible oil"],
    popular: true,
  },
  {
    id: "winter-palm",
    topic: "care",
    q: "Palm oil solidifies in winter. Does that slow discharge?",
    a: [
      "Not when it is planned for, and we plan for it. Palm products pour freely warm and set as they cool, so on winter nights in Punjab we time loading and discharge to the cargo's temperature rather than the clock, and coordinate with the terminal and the refinery so the oil comes off at its working temperature of around 50–55 °C.",
      "The result is the same turnaround in January as in June.",
    ],
    facts: ["Discharge at ≈ 50–55 °C", "Runs timed to cargo temperature", "Year-round turnaround"],
  },
  {
    id: "shortage",
    topic: "care",
    q: "How do you prevent shortage and pilferage in transit?",
    a: [
      "Every tank is sealed at loading, the seal numbers are written on the bill of lading, and the seals are checked at discharge. Weights are taken at both ends, so any difference shows up at your gate, in front of your people.",
      "Most of all, the tankers and drivers are our own. Nobody along the route is a stranger picked up for one trip, and one team answers for the load from berth to gate.",
    ],
    facts: ["Numbered seals, checked at gate", "Weighed at both ends", "Own tankers, own drivers"],
    popular: true,
  },
  {
    id: "other-liquids",
    topic: "care",
    q: "Do you transport molasses and chemicals too?",
    a: [
      "Yes, each in its own equipment. Molasses rides in bulk tankers sized for a dense, slow-pouring load and runs to the mill's crushing schedule. Chemicals go in a compatible tank, never a mixed load, with hazard placards, the safety data sheet and a trained crew carrying a spill kit.",
      "Edible oil tankers are never used for either.",
    ],
    facts: ["Molasses on the mill's clock", "Chemicals placarded, with SDS", "Never in an edible oil tank"],
  },

  /* ---- Safety & crews -------------------------------------------- */
  {
    id: "load-status",
    topic: "safety",
    q: "How do I know where my tanker is?",
    a: [
      "Call dispatch. The tankers and drivers are our own, so dispatch is in touch with every crew on the road, and one call tells you where your load is and when it will reach your gate.",
    ],
    facts: ["One call to dispatch", "In touch with every crew", "Arrival time on request"],
    popular: true,
  },
  {
    id: "axle-load",
    topic: "safety",
    q: "Are your loads axle-load compliant?",
    a: [
      "Every one. Loads are built to the legal axle limits enforced on Pakistan's motorways and national highways since November 2023, never over them.",
      "It is the safer way to drive a heavy tanker, it protects the roads everyone depends on, and it means your cargo is not held up at a weigh station or offloaded at the roadside. A compliant load is a predictable load.",
    ],
    facts: ["Built to the legal limit", "No weigh-station holds", "Safer braking, fewer tyres lost"],
  },
  {
    id: "drivers",
    topic: "safety",
    q: "Who drives your tankers, and how are they trained?",
    a: [
      "Our own drivers, not a pool of subcontractors. They are trained for the cargo behind the cab, from keeping a food-grade seal intact to handling a placarded chemical load, and on long hauls runs are planned with proper rest so nobody pushes through the night on the N-5.",
    ],
    facts: ["Company drivers", "Cargo-specific training", "Rest planned into long hauls"],
  },
  {
    id: "insurance",
    topic: "safety",
    q: "Is my cargo covered in transit?",
    a: [
      "Yes. Liability for the cargo is set out in the contract before the first load, and our cover works alongside your own inland transit or marine-cum-inland policy, so there is no gap between the ship's rail and your tank.",
      "Should a claim ever arise, the seal record and weighbridge slips are already on file to settle it quickly.",
    ],
    facts: ["Liability agreed in writing", "Works with your transit policy", "Records ready for any claim"],
  },

  /* ---- Network & timing ------------------------------------------ */
  {
    id: "coverage",
    topic: "network",
    q: "Which cities and routes in Pakistan do you cover?",
    a: [
      "Nationwide, from Port Qasim in Karachi to every major refining and industrial centre: Hyderabad, Sukkur, Rahim Yar Khan, Multan, Faisalabad, Lahore, Sheikhupura, Islamabad-Rawalpindi and Peshawar, and west along the Makran coast to Gwadar. Fourteen motorways and highways, eight core corridors.",
      "The backbone is the motorway network: M-9 to Hyderabad, N-5 to Sukkur, the M-5 to Multan, then the M-3 and M-4 into central Punjab and the M-2 and M-1 to the north. Faster, smoother roads mean quicker turnarounds and less wear on the cargo and the fleet. Westward, the N-10 coastal highway takes the same tankers along the Makran coast to the port at Gwadar.",
    ],
    facts: ["14 highways · 8 core corridors", "Gwadar to Peshawar", "Motorway-first routing"],
  },
  {
    id: "transit-time",
    topic: "network",
    q: "How long does Karachi to Lahore take by tanker?",
    a: [
      "About 1,215 km by the M-9, N-5, M-5 and M-3, which a loaded tanker covers in roughly 24–28 hours on the road. Add the time for loading and discharge, and most runs are at the refinery gate the day after they leave Port Qasim.",
      "Try any destination on the lane board at the top of this section for its distance and road time. Your own lane is surveyed and confirmed in writing.",
    ],
    facts: ["≈ 1,215 km", "≈ 24–28 h on the road", "Next-day delivery on most runs"],
    popular: true,
  },
  {
    id: "gwadar",
    topic: "network",
    q: "Do you run between Karachi and Gwadar?",
    a: [
      "Yes. From Port Qasim it is about 680 km by the Northern Bypass and the N-10 coastal highway, through Ormara and Pasni, which a loaded tanker covers in roughly 13–16 hours on the road.",
      "As on every lane, we survey the route and both loading points before the first load, and confirm the schedule in writing.",
    ],
    facts: ["≈ 680 km", "≈ 13–16 h on the road", "N-10 coastal highway"],
  },
  {
    id: "disruption",
    topic: "network",
    q: "What happens during strikes, protests or floods?",
    a: [
      "We plan around them, and we tell you first. Because the tankers and drivers are our own, we are not hunting for trucks on the open market when it tightens, and dispatch can re-route in hours, for example between the N-5 and the Indus Highway when one is closed.",
      "Contract customers hear about a disruption from us before they read about it, with a revised arrival time rather than a vague apology.",
    ],
    facts: ["Own fleet, not the spot market", "Alternate corridors planned", "Early, honest updates"],
  },

  /* ---- Paperwork & payment --------------------------------------- */
  {
    id: "documents",
    topic: "paper",
    q: "What paperwork comes with each load?",
    a: [
      "A bill of lading with the seal numbers, weighbridge slips from both ends and a signed proof of delivery for every trip, plus the safety data sheet and placards for chemical loads. Everything your stores, QA and accounts teams need to close a delivery without chasing anyone.",
    ],
    facts: ["Bill of lading + seal numbers", "Weighbridge slips, both ends", "Proof of delivery every trip"],
  },
  {
    id: "invoicing",
    topic: "paper",
    q: "How do invoicing and payment work?",
    a: [
      "Invoices are issued in rupees from a registered, tax-compliant business, with each trip's documents attached. Contract customers get a consolidated statement on an agreed cycle, and tax withheld at source is acknowledged against it, so reconciling with your finance team is straightforward.",
      "Payment is by bank transfer on the terms agreed in the contract.",
    ],
    facts: ["PKR, tax-compliant invoices", "Consolidated statements", "Bank transfer on agreed terms"],
  },
];

/* ---- The lane board ---------------------------------------------- */

export type Lane = {
  city: string;
  /** Set on the split-flap tiles: at most 10 characters. */
  board: string;
  km: number;
  /** Typical road time for a loaded tanker, hours. */
  hours: [number, number];
  roads: string[];
  /** The corridor it lies on: the trunk north, or the coast west. */
  way: "north" | "west";
};

/**
 * Planning figures from Port Qasim: road distance by the usual route
 * (motorway-first up-country, the N-10 along the coast to Gwadar), and
 * road time for a loaded tanker, excluding loading and discharge.
 */
export const LANES: Lane[] = [
  { city: "Hyderabad", board: "HYDERABAD", km: 165, hours: [3, 4], roads: ["M-9"], way: "north" },
  { city: "Sukkur", board: "SUKKUR", km: 475, hours: [9, 11], roads: ["M-9", "N-5"], way: "north" },
  { city: "Multan", board: "MULTAN", km: 870, hours: [17, 20], roads: ["M-9", "N-5", "M-5"], way: "north" },
  { city: "Faisalabad", board: "FAISALABAD", km: 1110, hours: [22, 25], roads: ["M-9", "N-5", "M-5", "M-4"], way: "north" },
  { city: "Lahore", board: "LAHORE", km: 1215, hours: [24, 28], roads: ["M-9", "N-5", "M-5", "M-3"], way: "north" },
  { city: "Islamabad", board: "ISLAMABAD", km: 1440, hours: [29, 33], roads: ["M-9", "N-5", "M-5", "M-4", "M-2"], way: "north" },
  { city: "Peshawar", board: "PESHAWAR", km: 1590, hours: [32, 37], roads: ["M-9", "N-5", "M-5", "M-4", "M-2", "M-1"], way: "north" },
  { city: "Gwadar", board: "GWADAR", km: 680, hours: [13, 16], roads: ["M-10", "N-10"], way: "west" },
];
