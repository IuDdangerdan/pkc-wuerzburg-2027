import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import ts from "typescript";
import { DatabaseSync } from "node:sqlite";
const sql = new DatabaseSync(":memory:");
for (const f of fs
  .readdirSync("drizzle")
  .filter((f) => f.endsWith(".sql"))
  .sort())
  sql.exec(fs.readFileSync("drizzle/" + f, "utf8"));
const db = {
  prepare(query) {
    let args = [];
    return {
      bind(...a) {
        args = a;
        return this;
      },
      async first() {
        return sql.prepare(query).get(...args) || null;
      },
      async all() {
        return { results: sql.prepare(query).all(...args) };
      },
      async run() {
        return sql.prepare(query).run(...args);
      },
    };
  },
  async batch(stmts) {
    sql.exec("BEGIN");
    try {
      const r = [];
      for (const s of stmts) r.push(await s.run());
      sql.exec("COMMIT");
      return r;
    } catch (e) {
      sql.exec("ROLLBACK");
      throw e;
    }
  },
};
let user = {
  userId: "owner-test",
  email: "daniel95schaefer@gmail.com",
  displayName: "Daniel",
};
let source = fs
  .readFileSync("app/api/data/route.ts", "utf8")
  .replace(/\bimport[\s\S]*?;\s*/g, "")
  .replaceAll("export const dynamic", "const dynamic")
  .replaceAll("export async function", "async function");
source =
  ts.transpile(source, {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.None,
  }) + "\nglobalThis.handlers={GET,POST};";
