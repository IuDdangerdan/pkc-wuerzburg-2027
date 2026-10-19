import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const defaults = JSON.parse(fs.readFileSync("app/cms-defaults.json", "utf8"));
const seed = JSON.parse(fs.readFileSync("app/seed.json", "utf8"));
const nodes = new Map();
function node(selector) {
  if (!nodes.has(selector))
    nodes.set(selector, {
      innerHTML: "",
      textContent: "",
      style: {},
      value: "",
      options: [{ value: "" }],
      classList: { add() {}, remove() {} },
      focus() {},
      scrollIntoView() {},
      disabled: false,
      querySelectorAll: () => [],
      querySelector: (s) => node(selector + " " + s),
      attributes: {},
      setAttribute(k, v) {
        this.attributes[k] = v;
      },
      getAttribute(k) {
        return this.attributes[k] ?? null;
      },
      showModal() {},
      close() {},
    });
  return nodes.get(selector);
}
const doc = {
  querySelector: node,
  querySelectorAll: () => [],
  addEventListener() {},
  title: "",
  body: {
    classList: {
      add() {},
      toggle() {},
      contains() {
        return false;
      },
    },
  },
};
const mobileMedia = {
  matches: true,
  addEventListener(event, fn) {
    this.onchange = fn;
  },
};
const context = vm.createContext({
  document: doc,
  window: {
    addEventListener() {},
    matchMedia() {
      return mobileMedia;
    },
    history: { scrollRestoration: "auto" },
  },
  location: { hash: "#wiki/start", origin: "https://festival.test" },
  sessionStorage: {
    getItem() {
      return null;
    },
    setItem() {},
    removeItem() {},
  },
  localStorage: {
    getItem() {
      return null;
    },
  },
  console,
  URL,
  Date,
  crypto,
  setTimeout() {},
  navigator: {},
  fetch() {
    throw Error("Unexpected fetch");
  },
});
// Load browser definitions in production order, without the network-starting bootstrap.
const scriptFiles = [
  ...fs
    .readFileSync("app/page.tsx", "utf8")
    .matchAll(/<script src="\/([^?"/]+)\?[^" ]+" defer/g),
].map((match) => match[1]);
assert.ok(
  scriptFiles.length > 1,
  "Production script list must be discoverable",
);
assert.equal(
  scriptFiles.at(-1),
  "bootstrap.js",
  "Startup must run after all definitions",
);
assert.equal(
  new Set(scriptFiles).size,
  scriptFiles.length,
  "Scripts must only load once",
);
const scripts = scriptFiles.filter((name) => name !== "bootstrap.js");
vm.runInContext(
  scripts.map((name) => fs.readFileSync("public/" + name, "utf8")).join("\n") +
    "\nglobalThis.ui={setState(s){state=s},wiki,manageContent,hotelOffers,bookingDeadlines,inline,applyContentSettings,render,post,plan:renderPlanning,admin,newsList,festivalInfo,together};",
  context,
);
const fixture = {
  me: { id: "pkc-37", name: "Daniel", orga: true, linked: true },
  settings: defaults.settings,
  settingsHistory: [],
  pages: seed.pages.map((p, i) => ({
    ...p,
    position: i,
    summary: defaults.summaries[p.id] || "",
  })),
  archivedPages: [],
  hotels: defaults.hotels,
  documents: defaults.documents.map((d) => ({
    ...d,
    url: "/api/data?file=" + d.id,
  })),
  updates: [],
  notifications: [],
  rooms: [],
  plans: [],
  members: [],
  questions: [],
};
context.ui.setState(fixture);
context.ui.wiki("start");
let html = node("#content").innerHTML;
assert.ok(!html.includes(defaults.settings.heroText));
assert.ok(!html.includes("Musik &amp; Kneipenchorliebe"));
assert.ok(html.includes("Meine Planung"));
assert.ok(html.includes("Anreise und Unterkunft eintragen oder ändern."));
assert.ok(!html.includes('class="task-link"'));
assert.ok(html.includes("#wiki/programm"));
assert.ok(html.includes("Frage an die Orga stellen"));
context.ui.render();
assert.equal(node("#mobileCurrentPage").textContent, "Übersicht");
assert.equal(node("#nav").attributes["data-mobile-open"], "false");
node("#mobileMenuToggle").onclick();
assert.equal(node("#nav").attributes["data-mobile-open"], "true");
assert.equal(node("#mobileMenuToggle").attributes["aria-expanded"], "true");
node("#nav").onkeydown({ key: "Escape", preventDefault() {} });
assert.equal(node("#nav").attributes["data-mobile-open"], "false");
context.location.hash = "#wiki/faq";
context.ui.render();
assert.equal(node("#mobileCurrentPage").textContent, "Fragen & Kontakt");
assert.equal(node("#mobileMenuToggle").attributes["aria-expanded"], "false");
fixture.notifications = [{ seen: 0 }];
context.ui.render();
assert.equal(node("#mobileUnread").hidden, false);
fixture.notifications = [];
context.location.hash = "#wiki/start";
context.ui.render();
assert.equal(node("#mobileUnread").hidden, true);
assert.equal(node("#nav").hidden, true);
assert.equal(node("#nav").style.display, "none");
node("#mobileMenuToggle").onclick();
assert.equal(node("#nav").hidden, false);
assert.equal(node("#nav").style.display, "");
node("#mobileMenuToggle").onclick();
assert.equal(node("#nav").hidden, true);
mobileMedia.matches = false;
mobileMedia.onchange();
assert.equal(node("#nav").hidden, false);
mobileMedia.matches = true;
mobileMedia.onchange();
assert.equal(node("#nav").hidden, true);
context.ui.manageContent();
html = node("#content").innerHTML;
for (const text of [
  "Texte &amp; Kontakt",
  "Fristen &amp; Anreise",
  "Unterkünfte",
  "Dateien &amp; Wiki",
])
  assert.ok(html.includes(text), text);
