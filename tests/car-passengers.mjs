import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const nodes = new Map();
let dirty = 0;
for (const id of [
  "car_passengers",
  "passengersToggle",
  "car_capacity",
  "carOccupancy",
  "passengersPicker",
  "passengersSearch",
  "passengersOptions",
  "finishPassengers",
])
  nodes.set("#" + id, {
    value: "",
    hidden: true,
    textContent: "",
    innerHTML: "",
    attributes: {},
    focus() {
      this.focused = true;
    },
    setAttribute(k, v) {
      this.attributes[k] = v;
    },
    setCustomValidity(text) {
      this.validity = text;
    },
  });
nodes.get("#car_capacity").value = "4";
nodes.get("#car_passengers").value = '["a"]';
nodes.get("#passengersOptions").querySelectorAll = function () {
  return (this.inputs = [
    ...this.innerHTML.matchAll(/value="([^"]+)" (checked)?/g),
  ].map((m) => ({ value: m[1], checked: !!m[2] })));
};
const members = [
  { id: "self", name: "Daniel" },
  { id: "a", name: "Anna" },
  { id: "b", name: "Betty" },
];
const context = vm.createContext({
  state: { me: { id: "self" }, members },
  $: (s) => nodes.get(s),
  name: (id) => members.find((m) => m.id === id)?.name,
  esc: (s) => String(s),
  markPlanningDirty() {
    dirty++;
  },
});
vm.runInContext(
  fs.readFileSync("public/travel.js", "utf8") + "\nbindPassengerPicker();",
  context,
);
assert.equal(
  nodes.get("#carOccupancy").textContent,
  "4 Plätze insgesamt · 1 belegt · 3 frei",
);
nodes.get("#passengersToggle").onclick();
assert.equal(nodes.get("#passengersPicker").hidden, false);
assert.ok(!nodes.get("#passengersOptions").innerHTML.includes('value="self"'));
const betty = nodes
  .get("#passengersOptions")
  .inputs.find((i) => i.value === "b");
betty.checked = true;
betty.onchange();
assert.deepEqual(JSON.parse(nodes.get("#car_passengers").value), ["a", "b"]);
assert.equal(dirty, 1);
assert.equal(
  nodes.get("#carOccupancy").textContent,
  "4 Plätze insgesamt · 2 belegt · 2 frei",
);
nodes.get("#car_capacity").value = "1";
nodes.get("#car_capacity").oninput();
assert.ok(nodes.get("#car_capacity").validity);
assert.ok(nodes.get("#carOccupancy").textContent.includes("Mehr Personen"));
nodes.get("#car_capacity").value = "4";
nodes.get("#car_capacity").oninput();
assert.equal(nodes.get("#car_capacity").validity, "");
nodes.get("#passengersSearch").value = "bett";
nodes.get("#passengersSearch").oninput();
assert.equal(nodes.get("#passengersOptions").inputs.length, 1);
assert.equal(nodes.get("#passengersOptions").inputs[0].checked, true);
nodes.get("#finishPassengers").onclick();
assert.equal(nodes.get("#passengersPicker").hidden, true);
assert.equal(
  nodes.get("#passengersToggle").attributes["aria-expanded"],
  "false",
);
assert.equal(nodes.get("#passengersToggle").focused, true);
nodes.get("#passengersToggle").onclick();
let prevented = false;
nodes.get("#passengersPicker").onkeydown({
  key: "Escape",
  target: {},
  preventDefault() {
    prevented = true;
  },
});
assert.equal(prevented, true);
assert.equal(nodes.get("#passengersPicker").hidden, true);
console.log(
  "PASS: searchable passenger multi-select, draft updates, total/occupied/free seats, capacity validation and keyboard closing.",
);
