/** Reproducible Pages build from the shared frontend and an empty in-memory database.
 * No live database access. Node >=22.13; npm ci --prefix scripts/pages. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url)),
  src = path.resolve(root, "../.." );
const req = createRequire(path.join(process.env.PKC_BUILD_DEPENDENCIES || root, "package.json")),
  ts = req("typescript"),
  React = req("react");
const { renderToStaticMarkup } = req("react-dom/server"),
  { DatabaseSync } = req("node:sqlite");
let harness = fs
  .readFileSync(path.join(src, "tests/access.mjs"), "utf8")
  .split("let r = await get();")[0]
  .replace(/^import .*;\n/gm, "");
const before = process.cwd();
process.chdir(src);
let initial;
try {
  initial = await vm.runInNewContext(
    `(async()=>{${harness}\nreturn await get();})()`,
    {
      fs,
      vm,
      ts,
      DatabaseSync,
      Response,
      Request,
      URL,
      console,
      crypto,
      Date,
      FormData,
      File,
      Uint8Array,
    },
  );
} finally {
  process.chdir(before);
}
if (initial.status !== 200) throw Error("Startinhalte nicht verfügbar");
const c = initial.data;
const demo = {
  settings: c.settings,
  pages: c.pages.map(({ id, title, body, updated, summary, position }) => ({
    id,
    title,
    body,
    updated,
    summary,
    position,
    history: [],
  })),
  hotels: c.hotels,
  documents: c.documents.map((d) => ({
    ...d,
    url: d.legacyPath || "/documents/" + d.name,
    history: [],
  })),
  updates: c.updates.map(({ id, body, created, buttons, title }) => ({
    id,
    body,
    created,
    buttons,
    title,
  })),
  me: {
    id: "demo-0",
    name: "Ansichts-Demo",
    linked: true,
    orga: false,
    owner: false,
    preview: false,
    canPreview: false,
  },
  members: ["Beispiel Alex", "Beispiel Kim", "Beispiel Sam"].map((name, i) => ({
    id: "demo-" + i,
    name,
  })),
  rooms: [
    {
      id: "demo-room",
      hotel: "Babelfish Hostel",
      arrival: "2027-06-04",
      departure: "2027-06-06",
      memberIds: ["demo-1"],
      spaces: 1,
      canEdit: false,
    },
  ],
  plans: [],
  privateStays: [
    { member_id: "demo-2", private_place: "Beispiel: bei Freunden" },
  ],
  notifications: [],
  questions: [],
};
// Public exports contain fixtures only. No account identifiers, mail addresses or personal contact number.
c.settings.whatsappNumber = "";
demo.settings.whatsappNumber = "";
demo.settings.questionIntro = "Fragenformular der Vorschau: Es werden keine Nachrichten verschickt.";
for (const d of demo.documents) d.url = d.url.replace(/^\//, "");
for (const h of demo.hotels) {
  if (h.url?.startsWith("/documents/")) h.url = h.url.slice(1);
  for (const l of h.links || []) if(l.url.startsWith("/documents/")) l.url = l.url.slice(1);
}
const dist = path.join(src, "pages-dist");
fs.rmSync(dist, {recursive:true, force:true});
fs.mkdirSync(dist, { recursive: true });
for (const e of fs.readdirSync(path.join(src, "public"), {
  withFileTypes: true,
}))
  if (
    (e.isFile() && /\.(js|css)$/.test(e.name)) ||
    (e.isDirectory() && ["fonts", "documents"].includes(e.name))
  )
    fs.cpSync(path.join(src, "public", e.name), path.join(dist, e.name), {
      recursive: true,
    });
// Keep shared application files unchanged. Runtime adapters load immediately before bootstrap.
const app = fs.readFileSync(path.join(dist, "app.js"), "utf8");
const cmsPath = path.join(dist, "cms.js");
fs.writeFileSync(cmsPath, fs.readFileSync(cmsPath, "utf8").replaceAll("new URL(d.url, location.origin)", "new URL(d.url, location.href)"));
for (const file of ["runtime-config.js", "runtime-adapter.js"])
  fs.copyFileSync(path.join(root, file), path.join(dist, file));
for (const file of ["style.css", "festival.css"]){
 const p=path.join(dist,file);
 fs.writeFileSync(p,fs.readFileSync(p,"utf8").replaceAll('url("/fonts/', 'url("fonts/'));
}
const orga = JSON.parse(JSON.stringify(demo));
orga.me = { ...orga.me, name: "Orga-Demo", orga: true, canPreview: true };
orga.rooms = orga.rooms.map((r) => ({
  ...r,
  number: "Beispiel 101",
  canEdit: true,
}));
orga.plans = [
  {
    member_id: "demo-0",
    status: "Noch offen",
    mode: "Auto",
    bus: "Vielleicht, je nach Preis",
    budget: "80",
    car_role: "Ich möchte mitfahren",
    car_driver: "demo-1",
    car_passengers: [],
    updated: "2026-10-21",
  },
  {
    member_id: "demo-1",
    status: "Gebucht",
    mode: "Auto",
    bus: "Nein",
    budget: "",
    car_role: "Ich fahre selbst",
    car_driver: "",
    car_capacity: 2,
    car_seats: 1,
    car_passengers: ["demo-0"],
    updated: "2026-10-21",
  },
  {
    member_id: "demo-2",
    status: "Privat organisiert",
    private_place: "Beispiel: bei Freunden",
    mode: "Bahn",
    bus: "Nein",
    budget: "",
    car_passengers: [],
    updated: "2026-10-21",
  },
];
orga.questions = [
  {
    id: "demo-question",
    member_id: "demo-1",
    body: "Beispielfrage: Wo finden wir später den Treffpunkt fürs Sightsinging?",
    created: "2026-10-21",
  },
];
orga.settingsHistory = [
  {
    date: "2026-10-20",
    data: {
      ...orga.settings,
      heroTitle: "Beispiel einer früheren Überschrift",
    },
  },
];
orga.archivedPages = [];
orga.archivedUpdates = [];
const program = orga.pages.find((p) => p.id === "programm");
if (program)
  program.history = [
    {
      date: "2026-10-20",
      title: program.title,
      body: "Beispiel eines früheren Programmstands.",
    },
  ];
fs.writeFileSync(
  path.join(dist, "demo-orga-data.json"),
  JSON.stringify(orga, null, 2),
);
fs.writeFileSync(path.join(dist, "app.js"), app);
fs.writeFileSync(
  path.join(dist, "demo-data.json"),
  JSON.stringify(demo, null, 2),
);
let page = fs
  .readFileSync(path.join(src, "app/page.tsx"), "utf8")
  .replace(/import .*;\n/g, "")
  .replace('export const dynamic = "force-dynamic";', "");
const compiled = ts.transpileModule(page, {
  compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS },
}).outputText;
const ctx = { exports: {}, React, requireChatGPTUser: async () => {} };
vm.runInNewContext(compiled, ctx);
let html = renderToStaticMarkup(await ctx.exports.default());
html = html.replaceAll('src="/', 'src="');
html = html.replace(/(<script src="bootstrap\.js)/, '<script src="runtime-config.js" defer></script><script src="runtime-adapter.js" defer></script>$1');
html = html.replaceAll("?v=one-accommodation-1", "?v=public-orga-20261021");
html = html.replace(
  /<div class="notice">[\s\S]*?<\/div>/,
  '<div class="notice">Öffentliche Ansichts-Demo mit Beispieldaten · Änderungen, Uploads und Nachrichten werden nicht übermittelt.</div>',
);
fs.writeFileSync(path.join(dist, ".nojekyll"), "");
fs.writeFileSync(
  path.join(dist, "index.html"),
  '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>PKC · Würzburg 2027 · Ansichts-Demo</title>' +
    ["style", "usability", "festival"]
      .map((x) => `<link rel="stylesheet" href="${x}.css?v=public-20261021">`)
      .join("") +
    "</head><body>" +
    html +
    "</body></html>",
);
if (
  demo.me.orga ||
  demo.members.some((m) => !m.id.startsWith("demo-")) ||
  demo.questions.length
)
  throw Error("Datentrennung verletzt");
console.log("Pages export: public fixtures; writes and uploads disabled unless backend mode is explicitly configured.");