assert.ok(!html.includes('id="settingsForm"'));
assert.ok(!html.includes('id="documentUpload"'));
context.ui.manageContent("text");
html = node("#content").innerHTML;
assert.ok(html.includes("Texte &amp; Kontakt speichern"));
assert.ok(html.includes("WhatsApp-Nummer"));
assert.ok(!html.includes("cfg-busDeadline"));
assert.ok(!html.includes('id="documentUpload"'));
context.ui.manageContent("travel");
html = node("#content").innerHTML;
assert.ok(html.includes("Fristen &amp; Anreise speichern"));
assert.ok(html.includes("cfg-busDeadline"));
assert.ok(!html.includes("cfg-whatsappNumber"));
assert.ok(!html.includes('id="documentUpload"'));
context.ui.manageContent("hotels");
html = node("#content").innerHTML;
assert.ok(html.includes('id="cmsAddHotel"'));
assert.ok(!html.includes('id="settingsForm"'));
context.ui.manageContent("files");
html = node("#content").innerHTML;
assert.ok(html.includes('id="documentUpload"'));
assert.ok(html.includes('id="cmsAddPage"'));
assert.ok(!html.includes('id="settingsForm"'));

assert.ok(context.ui.hotelOffers().includes("/api/data?file=ibis"));
assert.ok(
  context.ui
    .inline("[PDF](/documents/formular-ibis.pdf)")
    .includes("/api/data?file=ibis"),
);
fixture.hotels = fixture.hotels.map((h) =>
  h.name === "Babelfish Hostel"
    ? { ...h, deadline: "2026-11-03", price: "Neuer Preis" }
    : h,
);
context.ui.setState(fixture);
assert.ok(context.ui.hotelOffers().includes("Neuer Preis"));
assert.ok(context.ui.bookingDeadlines().includes("3.11.2026"));
fixture.me.orga = false;
context.ui.setState(fixture);
context.ui.manageContent();
assert.ok(node("#content").innerHTML.includes("Nur für die Orga"));
assert.ok(!context.ui.hotelOffers().includes("Angebot bearbeiten"));
console.log(
  "PASS: managed overview, settings forms, hotel cards/deadlines, stable document links and role-gated editor rendering.",
);

fixture.me = {
  id: "pkc-37",
  name: "Daniel",
  orga: false,
  owner: false,
  linked: true,
  canPreview: true,
  preview: true,
};
context.ui.setState(fixture);
context.ui.render();
assert.ok(!node("#nav").innerHTML.includes("Orga-Übersicht"));
assert.ok(!node("#nav").innerHTML.includes("Inhalte verwalten"));
assert.equal(node("#viewMode").textContent, "Zur Orga-Ansicht");
assert.equal(node("#previewNotice").hidden, false);
assert.ok(!node("#content").innerHTML.includes("Update schreiben"));
await assert.rejects(context.ui.post({ action: "update" }), /Vorschau/);
console.log(
  "PASS: member preview hides Orga navigation/editor controls and blocks client-side mutations.",
);

