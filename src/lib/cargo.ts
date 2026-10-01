/**
 * The five cargoes Zia Goods carries on contract. One list, read by the
 * services cover flow, the section intro and the /options alternatives,
 * so a change of wording happens once.
 */

export type CargoKind = "molasses" | "edible-oil" | "chemicals" | "finished-goods" | "dry-cargo";

export type Cargo = {
  kind: CargoKind;
  name: string;
  line: string;
  body: string;
  specs: string[];
};

export const CARGO: Cargo[] = [
  {
    kind: "edible-oil",
    name: "Edible oil",
    line: "The cargo we were built on.",
    body: "Palm oil, soybean and canola from Port Qasim to refineries and ghee mills, in food-grade tankers that carry edible oil and nothing else.",
    specs: ["Food-grade, oil-only tanks", "Port Qasim to refinery", "Sealed & weighed each load"],
  },
  {
    kind: "molasses",
    name: "Molasses",
    line: "Heavy, slow and on the mill's clock.",
    body: "Bulk molasses from sugar mills to port, distillery and feed plant, lifted at the crushing season's pace so mill storage never backs up.",
    specs: ["Bulk tankers", "Mill to port or distillery", "Crushing-season schedules"],
  },
  {
    kind: "chemicals",
    name: "Chemicals",
    line: "Moved by the book.",
    body: "Bulk liquid chemicals in compatible tanks, driven by trained crews with the safety data sheet, placards and route plan each load needs.",
    specs: ["Compatible bulk tanks", "Trained drivers", "Placarded, with SDS"],
  },
  {
    kind: "finished-goods",
    name: "Finished goods",
    line: "Sealed at the factory, sealed at the door.",
    body: "Cartoned and palletised goods from factory to warehouse and distributor, on closed-body trucks that keep them dry and intact.",
    specs: ["Cartons & pallets", "Closed-body trucks", "Factory to distributor"],
  },
  {
    kind: "dry-cargo",
    name: "Dry cargo",
    line: "Bagged or loose, sized to the load.",
    body: "Coal, grain, sugar and fertiliser, in bags or bulk, on flatbeds and containers matched to what's being moved.",
    specs: ["Bagged & bulk", "Flatbeds & containers", "Mill, port & market runs"],
  },
];
