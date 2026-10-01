import type { CargoKind } from "./cargo";

/**
 * The /services page's long-form copy: one chapter per cargo, in the
 * same order as CARGO. The home page keeps the short versions in
 * cargo.ts; these are the detail behind them.
 */

export type ServiceChapter = {
  kind: CargoKind;
  /** The cargo's colour: its tile on the board and its load in the fleet. */
  tone: string;
  /** The departure board's row. Short: it is set in split-flap tiles. */
  board: { from: string; to: string; equipment: string };
  headline: string;
  lede: string;
  body: string[];
  /** How we carry it: four short, concrete practices. */
  practice: string[];
  /** The spec plate riveted to the chapter. */
  plate: [label: string, value: string][];
  /** The sight glass: how the cargo itself behaves, with real figures. */
  glass: { behaviour: string; readings: [label: string, value: string][] };
};

export const CHAPTERS: ServiceChapter[] = [
  {
    kind: "edible-oil",
    tone: "#e8a33d",
    board: { from: "PORT QASIM", to: "REFINERY", equipment: "FOOD-GRADE" },
    headline: "Edible oil transport, berth to refinery gate.",
    lede: "Most of Pakistan's cooking oil arrives by sea at Port Qasim. We carry it the rest of the way.",
    body: [
      "Crude palm oil, palm olein, soybean and canola oil arrive by ship at Port Qasim in Karachi, where they are pumped from the berth into bulk storage terminals. From there almost every litre travels inland by road, to refineries and ghee mills in Hyderabad, Multan, Faisalabad, Lahore and beyond, one food-grade tanker at a time.",
      "It is food, so the tank has to be clean enough to eat from and must never have carried anything else. Palm products thicken as they cool, so we time loading and discharge to the cargo's temperature, not just the clock. And because one late tanker ripples down the whole supply chain, idling a refinery and stopping a ghee line, every run is planned around the terminal's discharge plan and your intake window.",
    ],
    practice: [
      "Food-grade tanks that carry edible oil and nothing else",
      "Cleaned, inspected and sealed before every loading",
      "Seal numbers written on the bill of lading and checked at discharge",
      "Runs timed to the terminal and the refinery, so ships and plants keep moving",
    ],
    plate: [
      ["Equipment", "Dedicated food-grade tankers"],
      ["Lane", "Port Qasim terminals → refineries & ghee plants"],
      ["Cargo", "Palm oil, palm olein, soybean, canola"],
      ["Handling", "Sealed, temperature-aware"],
    ],
    glass: {
      behaviour: "Pours thin and sloshes freely once warm; thickens as it cools.",
      readings: [
        ["Viscosity", "≈ 20–24 cP at 50–55 °C"],
        ["Density", "0.89 g/mL"],
        ["Discharge", "50–55 °C"],
      ],
    },
  },
  {
    kind: "molasses",
    tone: "#c46e2c",
    board: { from: "SUGAR MILL", to: "DISTILLERY", equipment: "BULK TANKER" },
    headline: "Molasses transport on the sugar mill's clock.",
    lede: "When the cane is crushed, molasses comes all at once, and it has to leave as fast as it is made.",
    body: [
      "Molasses is what remains after a sugar mill has taken the sugar out of the cane: dense, dark and valuable. It feeds ethanol distilleries and cattle-feed plants, and fills the export tank farms at Port Qasim, where it leaves the country as molasses or as the ethanol made from it.",
      "Mills in Sindh and Punjab crush through the season, roughly November to March, and molasses builds up behind them day and night. Left standing, it fills the mill's tanks. So we build the fleet up for the season and keep those tanks moving, allowing for a thick, slow pump that gets slower still on a cold morning.",
    ],
    practice: [
      "Bulk tankers sized for a dense, viscous load",
      "Fleet built up for the crushing season, stood down after it",
      "Mill to distillery, feed plant or port tank farm",
      "Discharge time planned around the weather and the cargo's flow",
    ],
    plate: [
      ["Equipment", "Bulk liquid tankers"],
      ["Lane", "Sugar mills → distilleries, feed plants, port"],
      ["Season", "Crushing season, Nov – Mar"],
      ["Handling", "Viscous; slow to load and discharge"],
    ],
    glass: {
      behaviour: "Falls in a rope that coils as it lands, then settles slowly into a heap.",
      readings: [
        ["Viscosity", "1,100–7,150 cP"],
        ["Brix", "80–90°"],
        ["+10 °C", "viscosity halves"],
      ],
    },
  },
  {
    kind: "chemicals",
    tone: "#d0e6fd",
    board: { from: "PLANT", to: "PLANT", equipment: "PLACARDED" },
    headline: "Chemical transport, moved by the book.",
    lede: "Every chemical behaves differently, so every load is treated as a job of its own.",
    body: [
      "Acids, alkalis, solvents and process chemicals keep Pakistan's textile mills, soap and detergent plants, paper mills and water-treatment works running. Each one reacts in its own way to heat, to air and to whatever was in the tank before it.",
      "So every bulk chemical load starts with the paperwork: what it is, what it must never share a tank with, how it is marked and what to do if something goes wrong. It travels in a compatible tank, under hazard placards, with a trained crew who know exactly what is behind the cab.",
    ],
    practice: [
      "A compatible tank for each product, never a mixed load",
      "Hazard placards and safety data sheet with every load",
      "Trained crews, with spill kit and protective gear aboard",
      "Routes planned around town centres wherever the lane allows",
    ],
    plate: [
      ["Equipment", "Placarded bulk liquid tankers"],
      ["Lane", "Producer → industrial plant"],
      ["Cargo", "Acids, alkalis, solvents, process liquids"],
      ["Handling", "Documented, marked, compatibility-checked"],
    ],
    glass: {
      behaviour: "Reacts with heat, air and other cargo. Kept apart, and marked.",
      readings: [
        ["Density", "1.0–1.84 g/mL"],
        ["Tank", "compatibility-checked"],
        ["Marking", "hazard placards"],
      ],
    },
  },
  {
    kind: "finished-goods",
    tone: "#f8f1e4",
    board: { from: "FACTORY", to: "DISTRIBUTOR", equipment: "CLOSED BODY" },
    headline: "Finished goods and FMCG, sealed from factory to door.",
    lede: "Finished goods are worth the most and damage the easiest. They travel shut.",
    body: [
      "Packaged food, drinks, home and personal care products and building materials move in cartons and on pallets from the factory to the warehouse, then on to distributors nationwide. What arrives is what gets sold, so a crushed carton or a damp pallet is money lost at the far end.",
      "They ride in closed-body trucks and containers that keep out rain and dust, sealed at loading and opened only at their destination, and loaded to the axle limits enforced on Pakistan's motorways and highways since November 2023.",
    ],
    practice: [
      "Closed-body trucks and containers, dry and dust-free",
      "Seal at loading, seal check at delivery",
      "Loads built to the legal axle limit, never over it",
      "Proof of delivery returned with every trip",
    ],
    plate: [
      ["Equipment", "Closed-body trucks & containers"],
      ["Lane", "Factory → warehouse → distributor"],
      ["Cargo", "Cartons, pallets, packaged goods"],
      ["Handling", "Sealed, weather-tight, axle-compliant"],
    ],
    glass: {
      behaviour: "Rigid, stackable and easy to damage. Stays dry, square and sealed.",
      readings: [
        ["Unit", "carton on pallet"],
        ["Pallet", "1200 × 1000 mm"],
        ["Enemies", "damp, crush, theft"],
      ],
    },
  },
  {
    kind: "dry-cargo",
    tone: "#e2c48c",
    board: { from: "PORT / MILL", to: "MARKET", equipment: "FLATBED" },
    headline: "Coal, grain and dry cargo, sized to the load.",
    lede: "Coal, grain, sugar and fertiliser keep the country running, and most of it moves by road.",
    body: [
      "Imported coal for cement and power plants comes off ships at Karachi alongside wheat, sugar, rice and fertiliser, while more dry cargo leaves mills and warehouses every day. All of it heads up-country to plants, markets and depots. Coal travels loose; most of the rest is bagged, often in 50-kilo sacks stacked by hand.",
      "Each load goes on the body that suits it: a flatbed, a high-sided trailer or a container. Open loads are tarped and lashed against rain and dust, and bags are counted at loading and counted again at the far end.",
    ],
    practice: [
      "Flatbeds, high-side trailers and containers",
      "Tarpaulin and lashing on every open load",
      "Bag counts checked at loading and at discharge",
      "Weighed to the axle-load limits before it leaves",
    ],
    plate: [
      ["Equipment", "Flatbeds, high-sides, containers"],
      ["Lane", "Port, mill & warehouse → plants, markets"],
      ["Cargo", "Coal, wheat, sugar, fertiliser"],
      ["Handling", "Tarped, lashed, bag-counted"],
    ],
    glass: {
      behaviour: "Pours like a liquid, then piles at its own natural angle.",
      readings: [
        ["Angle of repose", "≈ 27° (wheat)"],
        ["Bulk density", "0.7–0.8 t/m³ (urea)"],
        ["Bag", "50 kg"],
      ],
    },
  },
];

/** How a contract runs, as kilometre posts along a road. */
export const CONTRACT_STEPS: { km: string; title: string; body: string }[] = [
  {
    km: "000",
    title: "Survey the route",
    body: "Loading point, discharge point, the road between them and every weigh station on it, surveyed before the first load.",
  },
  {
    km: "120",
    title: "Match the equipment",
    body: "Tank, body and crew chosen for your cargo and kept on it, never borrowed between jobs.",
  },
  {
    km: "480",
    title: "Fix the schedule",
    body: "Runs set to the ship, the mill or the factory's plan, with rates and terms agreed in writing.",
  },
  {
    km: "860",
    title: "Run and report",
    body: "Dispatch in touch with every crew from gate to gate, and one number to call for an arrival time.",
  },
  {
    km: "1200",
    title: "Prove delivery",
    body: "Seals, weights, counts and a signed proof of delivery back to you after every trip.",
  },
];