fixture.me = {
  id: "pkc-37",
  name: "Daniel",
  orga: true,
  owner: false,
  linked: true,
  canPreview: true,
  preview: false,
};
fixture.plans = [
  {
    member_id: "pkc-37",
    status: "Gebucht",
    mode: "Bahn",
    bus: "Ja",
    budget: "100",
    updated: "2026-10-19",
  },
];
context.ui.setState(fixture);
context.ui.plan();
const planning = node("#content").innerHTML;
assert.ok(planning.includes('id="planningForm"'));
assert.ok(!planning.includes('id="travelForm"'));
assert.ok(planning.includes('id="planningSaveState"'));
assert.ok(planning.includes("Deine Planung ist gespeichert."));
assert.equal((planning.match(/type="submit"/g) || []).length, 1);
assert.ok(planning.includes("Planung speichern"));
node("#lodgingFilter").value = "Alle";
node("#travelFilter").value = "Alle";
context.ui.admin();
assert.ok(
  node("#lodgingResults").innerHTML.includes('data-label="Unterkunftsstatus"'),
);
assert.ok(
  node("#travelResults").innerHTML.includes('data-label="Businteresse"'),
);
assert.ok(node("#travelResults").innerHTML.includes('role="table"'));
context.ui.wiki("faq");
html = node("#content").innerHTML;
assert.ok(html.indexOf('id="questionForm"') < html.indexOf("<article"));
assert.ok(html.includes("Fragen &amp; Kontakt"));
context.ui.festivalInfo();
assert.ok(node("#content").innerHTML.includes("Festivalinfos"));
assert.ok(node("#pages").innerHTML.includes("#wiki/kosten"));
fixture.updates = [1, 2, 3].map((i) => ({
  id: String(i),
  title: "News " + i,
  body: "Beitrag " + i,
  buttons: "[]",
}));
context.ui.setState(fixture);
const news = context.ui.newsList();
assert.ok(news.includes("Beitrag 1"));
assert.ok(!news.includes("Beitrag 3"));
assert.ok(news.includes("Alle Neuigkeiten (3)"));
console.log(
  "PASS: shared planning save/status, prominent question form, grouped navigation and limited news; labeled mobile tables retained.",
);

fixture.plans = [
  {
    member_id: "pkc-37",
    mode: "Auto",
    car_role: "Ich fahre selbst",
    car_capacity: 4,
    car_seats: 2,
    car_passengers: ["pkc-6", "pkc-7"],
  },
];
context.ui.setState(fixture);
context.ui.plan();
html = node("#content").innerHTML;
assert.ok(html.includes("Mitfahrerplätze insgesamt (ohne dich)"));
assert.ok(html.includes("auch die schon belegten"));
assert.ok(html.includes('id="passengersPicker"'));
assert.ok(html.includes('name="car_passengers_before"'));
assert.ok(!html.includes("Freie Plätze für weitere Mitfahrer"));
assert.ok(html.includes("bisherige Fahrer werden benachrichtigt"));
console.log(
  "PASS: car planning explains total seats, offers passenger selection and discloses updates/notifications.",
);

// A stored accommodation replaces the add button; private lodging needs no address.
fixture.rooms = [
  {
    id: "one-room",
    hotel: "Testhotel",
    arrival: "2027-06-04",
    departure: "2027-06-06",
    memberIds: ["pkc-37"],
    spaces: 0,
  },
];
fixture.plans = [
  { member_id: "pkc-37", status: "Gebucht", mode: "Bahn", bus: "Nein" },
];
context.ui.setState(fixture);
context.ui.plan();
assert.equal(node("#addRoom").hidden, true);
assert.ok(
  node("#planningRooms").innerHTML.includes('data-plan-room="one-room"'),
);
node("#status").value = "Privat organisiert";
node("#status").onchange();
assert.equal(node("#privateStay").hidden, false);
assert.equal(node("#private_place").disabled, false);
assert.equal(node("#private_place").maxLength, 200);
assert.ok(!node("#private_place").required);
assert.equal(node(".plan-rooms").hidden, true);
assert.equal(node("#leaveRoomNote").hidden, false);
node("#status").value = "Gebucht";
node("#status").onchange();
assert.equal(node("#privateStay").hidden, true);
assert.equal(node("#private_place").disabled, true);
console.log(
  "PASS: one editable accommodation instead of multiple add buttons, optional private location and explicit roommate departure notice.",
);
