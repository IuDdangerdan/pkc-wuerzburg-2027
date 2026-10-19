import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const nodes = new Map(),
  storage = new Map();
const make = (id) => ({
  id,
  style: {},
  value: "",
  options: [{ value: "" }],
  classList: { add() {}, remove() {} },
  focus() {},
  setAttribute() {},
  querySelectorAll() {
    return [];
  },
});
let form = {
  fields: { mode: "Bahn", bus: "Ja", status: "Gebucht", budget: "90" },
  elements: [],
};
for (const name of ["planningForm", "planningSaveState", "savePlanning"])
  nodes.set("#" + name, make(name));
nodes.set("#planningForm", form);
class FormDataMock {
  constructor(f) {
    this.f = f;
  }
  *[Symbol.iterator]() {
    yield* Object.entries(this.f.fields);
  }
}
let confirmResult = false,
  replaceTo = null;
const scrolls = [],
  frames = [];
const c = vm.createContext({
  location: { hash: "#plan" },
  state: { me: { id: "member-a", preview: false } },
  $: (s) => nodes.get(s) || null,
  window: {
    matchMedia() {
      return { matches: true, addEventListener() {} };
    },
    addEventListener() {},
    scrollTo(options) {
      scrolls.push(options);
    },
    requestAnimationFrame(fn) {
      frames.push(fn);
    },
    confirm() {
      return confirmResult;
    },
    history: {
      scrollRestoration: "auto",
      replaceState(a, b, to) {
        replaceTo = to;
      },
    },
  },
  FormData: FormDataMock,
  sessionStorage: {
    getItem(k) {
      return storage.get(k) || null;
    },
    setItem(k, v) {
      storage.set(k, v);
    },
    removeItem(k) {
      storage.delete(k);
    },
  },
  render() {},
  console,
});
vm.runInContext(
  fs.readFileSync("public/planning.js", "utf8") +
    "\nglobalThis.test={rememberPlanning,markPlanningDirty,readPlanningDraft,handleRouteChange,planningKey,draft:()=>planningDraft,dirty:()=>planningDirty,clear(){planningDraft=null;planningDirty=false},setMember(id){state.me.id=id}}",
  c,
);
c.test.markPlanningDirty();
assert.equal(c.test.draft().values.mode, "Bahn");
assert.equal(c.test.draft().values.status, "Gebucht");
assert.equal(
  nodes.get("#planningSaveState").textContent,
  "Ungespeicherte Änderungen",
);
// Anreise stays in the same draft when the lodging field changes.
form.fields.status = "Suche Zimmergemeinschaft";
c.test.markPlanningDirty();
assert.equal(c.test.draft().values.mode, "Bahn");
assert.equal(c.test.draft().values.status, "Suche Zimmergemeinschaft");
c.test.clear();
const restored = c.test.readPlanningDraft();
assert.equal(restored.values.mode, "Bahn");
assert.equal(c.test.dirty(), true);
c.location.hash = "#wiki/faq";
c.test.handleRouteChange();
assert.equal(replaceTo, "#plan");
assert.equal(scrolls.length, 0);
assert.equal(c.window.history.scrollRestoration, "manual");
confirmResult = true;
c.test.handleRouteChange();
assert.equal(scrolls.length, 1);
assert.equal(scrolls[0].top, 0);
assert.equal(scrolls[0].behavior, "instant");
frames.shift()();
assert.equal(scrolls.length, 2);
c.test.handleRouteChange();
assert.equal(scrolls.length, 2); // Rendering the same route does not move it.
c.location.hash = "#wiki/programm";
c.test.handleRouteChange();
c.location.hash = "#wiki/start";
c.test.handleRouteChange();
const beforeFrame = scrolls.length;
frames.shift()();
assert.equal(scrolls.length, beforeFrame);
frames.shift()();
assert.equal(scrolls.length, beforeFrame + 1);
c.test.clear();
c.test.setMember("member-b");
assert.equal(c.test.readPlanningDraft(), null);
console.log(
  "PASS: one draft retains both planning sections, restores after reload, marks unsaved changes, guards navigation and isolates member identities.",
);
console.log(
  "PASS: new routes start at top, cancelled/same-page renders retain scroll, and obsolete animation callbacks cannot move a later route.",
);