const bucketObjects = new Map();
const bucket = {
  async put(key, bytes) {
    bucketObjects.set(key, new Uint8Array(bytes));
  },
  async get(key) {
    const bytes = bucketObjects.get(key);
    return bytes ? { body: bytes } : null;
  },
  async delete(key) {
    bucketObjects.delete(key);
  },
};
const context = vm.createContext({
  env: { DB: db, BUCKET: bucket },
  getChatGPTUser: async () => user,
  cmsDefaults: JSON.parse(fs.readFileSync("app/cms-defaults.json")),
  seed: JSON.parse(fs.readFileSync("app/seed.json")),
  Response,
  Request,
  URL,
  console,
  crypto,
  Date,
  FormData,
  File,
  Uint8Array,
});
vm.runInContext(source, context);
const { GET, POST } = context.handlers;
const get = async () => {
  const r = await GET();
  return { status: r.status, data: await r.json() };
};
const post = async (b) => {
  const r = await POST(
    new Request("https://festival.test/api/data", {
      method: "POST",
      headers: {
        origin: "https://festival.test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(b),
    }),
  );
  return { status: r.status, data: await r.json() };
};
let r = await get();
assert.equal(r.data.me.orga, true);
assert.equal(r.data.me.id, "pkc-37");
user = {
  userId: "jules-test",
  email: "jules@test.invalid",
  displayName: "Jules",
};
r = await get();
assert.equal(r.data.me.linked, false);
assert.equal((await post({ action: "plan" })).status, 403);
user = {
  userId: "owner-test",
  email: "daniel95schaefer@gmail.com",
  displayName: "Daniel",
};
assert.equal(
  (await post({ action: "link", memberId: "pkc-6", accountId: "jules-test" }))
    .status,
  200,
);
await post({
  action: "plan",
  status: "Gebucht",
  mode: "Bus",
  bus: "Ja",
  budget: "150",
});
r = await post({
  action: "room",
  hotel: "Moxy",
  arrival: "2027-06-04",
  departure: "2027-06-06",
  memberIds: ["pkc-37", "pkc-6"],
  number: "123",
  spaces: 1,
});
assert.equal(r.status, 200);
const roomId = r.data.id;
user = {
  userId: "jules-test",
  email: "jules@test.invalid",
  displayName: "Jules",
};
r = await get();
assert.equal(r.data.me.orga, false);
assert.equal(r.data.plans.length, 0);
assert.equal(r.data.rooms[0].number, "123");
assert.equal(r.data.notifications.length, 1);
assert.equal(r.data.accounts, undefined);
assert.equal(r.data.roles, undefined);
assert.equal(
  (await post({ action: "wiki", id: "faq", title: "No", body: "No" })).status,
  403,
);
assert.equal(
  (await post({ action: "role", memberId: "pkc-6", role: "orga" })).status,
  403,
);
assert.equal(
  (await post({ action: "roomNumber", id: roomId, number: "124" })).status,
  200,
);
user = {
  userId: "other-test",
  email: "other@test.invalid",
  displayName: "Other",
};
await get();
user = {
  userId: "owner-test",
  email: "daniel95schaefer@gmail.com",
  displayName: "Daniel",
};
await post({ action: "link", memberId: "pkc-7", accountId: "other-test" });
user = {
  userId: "other-test",
  email: "other@test.invalid",
  displayName: "Other",
};
r = await get();
assert.equal(r.data.rooms[0].number, undefined);
assert.equal(r.data.rooms[0].canEdit, false);
assert.equal(
  (await post({ action: "roomNumber", id: roomId, number: "999" })).status,
  403,
);
assert.equal(r.data.plans.length, 0);
user = null;
r = await get();
assert.equal(r.status, 401);
user = {
  userId: "owner-test",
  email: "daniel95schaefer@gmail.com",
  displayName: "Daniel",
};
const csrf = await POST(
  new Request("https://festival.test/api/data", {
    method: "POST",
    headers: { origin: "https://evil.invalid" },
    body: "{}",
  }),
);
assert.equal(csrf.status, 403);
console.log(
  "PASS: authenticated identity, role restrictions, room privacy, notifications, member editing, CSRF, private plans.",
);

user = {
  userId: "jules-test",
  email: "jules@test.invalid",
  displayName: "Jules",
};
assert.equal(
  (await post({ action: "question", text: "Wo treffen wir uns?" })).status,
  200,
);
assert.equal((await post({ action: "question", text: "   " })).status, 400);
assert.equal((await get()).data.questions.length, 1);
const plan = {
  action: "plan",
  status: "Noch offen",
  mode: "Auto",
  bus: "Nein",
  budget: "",
};
assert.equal((await post(plan)).status, 400);
assert.equal(
  (await post({ ...plan, car_role: "Ich fahre selbst", car_seats: "" })).status,
  400,
);
assert.equal(
  (await post({ ...plan, car_role: "Ich fahre selbst", car_seats: -1 })).status,
  400,
);
assert.equal(
  (await post({ ...plan, car_role: "Ich fahre selbst", car_seats: 3 })).status,
  200,
);
assert.equal((await get()).data.plans[0].car_seats, 3);
await post({ ...plan, car_role: "Ich möchte mitfahren", car_seats: 3 });
assert.equal((await get()).data.plans[0].car_seats, null);
await post({
  ...plan,
  mode: "Bahn",
  car_role: "Ich fahre selbst",
  car_seats: 3,
});
assert.equal((await get()).data.plans[0].car_role, "");
user = {
  userId: "other-test",
  email: "other@test.invalid",
  displayName: "Other",
};
assert.equal((await get()).data.questions.length, 0);
user = {
  userId: "owner-test",
  email: "daniel95schaefer@gmail.com",
  displayName: "Daniel",
};
assert.equal((await get()).data.questions.length, 1);
assert.ok(
  (await get()).data.notifications.some((n) =>
    n.message.includes("Frage zum Festival"),
  ),
);
console.log(
  "PASS: private question inbox and notifications; conditional car requirements, seat validation and stale-field clearing.",
);

// Passenger assignments require a saved driver plan with total passenger capacity.
await post({
  ...plan,
  car_role: "Ich fahre selbst",
  car_capacity: 3,
  car_passengers: [],
});
user = {
  userId: "jules-test",
  email: "jules@test.invalid",
  displayName: "Jules",
};
assert.equal(
  (
    await post({
      ...plan,
      car_role: "Ich möchte mitfahren",
      car_driver: "pkc-37",
    })
  ).status,
  200,
);
assert.equal((await get()).data.plans[0].car_driver, "pkc-37");
assert.equal(
  (
    await post({
      ...plan,
      car_role: "Ich möchte mitfahren",
      car_driver: "pkc-6",
    })
  ).status,
  400,
);
assert.equal(
  (
    await post({
      ...plan,
      car_role: "Ich möchte mitfahren",
      car_driver: "unknown",
    })
  ).status,
  400,
);
assert.equal(
  (await post({ ...plan, car_role: "Ich möchte mitfahren", car_driver: "" }))
    .status,
  200,
);
await post({ ...plan, car_role: "Ich möchte mitfahren", car_driver: "pkc-37" });
await post({
  ...plan,
  mode: "Bahn",
  car_role: "Ich möchte mitfahren",
  car_driver: "pkc-37",
});
assert.equal((await get()).data.plans[0].car_driver, "");
await post({
  ...plan,
  car_role: "Ich fahre selbst",
  car_seats: 2,
  car_driver: "pkc-37",
});
assert.equal((await get()).data.plans[0].car_driver, "");
console.log(
  "PASS: optional member-based driver selection, invalid/self selection rejected, stale driver cleared.",
);

user = {
  userId: "owner-test",
  email: "daniel95schaefer@gmail.com",
  displayName: "Daniel",
};
r = await get();
assert.ok(r.data.updates.some((u) => u.id === "babelfish-frist-20261014"));
assert.ok(
  !r.data.updates
    .find((u) => u.id === "bus-hostel-fristen-20261014")
    .body.includes("Babelfish"),
);
assert.equal(
  (await post({ action: "archiveUpdate", id: "babelfish-frist-20261014" }))
    .status,
  200,
);
r = await get();
assert.ok(!r.data.updates.some((u) => u.id === "babelfish-frist-20261014"));
assert.ok(
  r.data.archivedUpdates.some((u) => u.id === "babelfish-frist-20261014"),
);
assert.ok(
  !(await get()).data.updates.some((u) => u.id === "babelfish-frist-20261014"),
);
user = {
  userId: "jules-test",
  email: "jules@test.invalid",
  displayName: "Jules",
};
assert.equal(
  (await post({ action: "archiveUpdate", id: "hotel-cards-20261013" })).status,
  403,
);
assert.equal(
  (await post({ action: "restoreUpdate", id: "babelfish-frist-20261014" }))
    .status,
  403,
);
assert.equal((await get()).data.archivedUpdates, undefined);
user = {
  userId: "owner-test",
  email: "daniel95schaefer@gmail.com",
  displayName: "Daniel",
};
assert.equal(
  (await post({ action: "restoreUpdate", id: "babelfish-frist-20261014" }))
    .status,
  200,
);
assert.ok(
  (await get()).data.updates.some((u) => u.id === "babelfish-frist-20261014"),
);
assert.equal(
  (await post({ action: "archiveUpdate", id: "missing" })).status,
  404,
);
console.log(
  "PASS: separate news, Orga-only archival/restoration, archived news stay hidden across reloads.",
);

user = {
  userId: "owner-test",
  email: "daniel95schaefer@gmail.com",
  displayName: "Daniel",
};
assert.equal(
  (
    await post({
      action: "update",
      text: "Mit Buttons",
      buttons: [
        { label: "Planung", url: "#plan" },
        { label: "Website", url: "https://example.org/" },
      ],
    })
  ).status,
  200,
);
r = await get();
const buttonNews = r.data.updates.find((u) => u.body === "Mit Buttons");
assert.equal(JSON.parse(buttonNews.buttons)[0].url, "#plan");
for (const url of [
  "javascript:alert(1)",
  "data:text/html,test",
  "//evil.test",
  "#wiki/missing",
  "https://user:password@example.org/",
])
  assert.equal(
    (
      await post({
        action: "update",
        text: "Unsicher",
        buttons: [{ label: "Link", url }],
      })
    ).status,
    400,
  );
assert.equal(
  (
    await post({
      action: "update",
      text: "Leer",
      buttons: [{ label: "", url: "#plan" }],
    })
  ).status,
  400,
);
assert.equal(
  (
    await post({
      action: "update",
      text: "Zu viele",
      buttons: Array(9).fill({ label: "Planung", url: "#plan" }),
    })
  ).status,
  400,
);
user = {
  userId: "jules-test",
  email: "jules@test.invalid",
  displayName: "Jules",
};
assert.equal(
  (await post({ action: "update", text: "Nein", buttons: [] })).status,
  403,
);
console.log(
  "PASS: update buttons persist; valid internal/external links, unsafe URLs and non-Orga creation rejected.",
);

user = {
  userId: "owner-test",
  email: "daniel95schaefer@gmail.com",
  displayName: "Daniel",
};
const editable = (await get()).data.updates.find(
  (u) => u.body === "Mit Buttons",
);
assert.equal(
  (
    await post({
      action: "update",
      id: editable.id,
      text: "Bearbeitet",
      buttons: [{ label: "Unterkunft", url: "#wiki/unterkunft" }],
    })
  ).status,
  200,
);
r = await get();
let edited = r.data.updates.find((u) => u.id === editable.id);
assert.equal(edited.body, "Bearbeitet");
assert.equal(edited.created, editable.created);
assert.equal(JSON.parse(edited.buttons)[0].url, "#wiki/unterkunft");
await post({
  action: "update",
  id: editable.id,
  text: "Ohne Buttons",
  buttons: [],
});
assert.equal(
  JSON.parse(
    (await get()).data.updates.find((u) => u.id === editable.id).buttons,
  ).length,
  0,
);
assert.equal(
  (await post({ action: "update", id: "missing", text: "Test", buttons: [] }))
    .status,
  404,
);
user = {
  userId: "jules-test",
  email: "jules@test.invalid",
  displayName: "Jules",
};
assert.equal(
  (
    await post({
      action: "update",
      id: editable.id,
      text: "Nicht erlaubt",
      buttons: [],
    })
  ).status,
  403,
);
console.log(
  "PASS: Orga edit text/buttons, remove all buttons, preserve publication date; unauthorized edits rejected.",
);

user = {
  userId: "owner-test",
  email: "daniel95schaefer@gmail.com",
  displayName: "Daniel",
};
await post({ action: "role", memberId: "pkc-7", role: "orga" });
user = {
  userId: "jules-test",
  email: "jules@test.invalid",
  displayName: "Jules",
};
await post({ action: "question", text: "Frage an alle in der Orga" });
user = {
  userId: "other-test",
  email: "other@test.invalid",
  displayName: "Other",
};
r = await get();
assert.ok(r.data.questions.some((q) => q.body === "Frage an alle in der Orga"));
assert.ok(
  r.data.notifications.some((n) => n.message.includes("Frage zum Festival")),
);
user = {
  userId: "owner-test",
  email: "daniel95schaefer@gmail.com",
  displayName: "Daniel",
};
await post({ action: "role", memberId: "pkc-7", role: "member" });
user = {
  userId: "other-test",
  email: "other@test.invalid",
  displayName: "Other",
};
assert.equal((await get()).data.questions.length, 0);
console.log(
  "PASS: all Orga members can read questions and receive notifications; role removal revokes access.",
);

user = {
  userId: "owner-test",
  email: "daniel95schaefer@gmail.com",
  displayName: "Daniel",
};
const beforeNews = sql
  .prepare("SELECT count(*) AS n FROM notifications")
  .get().n;
await post({
  action: "update",
  title: "Busabfrage läuft",
  text: "Bitte Rückmeldung geben",
  notify: true,
  buttons: [{ label: "Planung", url: "#plan" }],
});
const memberCount = sql.prepare("SELECT count(*) AS n FROM members").get().n;
assert.equal(
  sql.prepare("SELECT count(*) AS n FROM notifications").get().n - beforeNews,
  memberCount,
);
const published = (await get()).data.updates.find(
  (u) => u.title === "Busabfrage läuft",
);
const afterPublish = sql
  .prepare("SELECT count(*) AS n FROM notifications")
  .get().n;
await post({
  action: "update",
  id: published.id,
  title: "Busabfrage geändert",
  text: "Neuer Text",
  buttons: [],
});
await post({ action: "archiveUpdate", id: published.id });
await post({ action: "restoreUpdate", id: published.id });
assert.equal(
  sql.prepare("SELECT count(*) AS n FROM notifications").get().n,
  afterPublish,
);
user = {
  userId: "jules-test",
  email: "jules@test.invalid",
  displayName: "Jules",
};
r = await get();
assert.ok(
  r.data.notifications.some(
    (n) => n.message === "Neue Neuigkeit: Busabfrage läuft",
  ),
);
console.log(
  "PASS: new news notify all members atomically; editing/archiving/restoring does not resend.",
);

user = {
  userId: "owner-test",
  email: "daniel95schaefer@gmail.com",
  displayName: "Daniel",
};
const notificationCount = () =>
  sql.prepare("SELECT count(*) AS n FROM notifications").get().n;
const quietBefore = notificationCount();
await post({
  action: "update",
  title: "In Arbeit",
  text: "Erste Fassung",
  buttons: [],
});
assert.equal(notificationCount(), quietBefore);
let quiet = (await get()).data.updates.find((u) => u.title === "In Arbeit");
assert.equal(quiet.notified_at, null);
for (let i = 0; i < 3; i++)
  await post({
    action: "update",
    id: quiet.id,
    title: "In Arbeit",
    text: "Fassung " + i,
    buttons: [],
  });
assert.equal(notificationCount(), quietBefore);
assert.equal(
  (await post({ action: "notifyUpdate", id: quiet.id })).status,
  200,
);
assert.equal(notificationCount() - quietBefore, memberCount);
quiet = (await get()).data.updates.find((u) => u.id === quiet.id);
assert.ok(quiet.notified_at);
const manualCount = notificationCount();
await post({
  action: "update",
  id: quiet.id,
  title: "Fertig",
  text: "Neue Infos",
  buttons: [],
  notify: true,
});
assert.equal(notificationCount() - manualCount, memberCount);
await post({ action: "archiveUpdate", id: quiet.id });
assert.equal(
  (await post({ action: "notifyUpdate", id: quiet.id })).status,
  400,
);
assert.equal(
  (await post({ action: "notifyUpdate", id: "missing" })).status,
  404,
);
user = {
  userId: "jules-test",
  email: "jules@test.invalid",
  displayName: "Jules",
};
assert.equal(
  (await post({ action: "notifyUpdate", id: quiet.id })).status,
  403,
);
console.log(
  "PASS: quiet save/edit by default, explicit publish-time or later notification, timestamp and Orga-only send.",
);

user = {
  userId: "owner-test",
  email: "daniel95schaefer@gmail.com",
  displayName: "Daniel",
};
r = await get();
assert.equal(r.data.hotels.length, 12);
assert.equal(r.data.documents.length, 3);
const initialSettings = r.data.settings;
assert.equal(
  (
    await post({
      action: "cmsSettings",
      settings: {
        ...initialSettings,
        busDeadline: "2026-11-02",
        contactName: "Neue Kontaktperson",
      },
    })
  ).status,
  200,
);
r = await get();
assert.equal(r.data.settings.busDeadline, "2026-11-02");
assert.equal(r.data.settings.contactName, "Neue Kontaktperson");
assert.ok(r.data.settingsHistory.length);
assert.equal(
  (
    await post({
      action: "cmsSettings",
      settings: { ...initialSettings, eventUrl: "javascript:alert(1)" },
    })
  ).status,
  400,
);
const originalHotel = r.data.hotels.find((h) => h.name === "Moxy");
const changedHotel = {
  ...originalHotel,
  name: "Moxy Test",
  price: "123 € pro Zimmer/Nacht",
};
assert.equal(
  (
    await post({
      action: "cmsHotel",
      id: originalHotel.id,
      hotel: changedHotel,
    })
  ).status,
  200,
);
r = await get();
assert.equal(r.data.rooms.find((x) => x.id === roomId).hotel, "Moxy Test");
assert.equal(
  r.data.hotels.find((x) => x.id === originalHotel.id).price,
  "123 € pro Zimmer/Nacht",
);
await post({ action: "cmsHotelArchive", id: originalHotel.id, archived: true });
await post({
  action: "wiki",
  id: "cms-test-page",
  title: "CMS Test",
  body: "Text",
  summary: "Kurztext",
  position: 9,
});
assert.equal(
  (await get()).data.pages.find((p) => p.id === "cms-test-page").summary,
  "Kurztext",
);
await post({ action: "cmsPageArchive", id: "cms-test-page" });
r = await get();
assert.ok(r.data.archivedPages.some((p) => p.id === "cms-test-page"));
assert.equal(
  (await post({ action: "cmsPageArchive", id: "start" })).status,
  400,
);
user = {
  userId: "jules-test",
  email: "jules@test.invalid",
  displayName: "Jules",
};
r = await get();
assert.ok(!r.data.hotels.some((h) => h.id === originalHotel.id));
assert.ok(!r.data.pages.some((p) => p.id === "cms-test-page"));
assert.equal(r.data.archivedPages, undefined);
assert.equal(r.data.settingsHistory, undefined);
for (const action of [
  "cmsSettings",
  "cmsHotel",
  "cmsHotelArchive",
  "cmsPageArchive",
  "cmsDocument",
])
  assert.equal((await post({ action })).status, 403);
user = {
  userId: "owner-test",
  email: "daniel95schaefer@gmail.com",
  displayName: "Daniel",
};
const upload = async (file, id) => {
  const form = new FormData();
  form.set("file", file);
  form.set("label", "Test-PDF");
  if (id) form.set("id", id);
  const response = await POST(
    new Request("https://festival.test/api/data", {
      method: "POST",
      headers: { origin: "https://festival.test" },
      body: form,
    }),
  );
  return { status: response.status, data: await response.json() };
};
let uploaded = await upload(
  new File(["%PDF-1.4\nTest original"], "original.pdf", {
    type: "application/pdf",
  }),
);
assert.equal(uploaded.status, 200);
const documentId = uploaded.data.id;
const fileUrl = "https://festival.test/api/data?file=" + documentId;
let fileResponse = await GET(new Request(fileUrl));
assert.equal(fileResponse.status, 200);
assert.ok((await fileResponse.text()).includes("Test original"));
assert.equal(
  (
    await upload(
      new File(["%PDF-1.4\nTest ersetzt"], "replacement.pdf", {
        type: "application/pdf",
      }),
      documentId,
    )
  ).status,
  200,
);
fileResponse = await GET(new Request(fileUrl));
assert.ok((await fileResponse.text()).includes("Test ersetzt"));
assert.equal(
  (await get()).data.documents.find((d) => d.id === documentId).url,
  "/api/data?file=" + documentId,
);
assert.equal(
  (await post({ action: "cmsDocument", id: documentId, restore: 0 })).status,
  200,
);
fileResponse = await GET(new Request(fileUrl));
assert.ok((await fileResponse.text()).includes("Test original"));
assert.equal(
  (
    await upload(
      new File(["<script>alert(1)</script>"], "fake.pdf", {
        type: "application/pdf",
      }),
    )
  ).status,
  400,
);
await post({ action: "cmsDocument", id: documentId, archived: true });
user = {
  userId: "jules-test",
  email: "jules@test.invalid",
  displayName: "Jules",
};
assert.equal((await GET(new Request(fileUrl))).status, 404);
assert.equal(
  (
    await upload(
      new File(["%PDF-1.4"], "member.pdf", { type: "application/pdf" }),
    )
  ).status,
  403,
);
user = null;
assert.equal((await GET(new Request(fileUrl))).status, 401);
console.log(
  "PASS: persisted CMS settings/hotels/pages, rename propagation, Orga-only editing; authenticated file upload, stable replacement links, restoration, archive, file signature checks.",
);

user = {
  userId: "owner-test",
  email: "daniel95schaefer@gmail.com",
  displayName: "Daniel",
};
const full = (await get()).data;
let previewResponse = await GET(
  new Request("https://festival.test/api/data?preview=member"),
);
const preview = await previewResponse.json();
assert.equal(preview.me.orga, false);
assert.equal(preview.me.owner, false);
assert.equal(preview.me.preview, true);
assert.equal(preview.me.canPreview, true);
assert.equal(preview.accounts, undefined);
assert.equal(preview.roles, undefined);
assert.equal(preview.archivedUpdates, undefined);
assert.equal(preview.archivedPages, undefined);
assert.equal(preview.settingsHistory, undefined);
assert.ok(preview.plans.every((p) => p.member_id === "pkc-37"));
assert.ok(preview.questions.every((q) => q.member_id === "pkc-37"));
assert.ok(preview.hotels.every((h) => !h.archived));
assert.ok(preview.documents.every((d) => !d.archived));
assert.equal((await get()).data.me.orga, true);
user = {
  userId: "jules-test",
  email: "jules@test.invalid",
  displayName: "Jules",
};
previewResponse = await GET(
  new Request("https://festival.test/api/data?preview=member"),
);
const regular = await previewResponse.json();
assert.equal(regular.me.canPreview, false);
assert.equal(regular.me.orga, false);
console.log(
  "PASS: member preview uses server-side member data scope without changing roles; regular members cannot gain Orga access.",
);

user = {
  userId: "owner-test",
  email: "daniel95schaefer@gmail.com",
  displayName: "Daniel",
};
await post({
  action: "plan",
  status: "Gebucht",
  mode: "Auto",
  bus: "Ja",
  budget: "120",
  car_role: "Ich fahre selbst",
  car_capacity: 2,
  car_seats: 2,
});
await post({
  action: "plan",
  section: "lodging",
  status: "Suche Zimmergemeinschaft",
  mode: "Bahn",
  bus: "Nein",
});
r = await get();
let independent = r.data.plans.find((p) => p.member_id === "pkc-37");
assert.equal(independent.status, "Suche Zimmergemeinschaft");
assert.equal(independent.mode, "Auto");
assert.equal(independent.car_seats, 2);
assert.equal(independent.budget, "120");
await post({
  action: "plan",
  section: "travel",
  mode: "Bahn",
  bus: "Nein",
  budget: "",
  status: "Gebucht",
});
independent = (await get()).data.plans.find((p) => p.member_id === "pkc-37");
assert.equal(independent.status, "Suche Zimmergemeinschaft");
assert.equal(independent.mode, "Bahn");
assert.equal(independent.car_role, "");
await post({
  action: "update",
  title: "Nachricht bleibt erhalten",
  text: "Test der Archivierung",
  buttons: [],
  notify: true,
});
const archivedNews = (await get()).data.updates.find(
  (u) => u.title === "Nachricht bleibt erhalten",
);
await post({ action: "archiveUpdate", id: archivedNews.id });
user = {
  userId: "jules-test",
  email: "jules@test.invalid",
  displayName: "Jules",
};
r = await get();
assert.ok(!r.data.updates.some((u) => u.id === archivedNews.id));
assert.ok(
  r.data.notifications.some((n) =>
    n.message.includes("Nachricht bleibt erhalten"),
  ),
);
console.log(
  "PASS: lodging/travel save independently; archiving news preserves delivered member messages.",
);

user = {
  userId: "owner-test",
  email: "daniel95schaefer@gmail.com",
  displayName: "Daniel",
};
await post({ action: "cmsSettings", settings: { busDeadline: "2026-11-05" } });
const beforePartial = (await get()).data.settings;
await post({
  action: "cmsSettings",
  settings: { contactName: "Bereichstest" },
});
const afterPartial = (await get()).data.settings;
assert.equal(afterPartial.contactName, "Bereichstest");
assert.equal(afterPartial.busDeadline, beforePartial.busDeadline);
assert.equal(afterPartial.heroTitle, beforePartial.heroTitle);
console.log("PASS: saving one content area preserves settings of other areas.");

// The shared save validates every section before committing plan, rooms and notifications.
user = {
  userId: "owner-test",
  email: "daniel95schaefer@gmail.com",
  displayName: "Daniel",
};
const combined = {
  action: "planning",
  status: "Gebucht",
  mode: "Bahn",
  bus: "Vielleicht, je nach Preis",
  budget: "90",
  rooms: [
    {
      id: roomId,
      hotel: "Gemeinsamer Test",
      arrival: "2028-06-04",
      departure: "2028-06-06",
      memberIds: ["pkc-37", "pkc-6"],
      number: "",
      spaces: 1,
    },
  ],
};
const prior = JSON.stringify(
  sql.prepare("SELECT * FROM plans WHERE member_id='pkc-37'").get(),
);
assert.equal(
  (
    await post({
      ...combined,
      rooms: [{ ...combined.rooms[0], departure: "2028-06-03" }],
    })
  ).status,
  400,
);
assert.equal(
  JSON.stringify(
    sql.prepare("SELECT * FROM plans WHERE member_id='pkc-37'").get(),
  ),
  prior,
);
assert.equal(
  (
    await post({
      ...combined,
      rooms: [
        combined.rooms[0],
        { ...combined.rooms[0], hotel: "Überlappend" },
      ],
    })
  ).status,
  400,
);
assert.equal(
  JSON.stringify(
    sql.prepare("SELECT * FROM plans WHERE member_id='pkc-37'").get(),
  ),
  prior,
);
sql.exec(
  "CREATE TRIGGER fail_test_room BEFORE INSERT ON rooms WHEN NEW.hotel='Rollback-Test' BEGIN SELECT RAISE(ABORT,'Simulierter Datenbankfehler'); END",
);
assert.equal(
  (
    await post({
      ...combined,
      rooms: [{ ...combined.rooms[0], hotel: "Rollback-Test" }],
    })
  ).status,
  400,
);
assert.equal(
  JSON.stringify(
    sql.prepare("SELECT * FROM plans WHERE member_id='pkc-37'").get(),
  ),
  prior,
);
sql.exec("DROP TRIGGER fail_test_room");
const beforeNotes = sql
  .prepare("SELECT COUNT(*) AS n FROM notifications WHERE member_id='pkc-6'")
  .get().n;
assert.equal((await post(combined)).status, 200);
r = await get();
assert.equal(r.data.plans.find((p) => p.member_id === "pkc-37").budget, "90");
const jointRoom = r.data.rooms.find((x) => x.hotel === "Gemeinsamer Test");
assert.ok(jointRoom);
assert.equal(
  sql
    .prepare("SELECT COUNT(*) AS n FROM notifications WHERE member_id='pkc-6'")
    .get().n,
  beforeNotes + 1,
);
user = {
  userId: "other-test",
  email: "other@test.invalid",
  displayName: "Other",
};
const otherBefore = JSON.stringify(
  sql.prepare("SELECT * FROM plans WHERE member_id='pkc-7'").get(),
);
assert.equal(
  (
    await post({
      ...combined,
      rooms: [{ ...combined.rooms[0], id: jointRoom.id }],
    })
  ).status,
  403,
);
assert.equal(
  JSON.stringify(
    sql.prepare("SELECT * FROM plans WHERE member_id='pkc-7'").get(),
  ),
  otherBefore,
);
console.log(
  "PASS: shared planning save is atomic, rejects invalid/overlapping/unauthorized rooms, preserves existing data on failure, and notifies partners only after commit.",
);

user = {
  userId: "owner-test",
  email: "daniel95schaefer@gmail.com",
  displayName: "Daniel",
};
for (const [id, member] of [
  ["read-selected", "pkc-37"],
  ["read-new-arrival", "pkc-37"],
  ["read-foreign", "pkc-6"],
])
  sql
    .prepare(
      "INSERT INTO notifications(id,member_id,message,created,seen) VALUES(?,?,?,?,0)",
    )
    .run(id, member, "Lesestatus-Test", "2026-10-19T00:00:00Z");
assert.equal(
  (await post({ action: "seen", ids: ["read-selected", "read-foreign"] }))
    .status,
  200,
);
assert.equal(
  sql.prepare("SELECT seen FROM notifications WHERE id=?").get("read-selected")
    .seen,
  1,
);
assert.equal(
  sql
    .prepare("SELECT seen FROM notifications WHERE id=?")
    .get("read-new-arrival").seen,
  0,
);
assert.equal(
  sql.prepare("SELECT seen FROM notifications WHERE id=?").get("read-foreign")
    .seen,
  0,
);
assert.equal(
  (await post({ action: "seen", ids: "read-new-arrival" })).status,
  400,
);
assert.equal(
  (await post({ action: "seen", ids: Array(101).fill("read-new-arrival") }))
    .status,
  400,
);
assert.equal((await post({ action: "seen", ids: [] })).status, 200);
console.log(
  "PASS: read receipts affect only supplied own notifications; other/new notifications stay unread; invalid batches rejected.",
);

// Carpools: explicit capacity, synchronized passenger assignments, and transactional notifications.
sql.exec("DELETE FROM plans; DELETE FROM notifications;");
sql
  .prepare("UPDATE members SET user_id='ride-passenger' WHERE id='pkc-6'")
  .run();
sql.prepare("UPDATE members SET user_id='ride-second' WHERE id='pkc-7'").run();
const rideOwner = {
  userId: "owner-test",
  email: "daniel95schaefer@gmail.com",
  displayName: "Daniel",
};
const ridePassenger = {
  userId: "ride-passenger",
  email: "ride@test.invalid",
  displayName: "Jules",
};
const rideSecond = {
  userId: "ride-second",
  email: "second@test.invalid",
  displayName: "Laura",
};
const ridePlan = {
  action: "planning",
  status: "Noch offen",
  mode: "Auto",
  car_role: "Ich fahre selbst",
  car_capacity: 4,
  car_passengers: ["pkc-6", "pkc-7"],
  bus: "Nein",
  budget: "",
  rooms: [],
};
sql
  .prepare(
    "INSERT INTO plans(member_id,status,mode,bus,budget,updated) VALUES('pkc-6','Gebucht','Bahn','Vielleicht, je nach Preis','123','before')",
  )
  .run();
user = rideOwner;
assert.equal((await post(ridePlan)).status, 200);
let rideData = (await get()).data;
let driver = rideData.plans.find((p) => p.member_id === "pkc-37");
assert.equal(driver.car_capacity, 4);
assert.equal(driver.car_seats, 2);
assert.deepEqual(driver.car_passengers, ["pkc-6", "pkc-7"]);
let passenger = rideData.plans.find((p) => p.member_id === "pkc-6");
assert.equal(passenger.mode, "Auto");
assert.equal(passenger.car_role, "Ich möchte mitfahren");
assert.equal(passenger.car_driver, "pkc-37");
assert.equal(passenger.status, "Gebucht");
assert.equal(passenger.bus, "Vielleicht, je nach Preis");
assert.equal(passenger.budget, "123");
assert.equal(
  rideData.plans.find((p) => p.member_id === "pkc-7").status,
  "Noch offen",
);
assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM notifications").get().n, 2);
assert.equal((await post(ridePlan)).status, 200);
assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM notifications").get().n, 2);
for (const bad of [
  { ...ridePlan, car_capacity: 1 },
  { ...ridePlan, car_capacity: "" },
  { ...ridePlan, car_capacity: -1 },
  { ...ridePlan, car_passengers: ["pkc-37"] },
  { ...ridePlan, car_passengers: ["unknown"] },
  { ...ridePlan, car_passengers: ["pkc-6", "pkc-6"] },
  { ...ridePlan, car_passengers: "invalid" },
  { ...ridePlan, car_passengers_before: [] },
  {
    ...ridePlan,
    rooms: [
      {
        hotel: "Invalid",
        arrival: "2028-06-06",
        departure: "2028-06-01",
        memberIds: ["pkc-37"],
      },
    ],
  },
]) {
  const before = JSON.stringify(
    sql.prepare("SELECT * FROM plans ORDER BY member_id").all(),
  );
  const count = sql.prepare("SELECT COUNT(*) AS n FROM notifications").get().n;
  assert.equal((await post(bad)).status, 400);
  assert.equal(
    JSON.stringify(sql.prepare("SELECT * FROM plans ORDER BY member_id").all()),
    before,
  );
  assert.equal(
    sql.prepare("SELECT COUNT(*) AS n FROM notifications").get().n,
    count,
  );
}
user = ridePassenger;
rideData = (await get()).data;
assert.equal(rideData.plans.length, 1);
assert.equal(rideData.plans[0].car_driver, "pkc-37");
assert.ok(
  rideData.notifications.some((n) =>
    n.message.includes("als Mitfahrer eingetragen"),
  ),
);

assert.equal(
  (
    await post({
      action: "planning",
      status: "Gebucht",
      mode: "Bahn",
      bus: "Vielleicht, je nach Preis",
      budget: "123",
      rooms: [],
    })
  ).status,
  200,
);
user = rideOwner;
driver = (await get()).data.plans.find((p) => p.member_id === "pkc-37");
assert.equal(driver.car_seats, 3);
assert.deepEqual(driver.car_passengers, ["pkc-7"]);
assert.ok(
  (await get()).data.notifications.some((n) =>
    n.message.includes("nicht mehr bei dir"),
  ),
);
assert.equal(
  (await post({ ...ridePlan, car_capacity: 1, car_passengers: ["pkc-7"] }))
    .status,
  200,
);
user = ridePassenger;
assert.equal(
  (
    await post({
      action: "planning",
      status: "Gebucht",
      mode: "Auto",
      car_role: "Ich möchte mitfahren",
      car_driver: "pkc-37",
      bus: "Nein",
      budget: "",
      rooms: [],
    })
  ).status,
  400,
);
// Database guard also catches overbooking inside a transaction, after application validation.
assert.throws(
  () =>
    sql
      .prepare(
        "UPDATE plans SET mode='Auto',car_role='Ich möchte mitfahren',car_driver='pkc-37' WHERE member_id='pkc-6'",
      )
      .run(),
  /Gesamtzahl/,
);
assert.equal(
  sql.prepare("SELECT car_driver FROM plans WHERE member_id='pkc-6'").get()
    .car_driver,
  "",
);
user = rideOwner;
assert.equal(
  (await post({ ...ridePlan, car_capacity: 0, car_passengers: [] })).status,
  200,
);
user = rideSecond;
rideData = (await get()).data;
assert.equal(rideData.plans[0].car_driver, "");
assert.ok(
  rideData.notifications.some((n) => n.message.includes("Mitfahrt aufgehoben")),
);
user = rideOwner;
assert.equal(
  (await post({ ...ridePlan, car_passengers: ["pkc-6"] })).status,
  200,
);
assert.equal(
  (
    await post({
      action: "planning",
      status: "Noch offen",
      mode: "Bahn",
      bus: "Nein",
      budget: "",
      rooms: [],
    })
  ).status,
  200,
);
assert.equal(
  sql.prepare("SELECT car_driver FROM plans WHERE member_id='pkc-6'").get()
    .car_driver,
  "",
);
assert.equal(
  sql.prepare("SELECT car_capacity FROM plans WHERE member_id='pkc-37'").get()
    .car_capacity,
  null,
);
console.log(
  "PASS: total car capacity, selected passengers, private synchronized plans, notifications, removal/leave, full cars, conflicts, stale lists and atomic rollback.",
);

// Passengers and drivers can correct assignments: the last valid save takes effect.
sql.exec("DELETE FROM plans; DELETE FROM notifications;");
user = rideOwner;
assert.equal(
  (await post({ ...ridePlan, car_capacity: 1, car_passengers: ["pkc-6"] }))
    .status,
  200,
);
user = rideSecond;
assert.equal(
  (await post({ ...ridePlan, car_capacity: 1, car_passengers: ["pkc-6"] }))
    .status,
  200,
);
assert.equal(
  sql.prepare("SELECT car_driver FROM plans WHERE member_id='pkc-6'").get()
    .car_driver,
  "pkc-7",
);
assert.equal(
  sql.prepare("SELECT car_seats FROM plans WHERE member_id='pkc-37'").get()
    .car_seats,
  1,
);
assert.equal((await get()).data.plans[0].car_seats, 0);
assert.deepEqual((await get()).data.plans[0].car_passengers, ["pkc-6"]);
assert.ok(
  sql
    .prepare("SELECT message FROM notifications WHERE member_id='pkc-37'")
    .all()
    .some((n) => n.message.includes("fährt jetzt bei")),
);
user = ridePassenger;
let restored = (await get()).data.plans[0];
assert.equal(restored.mode, "Auto");
assert.equal(restored.car_role, "Ich möchte mitfahren");
assert.equal(restored.car_driver, "pkc-7");
assert.ok(
  (await get()).data.notifications.some((n) =>
    n.message.includes("bisherige Anreise wurde"),
  ),
);
assert.equal(
  (
    await post({
      action: "planning",
      status: "Gebucht",
      mode: "Auto",
      car_role: "Ich möchte mitfahren",
      car_driver: "pkc-37",
      bus: "Nein",
      budget: "77",
      rooms: [],
    })
  ).status,
  200,
);
user = rideOwner;
assert.equal(
  (await get()).data.plans.find((p) => p.member_id === "pkc-37").car_seats,
  0,
);
user = rideSecond;
assert.equal((await get()).data.plans[0].car_seats, 1);
const transferBefore = JSON.stringify(
  sql.prepare("SELECT * FROM plans ORDER BY member_id").all(),
);
const noticesBefore = sql
  .prepare("SELECT COUNT(*) AS n FROM notifications")
  .get().n;
assert.equal(
  (await post({ ...ridePlan, car_capacity: 0, car_passengers: ["pkc-6"] }))
    .status,
  400,
);
assert.equal(
  (
    await post({
      ...ridePlan,
      car_capacity: 2,
      car_passengers: ["pkc-6"],
      rooms: [
        {
          hotel: "Invalid",
          arrival: "2028-06-06",
          departure: "2028-06-01",
          memberIds: ["pkc-7"],
        },
      ],
    })
  ).status,
  400,
);
assert.equal(
  JSON.stringify(sql.prepare("SELECT * FROM plans ORDER BY member_id").all()),
  transferBefore,
);
assert.equal(
  sql.prepare("SELECT COUNT(*) AS n FROM notifications").get().n,
  noticesBefore,
);
// An existing driver can become a passenger; their passengers are released from the old carpool.
assert.equal(
  (await post({ ...ridePlan, car_capacity: 2, car_passengers: ["pkc-37"] }))
    .status,
  200,
);
assert.equal(
  sql.prepare("SELECT car_driver FROM plans WHERE member_id='pkc-37'").get()
    .car_driver,
  "pkc-7",
);
assert.equal(
  sql.prepare("SELECT car_driver FROM plans WHERE member_id='pkc-6'").get()
    .car_driver,
  "",
);
assert.equal(
  sql.prepare("SELECT budget FROM plans WHERE member_id='pkc-6'").get().budget,
  "77",
);
assert.ok(
  sql
    .prepare("SELECT message FROM notifications WHERE member_id='pkc-6'")
    .all()
    .some((n) => n.message.includes("Fahrerwahl ist wieder offen")),
);
const repeatCount = sql
  .prepare("SELECT COUNT(*) AS n FROM notifications")
  .get().n;
assert.equal(
  (await post({ ...ridePlan, car_capacity: 2, car_passengers: ["pkc-37"] }))
    .status,
  200,
);
assert.equal(
  sql.prepare("SELECT COUNT(*) AS n FROM notifications").get().n,
  repeatCount,
);
console.log(
  "PASS: driver/passenger corrections transfer membership, update both capacities, notify all affected people, persist on reload and roll back invalid/full-car transfers.",
);

user = ridePassenger;
assert.equal(
  (
    await post({
      action: "planning",
      status: "Gebucht",
      mode: "Auto",
      car_role: "Ich möchte mitfahren",
      car_driver: "pkc-37",
      bus: "Nein",
      budget: "",
      rooms: [],
    })
  ).status,
  400,
); // target is itself a passenger
assert.equal(
  (
    await post({
      action: "planning",
      status: "Gebucht",
      mode: "Auto",
      car_role: "Ich möchte mitfahren",
      car_driver: "pkc-8",
      bus: "Nein",
      budget: "",
      rooms: [],
    })
  ).status,
  400,
); // no confirmed driver plan
console.log(
  "PASS: selecting a passenger or an unconfirmed driver is rejected, preserving actual car capacity checks.",
);

// One festival accommodation per member, including private arrangements.
user = {
  userId: "owner-test",
  email: "daniel95schaefer@gmail.com",
  displayName: "Daniel",
};
sql.exec("DELETE FROM rooms; DELETE FROM plans; DELETE FROM notifications;");
const lodgingPlan = {
  action: "planning",
  status: "Privat organisiert",
  private_place: "",
  mode: "Bahn",
  bus: "Nein",
  budget: "",
  rooms: [],
};
assert.equal((await post(lodgingPlan)).status, 200);
let lodgingData = (await get()).data;
assert.equal(
  lodgingData.plans.find((p) => p.member_id === "pkc-37").private_place,
  "",
);
assert.deepEqual(lodgingData.privateStays, [
  { member_id: "pkc-37", private_place: "" },
]);
assert.equal(
  (await post({ ...lodgingPlan, private_place: "Bei Freunden" })).status,
  200,
);
assert.equal(
  (await post({ ...lodgingPlan, private_place: "x".repeat(201) })).status,
  400,
);
assert.equal((await get()).data.privateStays[0].private_place, "Bei Freunden");
const lodgingRoom = {
  hotel: "Einziges Hotel",
  arrival: "2027-06-04",
  departure: "2027-06-06",
  memberIds: ["pkc-37", "pkc-6"],
  number: "15",
  spaces: 1,
};
assert.equal((await post({ action: "room", ...lodgingRoom })).status, 400);
// Explicitly switching from private to a hotel clears the private location and creates just one room.
assert.equal(
  (await post({ ...lodgingPlan, status: "Gebucht", rooms: [lodgingRoom] }))
    .status,
  200,
);
lodgingData = (await get()).data;
const singleRoomId = lodgingData.rooms[0].id;
assert.equal(lodgingData.privateStays.length, 0);
assert.equal(
  lodgingData.plans.find((p) => p.member_id === "pkc-37").private_place,
  "",
);
// Different dates do not permit a second accommodation; neither does a different room owner.
assert.equal(
  (
    await post({
      action: "room",
      ...lodgingRoom,
      arrival: "2030-01-01",
      departure: "2030-01-02",
    })
  ).status,
  400,
);
assert.equal(
  (
    await post({
      action: "room",
      ...lodgingRoom,
      memberIds: ["pkc-6", "pkc-7"],
    })
  ).status,
  400,
);
assert.equal(
  (
    await post({
      ...lodgingPlan,
      status: "Gebucht",
      rooms: [
        lodgingRoom,
        { ...lodgingRoom, arrival: "2030-01-01", departure: "2030-01-02" },
      ],
    })
  ).status,
  400,
);
assert.equal(
  (
    await post({
      action: "room",
      ...lodgingRoom,
      id: singleRoomId,
      hotel: "Geändertes Hotel",
    })
  ).status,
  200,
);
assert.equal((await get()).data.rooms.length, 1);
// A failed private switch must not remove room membership or send notifications.
const roomBeforePrivate = JSON.stringify(
  sql.prepare("SELECT * FROM rooms").all(),
);
const notesBeforePrivate = sql
  .prepare("SELECT COUNT(*) AS n FROM notifications")
  .get().n;
assert.equal((await post({ ...lodgingPlan, mode: "Unbekannt" })).status, 400);
assert.equal(
  JSON.stringify(sql.prepare("SELECT * FROM rooms").all()),
  roomBeforePrivate,
);
assert.equal(
  sql.prepare("SELECT COUNT(*) AS n FROM notifications").get().n,
  notesBeforePrivate,
);
assert.equal(
  (await post({ ...lodgingPlan, private_place: "Privat bei Freunden" })).status,
  200,
);
lodgingData = (await get()).data;
assert.deepEqual(lodgingData.rooms[0].memberIds, ["pkc-6"]);
assert.equal(lodgingData.rooms[0].number, "15");
assert.equal(lodgingData.rooms[0].hotel, "Geändertes Hotel");
assert.equal(
  sql.prepare("SELECT COUNT(*) AS n FROM notifications").get().n,
  notesBeforePrivate + 1,
);
assert.match(
  sql
    .prepare("SELECT message FROM notifications ORDER BY rowid DESC LIMIT 1")
    .get().message,
  /gehört nicht mehr/,
);
// Legacy travel-only saves preserve the private stay; other linked members see only its public fields.
assert.equal(
  (
    await post({
      action: "plan",
      section: "travel",
      mode: "Bus",
      bus: "Ja",
      budget: "22",
    })
  ).status,
  200,
);
assert.equal(
  (await get()).data.privateStays[0].private_place,
  "Privat bei Freunden",
);
user = rideSecond;
lodgingData = (await get()).data;
assert.deepEqual(lodgingData.privateStays, [
  { member_id: "pkc-37", private_place: "Privat bei Freunden" },
]);
assert.ok(!lodgingData.plans.some((p) => p.member_id === "pkc-37"));
assert.equal(
  (
    await post({
      action: "room",
      ...lodgingRoom,
      memberIds: ["pkc-7", "pkc-37"],
    })
  ).status,
  400,
);
user = {
  userId: "unlinked-stay",
  email: "unlinked@test.invalid",
  displayName: "Unlinked",
};
assert.equal((await get()).data.privateStays, undefined);
// Database-level guards cover racing requests and alternate writers as well.
assert.throws(
  () =>
    sql
      .prepare(
        "INSERT INTO rooms(id,owner,hotel,arrival,departure,member_ids,updated) VALUES('duplicate','x','x','2030-01-01','2030-01-02','[\"pkc-6\"]','now')",
      )
      .run(),
  /nur eine Unterkunft/,
);
assert.throws(
  () =>
    sql
      .prepare(
        "INSERT INTO rooms(id,owner,hotel,arrival,departure,member_ids,updated) VALUES('private-conflict','x','x','2030-01-01','2030-01-02','[\"pkc-37\"]','now')",
      )
      .run(),
  /schließen sich aus/,
);
assert.throws(
  () =>
    sql
      .prepare(
        "INSERT INTO plans(member_id,status,mode,bus,updated) VALUES('pkc-6','Privat organisiert','Bahn','Nein','now')",
      )
      .run(),
  /schließen sich aus/,
);
user = {
  userId: "owner-test",
  email: "daniel95schaefer@gmail.com",
  displayName: "Daniel",
};
assert.equal(
  (await post({ ...lodgingPlan, status: "Keine Unterkunft nötig" })).status,
  200,
);
assert.equal((await get()).data.privateStays.length, 0);
assert.equal(
  sql.prepare("SELECT private_place FROM plans WHERE member_id='pkc-37'").get()
    .private_place,
  "",
);
console.log(
  "PASS: one accommodation across all dates, optional private location, private/hotel switches, roommate preservation, scoped visibility, legacy saves, notifications, atomic rollback and database race guards.",
);
