import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import seed from "../../seed.json";
import cmsDefaults from "../../cms-defaults.json";
export const dynamic = "force-dynamic";
// Temporary Sites adapter: use the app's identity, members, and roles when integrating with PKC.
const OWNER_EMAIL = "daniel95schaefer@gmail.com";
const roster = [
  "Andra",
  "Anna",
  "Elli",
  "Isi",
  "Jana",
  "Josi",
  "Jules",
  "Laura",
  "Lynn",
  "Marry",
  "Nath",
  "Noa",
  "Nola",
  "Näncen alder",
  "Paula",
  "Pauli",
  "Schlotti",
  "Sina",
  "Wiebke",
  "Betty Beat",
  "Diana",
  "Börni",
  "David",
  "Enno",
  "Frami",
  "Jan",
  "Joshi",
  "Kai",
  "Kaiko",
  "Martin",
  "Matze",
  "Steffen",
  "Sven",
  "Toffee",
  "Ulf",
  "Davy",
  "Mäc",
  "Schäferscooter",
  "Steven",
  "Angie",
  "Anja",
  "Anne",
  "Bianka",
  "Ella",
  "Gitta",
  "Heide",
  "Kathy",
  "Kati",
  "Marleen",
  "Mona",
  "Nastja",
  "Ricarda",
  "Rudi",
  "Sana",
  "Tina",
  "Jo",
  "Rico",
  "Mattes",
  "Kalle",
  "Nole",
  "Fabian",
  "Schneider",
  "Caroline",
  "Schnieen",
];
function reply(data: any, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", Vary: "Cookie" },
  });
}
function text(v: any, max = 1000) {
  if (typeof v !== "string" || v.length > max) throw Error("Ungültiger Text");
  return v.trim();
}
function choice(v: any, opts: string[]) {
  if (!opts.includes(v)) throw Error("Ungültige Auswahl");
  return v;
}
function number(v: any) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 99)
    throw Error("Ungültige Platzzahl");
  return n;
}
function date(v: any) {
  if (
    typeof v !== "string" ||
    !/^20\d{2}-\d{2}-\d{2}$/.test(v) ||
    Number.isNaN(Date.parse(v))
  )
    throw Error("Ungültiges Datum");
  return v;
}
// Deliberately retain historical content imports that are safe to run repeatedly.
// Their markers prevent edited content from being reset on every startup.
async function init(db: any) {
  await db.batch(
    roster.map((name, i) =>
      db
        .prepare("INSERT OR IGNORE INTO members(id,name,role) VALUES(?,?,?)")
        .bind("pkc-" + i, name, "member"),
    ),
  );
  await db.batch(
    seed.pages.map((p) =>
      db
        .prepare(
          "INSERT OR IGNORE INTO wiki(id,title,body,updated,history) VALUES(?,?,?,?,?)",
        )
        .bind(p.id, p.title, p.body, p.updated, "[]"),
    ),
  );
  await db
    .prepare(
      "UPDATE wiki SET body=? WHERE id='faq' AND body LIKE '%gemeinsame Koordination ist noch offen%'",
    )
    .bind(
      "## Muss ich selbst buchen?\nJa. Jede Person bucht ihre Unterkunft selbst. Diese Seite hilft euch zu sehen, wer wo wohnt und wo freiwillig ein Platz angeboten wird.\n## Ist der Bus schon gebucht?\nNein. Wir sammeln unverbindliches Interesse.\n## Wo sage ich zu?\nIm [Festivaltermin der PKC-App](https://pkcapp.potsdamerkneipenchor.de/events?_id=452).\n## Wer sieht meine Eingaben?\nDeine vollständige Planung sehen nur du und Mitglieder mit Orga-Rolle. Angemeldete, zugeordnete Chormitglieder sehen Unterkunft, Zimmergemeinschaft, Zeitraum und angebotene Plätze. Zimmernummern sind nur für die jeweilige Zimmergemeinschaft und die Orga sichtbar.\n## Wer kann meine Zimmernummer ergänzen?\nDu, deine Zimmergemeinschaft und die Orga. Die Angabe ist freiwillig und kann nach dem Check-in ergänzt werden.\n## Wie funktionieren Zimmerpartner?\nWähle Mitglieder aus der Liste. Sie erhalten eine Benachrichtigung auf dieser Seite; eine Bestätigung ist nicht nötig.",
    )
    .run();
  await db
    .prepare("UPDATE wiki SET body=replace(body,?,?) WHERE id='unterkunft'")
    .bind(
      "Bisher ist vorgesehen, dass jede Person selbst bucht. Eine gemeinsame Unterkunft für den PKC ist noch nicht vereinbart.",
      "Jede Person bucht selbst. Wir koordinieren keine Buchungen. Über „Wer wohnt wo?“ könnt ihr Anschluss finden und freiwillig freie Zimmerplätze anbieten.",
    )
    .run();
  await applyHotelContent(db);
  await applyFestivalNews(db);
  await splitFestivalNews(db);
  await cmsInit(db);
}
async function applyHotelContent(db: any) {
  const key = "hotel-cards-20261013";
  if (await db.prepare("SELECT id FROM updates WHERE id=?").bind(key).first())
    return;
  const now = new Date().toISOString();
  const statements = [];
  for (const p of seed.pages.filter((p) =>
    ["unterkunft", "kosten"].includes(p.id),
  )) {
    const old: any = await db
      .prepare("SELECT * FROM wiki WHERE id=?")
      .bind(p.id)
      .first();
    if (!old) continue;
    const history = [
      { date: now, title: old.title, body: old.body },
      ...JSON.parse(old.history),
    ];
    statements.push(
      db
        .prepare(
          "UPDATE wiki SET body=?,updated=?,history=? WHERE id=? AND NOT EXISTS(SELECT 1 FROM updates WHERE id=?)",
        )
        .bind(p.body, now, JSON.stringify(history), p.id, key),
    );
  }
  statements.push(
    db
      .prepare(
        "INSERT OR IGNORE INTO updates(id,body,created,buttons) VALUES(?,?,?,?)",
      )
      .bind(
        key,
        "Die Unterkunftsangebote stehen jetzt in kompakten Karten mit Buchungslinks, Original-PDFs und aufklappbaren Bedingungen. Den Buchungsweg fürs IBIS-Formular bitte direkt mit dem Hotel klären.",
        now,
        '[{"label": "Unterkunft & Buchung", "url": "#wiki/unterkunft"}]',
      ),
  );
  await db.batch(statements);
}

async function applyFestivalNews(db: any) {
  const original =
    "Die Unterkunftsangebote stehen jetzt in kompakten Karten mit Buchungslinks, Original-PDFs und aufklappbaren Bedingungen. Der IBIS-Buchungsweg ist ausdrücklich erläutert.";
  const corrected =
    "Die Unterkunftsangebote stehen jetzt in kompakten Karten mit Buchungslinks, Original-PDFs und aufklappbaren Bedingungen. Den Buchungsweg fürs IBIS-Formular bitte direkt mit dem Hotel klären.";
  await db
    .prepare("UPDATE updates SET body=? WHERE id=? AND body=?")
    .bind(corrected, "hotel-cards-20261013", original)
    .run();
  await db
    .prepare(
      "INSERT OR IGNORE INTO updates(id,body,created,buttons) VALUES(?,?,?,?)",
    )
    .bind(
      "bus-hostel-fristen-20261014",
      "Wir möchten eine gemeinsame Busfahrt organisieren. Bitte gib bis zum 01.11.2026 unter „Meine Planung“ an, ob du Interesse hast – unverbindlich.\n\nBeim Babelfish Hostel läuft die Buchungsfrist für das Festival-Kontingent schon am 31.10.2026 ab. Angebote und Buchungsinfos findest du unter „Unterkunft & Buchung“.",
      new Date().toISOString(),
      '[{"label": "Businteresse angeben", "url": "#plan"}]',
    )
    .run();
}

async function splitFestivalNews(db: any) {
  if (
    await db
      .prepare("SELECT id FROM updates WHERE id=?")
      .bind("babelfish-frist-20261014")
      .first()
  )
    return;
  const combined: any = await db
    .prepare("SELECT * FROM updates WHERE id=?")
    .bind("bus-hostel-fristen-20261014")
    .first();
  const created = combined?.created || new Date().toISOString();
  await db.batch([
    db
      .prepare("UPDATE updates SET body=? WHERE id=?")
      .bind(
        "Wir möchten eine gemeinsame Busfahrt organisieren. Bitte gib bis zum 01.11.2026 unter „Meine Planung“ an, ob du Interesse hast – unverbindlich.",
        "bus-hostel-fristen-20261014",
      ),
    db
      .prepare(
        "INSERT OR IGNORE INTO updates(id,body,created,buttons) VALUES(?,?,?,?)",
      )
      .bind(
        "babelfish-frist-20261014",
        "Beim Babelfish Hostel läuft die Buchungsfrist für das Festival-Kontingent schon am 31.10.2026 ab. Angebote und Buchungsinfos findest du unter „Unterkunft & Buchung“.",
        new Date(Date.parse(created) - 1).toISOString(),
        '[{"label": "Unterkunft & Buchung", "url": "#wiki/unterkunft"}]',
      ),
    db
      .prepare("UPDATE updates SET body=? WHERE id=?")
      .bind(
        "Die Unterkunftsangebote stehen jetzt in kompakten Karten mit Buchungslinks, Original-PDFs und aufklappbaren Bedingungen.",
        "hotel-cards-20261013",
      ),
    db
      .prepare(
        "INSERT OR IGNORE INTO updates(id,body,created,buttons) VALUES(?,?,?,?)",
      )
      .bind(
        "ibis-buchungsweg-20261014",
        "Den Buchungsweg fürs IBIS-Formular bitte direkt mit dem Hotel klären.",
        new Date(Date.parse(created) - 2).toISOString(),
        '[{"label": "Unterkunft & Buchung", "url": "#wiki/unterkunft"}]',
      ),
  ]);
}

// Return prepared statements: the caller saves the notification and post together via db.batch.
// No email is sent here; the PKC mail service must later be tied to explicit notification approval.
async function newsNotifications(
  db: any,
  id: string,
  title: string,
  body: string,
  now: string,
) {
  const recipients = (await db.prepare("SELECT id FROM members").all()).results;
  const preview = title || body.slice(0, 120) + (body.length > 120 ? "…" : "");
  return [
    db.prepare("UPDATE updates SET notified_at=? WHERE id=?").bind(now, id),
    ...recipients.map((recipient: any) =>
      db
        .prepare(
          "INSERT INTO notifications(id,member_id,message,created,seen) VALUES(?,?,?,?,0)",
        )
        .bind(
          crypto.randomUUID(),
          recipient.id,
          "Neue Neuigkeit: " + preview,
          now,
        ),
    ),
  ];
}

// Central server-side identity and role checks for GET and POST.
async function context() {
  const user = await getChatGPTUser();
  if (!user) return { error: reply({ error: "Bitte anmelden" }, 401) };
  const db = env.DB;
  if (!db) return { error: reply({ error: "Datenbank nicht verfügbar" }, 503) };
  await init(db);
  await db
    .prepare(
      "INSERT INTO accounts(id,name,email) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,email=excluded.email",
    )
    .bind(user.userId, user.displayName, user.email)
    .run();
  const owner = user.email.toLowerCase() === OWNER_EMAIL;
  if (owner)
    await db
      .prepare(
        "UPDATE members SET user_id=?,role='orga' WHERE id='pkc-37' AND (user_id IS NULL OR user_id=?)",
      )
      .bind(user.userId, user.userId)
      .run();
  const member: any = await db
    .prepare("SELECT * FROM members WHERE user_id=?")
    .bind(user.userId)
    .first();
  return { user, db, member, orga: owner || member?.role === "orga", owner };
}
export async function GET(request?: Request) {
  try {
    const c = await context();
    if (c.error) return c.error;
    const { db, user, member } = c;
    const canPreview = !!c.orga;
    const preview =
      canPreview &&
      request !== undefined &&
      new URL(request.url).searchParams.get("preview") === "member";
    // Preview mode restricts returned data, not just visible buttons.
    const orga = canPreview && !preview;
    if (!db || !user) return reply({ error: "Nicht verfügbar" }, 503);
    if (request && new URL(request.url).searchParams.has("file")) {
      if (!member && !orga)
        return reply({ error: "Mitgliedszuordnung erforderlich" }, 403);
      return await cmsFile(
        db,
        (env as any).BUCKET,
        new URL(request.url).searchParams.get("file")!,
        orga,
        new URL(request.url).origin,
      );
    }
    const cms = await cmsRead(db, orga);
    const allPages = (
      await db.prepare("SELECT * FROM wiki ORDER BY position,id").all()
    ).results.map((p: any) => ({ ...p, history: JSON.parse(p.history) }));
    const pages = allPages.filter((p: any) => !p.archived);
    const archivedPages = orga
      ? allPages.filter((p: any) => p.archived)
      : undefined;
    const updates = (
      await db
        .prepare("SELECT * FROM updates WHERE archived=0 ORDER BY created DESC")
        .all()
    ).results;
    const rawNotifications = member
      ? (
          await db
            .prepare(
              "SELECT * FROM notifications WHERE member_id=? ORDER BY created DESC",
            )
            .bind(member.id)
            .all()
        ).results
      : [];
    const notifications = preview
      ? rawNotifications.filter(
          (n: any) => !n.message.includes("Frage zum Festival"),
        )
      : rawNotifications;
    if (!member && !orga)
      return reply({
        ...cms,
        me: {
          name: user.displayName,
          linked: false,
          orga: false,
          canPreview,
          preview,
        },
        pages,
        updates,
        members: [],
        rooms: [],
        plans: [],
        notifications: [],
      });
    const members = (
      await db.prepare("SELECT id,name FROM members ORDER BY name").all()
    ).results;
    const rawRooms = (
      await db.prepare("SELECT * FROM rooms ORDER BY hotel").all()
    ).results;
    const rooms = rawRooms.map((r: any) => {
      const ids = JSON.parse(r.member_ids);
      return {
        ...r,
        memberIds: ids,
        member_ids: undefined,
        owner: undefined,
        number: orga || ids.includes(member?.id) ? r.number : undefined,
        canEdit: orga || ids.includes(member?.id),
      };
    });
    const plans = orga
      ? (await db.prepare("SELECT * FROM plans").all()).results
      : member
        ? (
            await db
              .prepare("SELECT * FROM plans WHERE member_id=?")
              .bind(member.id)
              .all()
          ).results
        : [];
    // Add passengers only to the member's own plans or plans accessible to organizers.
    // Other members' bus budgets and accommodation status remain private.
    for (const plan of plans) {
      plan.car_passengers = (
        await db
          .prepare(
            "SELECT member_id FROM plans WHERE car_driver=? AND mode='Auto' AND car_role='Ich möchte mitfahren' ORDER BY member_id",
          )
          .bind(plan.member_id)
          .all()
      ).results.map((p: any) => p.member_id);
    }
    const accounts = orga
      ? (
          await db
            .prepare(
              "SELECT a.id,a.name,m.id AS member_id FROM accounts a LEFT JOIN members m ON m.user_id=a.id",
            )
            .all()
        ).results
      : undefined;
    const roles = orga
      ? (await db.prepare("SELECT id,role,user_id FROM members").all()).results
      : undefined;
    const questions = orga
      ? (
          await db
            .prepare("SELECT * FROM questions ORDER BY created DESC")
            .all()
        ).results
      : member
        ? (
            await db
              .prepare(
                "SELECT * FROM questions WHERE member_id=? ORDER BY created DESC",
              )
              .bind(member.id)
              .all()
          ).results
        : [];
    const archivedUpdates = orga
      ? (
          await db
            .prepare(
              "SELECT * FROM updates WHERE archived=1 ORDER BY created DESC",
            )
            .all()
        ).results
      : undefined;
    return reply({
      ...cms,
      archivedPages,
      archivedUpdates,
      questions,
      me: {
        id: member?.id,
        name: member?.name || user.displayName,
        linked: !!member,
        orga,
        owner: !!c.owner && !preview,
        canPreview,
        preview,
      },
      pages,
      updates,
      members,
      rooms,
      // Only voluntarily shared locations; no other members' travel details or budgets.
      privateStays: (
        await db
          .prepare(
            "SELECT member_id,private_place FROM plans WHERE status='Privat organisiert'",
          )
          .all()
      ).results,
      plans,
      notifications,
      accounts,
      roles,
    });
  } catch (e) {
    console.error("Festival GET failed", e);
    return reply({ error: "Daten konnten nicht geladen werden" }, 500);
  }
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin)
    return reply({ error: "Ungültiger Ursprung" }, 403);
  try {
    const c = await context();
    if (c.error) return c.error;
    const { db, member, orga, user } = c;
    if (!db || !user) return reply({ error: "Nicht verfügbar" }, 503);
    const now = new Date().toISOString();
    if (
      request.headers.get("content-type")?.startsWith("multipart/form-data")
    ) {
      if (!orga) return reply({ error: "Nur für die Orga" }, 403);
      if (Number(request.headers.get("content-length")) > 11 * 1024 * 1024)
        throw Error("Datei zu groß");
      return await cmsUpload(
        db,
        (env as any).BUCKET,
        await request.formData(),
        now,
      );
    }
    const b: any = await request.json();
    if (!member && !orga)
      return reply(
        {
          error:
            "Dein Konto muss von der Orga einem Chormitglied zugeordnet werden.",
        },
        403,
      );
    // Validate all planning and room details before saving and notifying roommates in one transaction.
    if (b.action === "planning") {
      if (!member) return reply({ error: "Mitglied fehlt" }, 403);
      const rooms = b.rooms ?? [];
      if (!Array.isArray(rooms) || rooms.length > 1)
        throw Error(
          "Pro Person ist nur eine Unterkunft möglich. Bitte den bestehenden Eintrag bearbeiten.",
        );
      if (rooms.some((r: any) => !r || typeof r !== "object"))
        throw Error("Ungültige Zimmerangaben");
      if (rooms.length && b.status !== "Gebucht")
        throw Error(
          "Zimmerangaben passen nur zum Status Gebucht. Bitte prüfe deine Unterkunftsauswahl.",
        );
      // Remove the member's previous room assignment before saving the plan and new details.
      // The entire batch, including notifications, runs in one transaction.
      const statements = await prepareLodgingDeparture(db, member, b, now);
      statements.push(...(await prepareTravelChanges(db, member, b, now)));
      for (const room of rooms) {
        const prepared = await prepareRoom(db, member, orga, room, now);
        if (prepared instanceof Response) return prepared;
        statements.push(...prepared.statements);
      }
      await db.batch(statements);
      return reply({ ok: true });
    }
    // Compatibility with older, separate travel and accommodation forms.
    // The current UI uses action=planning and the same preparePlan validator.
    if (b.action === "plan") {
      if (!member) return reply({ error: "Mitglied fehlt" }, 403);
      if (b.section === "lodging" || b.section === "travel") {
        const existing: any = await db
          .prepare("SELECT * FROM plans WHERE member_id=?")
          .bind(member.id)
          .first();
        const saved = {
          status: existing?.status || "Noch offen",
          private_place: existing?.private_place || "",
          mode: existing?.mode || "Noch offen",
          bus: existing?.bus || "Noch offen",
          budget: existing?.budget || "",
          car_role: existing?.car_role || "",
          car_seats: existing?.car_seats ?? null,
          car_capacity: existing?.car_capacity ?? null,
          car_driver: existing?.car_driver || "",
        };
        const keys =
          b.section === "lodging"
            ? ["status", "private_place"]
            : [
                "mode",
                "bus",
                "budget",
                "car_role",
                "car_seats",
                "car_capacity",
                "car_driver",
              ];
        for (const key of Object.keys(saved))
          if (!keys.includes(key)) b[key] = (saved as any)[key];
        for (const key of keys)
          if (b[key] === undefined) b[key] = (saved as any)[key];
      }
      const statements = await prepareLodgingDeparture(db, member, b, now);
      statements.push(...(await prepareTravelChanges(db, member, b, now)));
      await db.batch(statements);
      return reply({ ok: true });
    }
    if (b.action === "room") {
      if (!member && !orga) return reply({ error: "Kein Zugriff" }, 403);
      const prepared = await prepareRoom(db, member, orga, b, now);
      if (prepared instanceof Response) return prepared;
      await db.batch(prepared.statements);
      return reply({ ok: true, id: prepared.id });
    }
    if (b.action === "roomNumber") {
      const r: any = await db
        .prepare("SELECT * FROM rooms WHERE id=?")
        .bind(text(b.id))
        .first();
      if (!r) return reply({ error: "Zimmer nicht gefunden" }, 404);
      if (!orga && !JSON.parse(r.member_ids).includes(member?.id))
        return reply({ error: "Kein Zugriff" }, 403);
      await db
        .prepare("UPDATE rooms SET number=?,updated=? WHERE id=?")
        .bind(text(b.number || "", 30), now, r.id)
        .run();
      return reply({ ok: true });
    }
    if (b.action === "question") {
      if (!member) return reply({ error: "Mitglied fehlt" }, 403);
      const body = text(b.text, 3000);
      if (!body) throw Error("Bitte eine Frage eingeben");
      const recipients = (
        await db.prepare("SELECT id FROM members WHERE role='orga'").all()
      ).results;
      const statements = [
        db
          .prepare(
            "INSERT INTO questions(id,member_id,body,created) VALUES(?,?,?,?)",
          )
          .bind(crypto.randomUUID(), member.id, body, now),
      ];
      for (const recipient of recipients)
        statements.push(
          db
            .prepare(
              "INSERT INTO notifications(id,member_id,message,created,seen) VALUES(?,?,?,?,0)",
            )
            .bind(
              crypto.randomUUID(),
              recipient.id,
              `${member.name} hat eine Frage zum Festival geschickt. Du findest sie in der Orga-Übersicht und unter Fragen & Antworten.`,
              now,
            ),
        );
      await db.batch(statements);
      return reply({ ok: true });
    }

    if (b.action === "seen") {
      if (!member) return reply({ error: "Mitglied fehlt" }, 403);
      if (b.ids === undefined) {
        await db
          .prepare("UPDATE notifications SET seen=1 WHERE member_id=?")
          .bind(member.id)
          .run();
      } else {
        if (
          !Array.isArray(b.ids) ||
          b.ids.length > 100 ||
          b.ids.some(
            (id: any) =>
              typeof id !== "string" || !id.trim() || id.length > 100,
          )
        )
          throw Error("Ungültige Benachrichtigungen");
        const ids = [...new Set(b.ids)];
        if (ids.length)
          await db.batch(
            ids.map((id) =>
              db
                .prepare(
                  "UPDATE notifications SET seen=1 WHERE member_id=? AND id=?",
                )
                .bind(member.id, id),
            ),
          );
      }
      return reply({ ok: true });
    }
    if (!orga)
      return reply({ error: "Nur für Mitglieder mit Orga-Rolle" }, 403);
    const cmsResult = await cmsPost(db, b, now);
    if (cmsResult) return cmsResult;
    if (b.action === "archiveUpdate" || b.action === "restoreUpdate") {
      const id = text(b.id, 100);
      if (
        !(await db
          .prepare("SELECT id FROM updates WHERE id=?")
          .bind(id)
          .first())
      )
        return reply({ error: "Neuigkeit nicht gefunden" }, 404);
      await db
        .prepare("UPDATE updates SET archived=? WHERE id=?")
        .bind(b.action === "archiveUpdate" ? 1 : 0, id)
        .run();
      return reply({ ok: true });
    }
    if (b.action === "wiki") {
      const id = text(b.id, 100);
      const old: any = await db
        .prepare("SELECT * FROM wiki WHERE id=?")
        .bind(id)
        .first();
      const history = old
        ? [
            { date: now, title: old.title, body: old.body },
            ...JSON.parse(old.history),
          ].slice(0, 100)
        : [];
      const title = text(b.title, 150),
        body = text(b.body, 30000),
        summary = text(b.summary ?? old?.summary ?? "", 300),
        position = number(b.position ?? old?.position ?? 0);
      if (!title) throw Error("Titel fehlt");
      await db
        .prepare(
          "INSERT INTO wiki(id,title,body,updated,history) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,body=excluded.body,updated=excluded.updated,history=excluded.history",
        )
        .bind(id, title, body, now, JSON.stringify(history))
        .run();
      await db
        .prepare("UPDATE wiki SET summary=?,position=? WHERE id=?")
        .bind(summary, position, id)
        .run();
      return reply({ ok: true });
    }
    if (b.action === "notifyUpdate") {
      const id = text(b.id, 100);
      const update: any = await db
        .prepare("SELECT * FROM updates WHERE id=?")
        .bind(id)
        .first();
      if (!update) return reply({ error: "Neuigkeit nicht gefunden" }, 404);
      if (update.archived)
        return reply(
          { error: "Entfernte Neuigkeiten können nicht angekündigt werden" },
          400,
        );
      await db.batch(
        await newsNotifications(db, id, update.title, update.body, now),
      );
      return reply({ ok: true });
    }
    if (b.action === "update") {
      const title = text(b.title || "", 120);
      const body = text(b.text, 3000);
      if (!body) throw Error("Bitte einen Text eingeben");
      const raw = b.buttons ?? [];
      if (!Array.isArray(raw) || raw.length > 8)
        throw Error("Maximal 8 Buttons pro Neuigkeit");
      const buttons = [];
      for (const item of raw) {
        if (!item || typeof item !== "object") throw Error("Ungültiger Button");
        const label = text(item.label, 80),
          url = text(item.url, 2000);
        if (!label || !url) throw Error("Beschriftung und Linkziel fehlen");
        if (url.startsWith("#")) {
          if (
            ![
              "#plan",
              "#rooms",
              "#travel",
              "#notifications",
              "#festival",
              "#together",
              "#wiki/start",
            ].includes(url)
          ) {
            if (
              !url.startsWith("#wiki/") ||
              !(await db
                .prepare("SELECT id FROM wiki WHERE id=?")
                .bind(url.slice(6))
                .first())
            )
              throw Error("Unbekannte Seite");
          }
        } else {
          let target;
          try {
            target = new URL(url);
          } catch {
            throw Error("Bitte einen vollständigen Link mit https:// eingeben");
          }
          if (
            !["https:", "http:"].includes(target.protocol) ||
            !target.hostname ||
            target.username ||
            target.password
          )
            throw Error(
              "Nur http:// oder https:// Links ohne Zugangsdaten sind erlaubt",
            );
        }
        buttons.push({ label, url });
      }
      const id = b.id ? text(b.id, 100) : crypto.randomUUID();
      const old: any = b.id
        ? await db.prepare("SELECT * FROM updates WHERE id=?").bind(id).first()
        : null;
      if (b.id && !old)
        return reply({ error: "Neuigkeit nicht gefunden" }, 404);
      if (b.notify === true && old?.archived)
        return reply(
          { error: "Entfernte Neuigkeiten können nicht angekündigt werden" },
          400,
        );
      const statements = [
        old
          ? db
              .prepare("UPDATE updates SET body=?,buttons=?,title=? WHERE id=?")
              .bind(body, JSON.stringify(buttons), title, id)
          : db
              .prepare(
                "INSERT INTO updates(id,body,created,buttons,title) VALUES(?,?,?,?,?)",
              )
              .bind(id, body, now, JSON.stringify(buttons), title),
      ];
      if (b.notify === true)
        statements.push(...(await newsNotifications(db, id, title, body, now)));
      await db.batch(statements);
      return reply({ ok: true });
    }
    if (b.action === "link") {
      if (!c.owner)
        return reply(
          { error: "Nur der Betreiber kann Konten und Rollen zuordnen" },
          403,
        );
      const id = text(b.memberId, 100),
        account = text(b.accountId, 200);
      const a = await db
        .prepare("SELECT id FROM accounts WHERE id=?")
        .bind(account)
        .first();
      const target = await db
        .prepare("SELECT id FROM members WHERE id=?")
        .bind(id)
        .first();
      if (!a || !target) throw Error("Unbekannte Zuordnung");
      if (account === user.userId && id !== member?.id)
        throw Error("Eigene Betreiberzuordnung bleibt erhalten");
      await db.batch([
        db
          .prepare("UPDATE members SET user_id=NULL WHERE user_id=?")
          .bind(account),
        db.prepare("UPDATE members SET user_id=? WHERE id=?").bind(account, id),
      ]);
      return reply({ ok: true });
    }
    if (b.action === "role") {
      if (!c.owner)
        return reply({ error: "Nur der Betreiber darf Rollen vergeben" }, 403);
      if (b.memberId === member?.id)
        return reply({ error: "Eigene Betreiberrolle bleibt erhalten" }, 400);
      await db
        .prepare("UPDATE members SET role=? WHERE id=?")
        .bind(choice(b.role, ["member", "orga"]), text(b.memberId, 100))
        .run();
      return reply({ ok: true });
    }
    return reply({ error: "Unbekannte Aktion" }, 400);
  } catch (e: any) {
    return reply({ error: e.message || "Speichern fehlgeschlagen" }, 400);
  }
}

// Import defaults only once; subsequent organizer changes in D1 remain authoritative.
async function cmsInit(db: any) {
  if (
    await db.prepare("SELECT id FROM content_settings WHERE id='main'").first()
  )
    return;
  const now = new Date().toISOString();
  const stmts = [
    db
      .prepare(
        "INSERT OR IGNORE INTO content_settings(id,data,history,updated) VALUES(?,?,?,?)",
      )
      .bind("main", JSON.stringify(cmsDefaults.settings), "[]", now),
  ];
  for (const h of cmsDefaults.hotels)
    stmts.push(
      db
        .prepare(
          "INSERT OR IGNORE INTO hotel_offers(id,data,position,updated) VALUES(?,?,?,?)",
        )
        .bind(h.id, JSON.stringify(h), h.position, now),
    );
  for (const d of cmsDefaults.documents)
    stmts.push(
      db
        .prepare(
          "INSERT OR IGNORE INTO documents(id,label,name,legacy_path,updated) VALUES(?,?,?,?,?)",
        )
        .bind(d.id, d.label, d.name, d.legacyPath, now),
    );
  for (const [i, p] of seed.pages.entries())
    stmts.push(
      db
        .prepare("UPDATE wiki SET summary=?,position=? WHERE id=?")
        .bind((cmsDefaults.summaries as any)[p.id] || "", i, p.id),
    );
  const costs = seed.pages.find((p) => p.id === "kosten");
  if (costs) {
    const section = costs.body.match(
      /## Buchungsfristen in zeitlicher Reihenfolge\n[\s\S]*?(?=\n## )/,
    )?.[0];
    if (section)
      stmts.push(
        db
          .prepare("UPDATE wiki SET body=replace(body,?,?) WHERE id='kosten'")
          .bind(
            section,
            "## Buchungsfristen in zeitlicher Reihenfolge\n[[BUCHUNGSFRISTEN]]",
          ),
      );
  }
  await db.batch(stmts);
}
async function cmsRead(db: any, orga: boolean) {
  const config: any = await db
    .prepare("SELECT * FROM content_settings WHERE id='main'")
    .first();
  const hotels = (
    await db.prepare("SELECT * FROM hotel_offers ORDER BY position,id").all()
  ).results;
  const docs = (
    await db.prepare("SELECT * FROM documents ORDER BY label").all()
  ).results;
  return {
    settings: JSON.parse(config.data),
    settingsHistory: orga ? JSON.parse(config.history) : undefined,
    hotels: hotels
      .filter((h: any) => orga || !h.archived)
      .map((h: any) => ({
        ...JSON.parse(h.data),
        id: h.id,
        archived: !!h.archived,
        position: h.position,
      })),
    documents: docs
      .filter((d: any) => orga || !d.archived)
      .map((d: any) => ({
        id: d.id,
        label: d.label,
        name: d.name,
        mime: d.mime,
        size: d.size,
        archived: !!d.archived,
        url: "/api/data?file=" + encodeURIComponent(d.id),
        legacyPath: d.legacy_path,
        updated: d.updated,
        history: orga
          ? JSON.parse(d.history).map((x: any, i: number) => ({
              index: i,
              label: x.label,
              name: x.name,
              date: x.updated,
            }))
          : undefined,
      })),
  };
}
function cmsLink(value: any, empty = true) {
  const url = text(value || "", 2000);
  if (!url && empty) return "";
  if (
    /^#(?:plan|rooms|travel|notifications|festival|together|admin|manage|wiki\/[a-zA-Z0-9_-]+)$/.test(
      url,
    ) ||
    /^\/api\/data\?file=[a-zA-Z0-9_-]+$/.test(url) ||
    /^\/documents\/[a-zA-Z0-9_.-]+$/.test(url)
  )
    return url;
  let u;
  try {
    u = new URL(url);
  } catch {
    throw Error("Ungültiger Link: " + url);
  }
  if (
    !["https:", "http:", "mailto:", "tel:"].includes(u.protocol) ||
    u.username ||
    u.password
  )
    throw Error("Ungültiger Link");
  return url;
}
function cmsDate(v: any) {
  const s = text(v || "", 10);
  if (!s) return "";
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(s) ||
    Number.isNaN(Date.parse(s)) ||
    new Date(s).toISOString().slice(0, 10) !== s
  )
    throw Error("Ungültiges Datum");
  return s;
}
async function cmsPost(db: any, b: any, now: string) {
  if (b.action === "cmsSettings") {
    const old: any = await db
      .prepare("SELECT * FROM content_settings WHERE id='main'")
      .first();
    const input = b.settings;
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw Error("Einstellungen fehlen");
    const settings: any = {};
    for (const key of Object.keys(cmsDefaults.settings)) {
      settings[key] = text(input[key] ?? JSON.parse(old.data)[key] ?? "", 3000);
      if (/Url$/.test(key)) settings[key] = cmsLink(settings[key]);
      if (["busDeadline", "eventStart", "eventEnd"].includes(key))
        settings[key] = cmsDate(settings[key]);
    }
    if (
      !settings.eventStart ||
      !settings.eventEnd ||
      settings.eventEnd < settings.eventStart
    )
      throw Error("Festivalzeitraum prüfen");
    if (settings.whatsappNumber && !/^\d{6,18}$/.test(settings.whatsappNumber))
      throw Error("WhatsApp-Nummer mit Ländervorwahl, nur Ziffern");
    const history = [
      { data: JSON.parse(old.data), date: old.updated },
      ...JSON.parse(old.history),
    ].slice(0, 30);
    await db
      .prepare(
        "UPDATE content_settings SET data=?,history=?,updated=? WHERE id='main'",
      )
      .bind(JSON.stringify(settings), JSON.stringify(history), now)
      .run();
    return reply({ ok: true });
  }
  if (b.action === "cmsHotel") {
    const id = b.id ? text(b.id, 100) : crypto.randomUUID();
    const old: any = b.id
      ? await db
          .prepare("SELECT * FROM hotel_offers WHERE id=?")
          .bind(id)
          .first()
      : null;
    if (b.id && !old) return reply({ error: "Unterkunft nicht gefunden" }, 404);
    const input = b.hotel;
    if (!input || typeof input !== "object") throw Error("Unterkunft fehlt");
    const h: any = {};
    for (const k of [
      "name",
      "price",
      "breakfast",
      "booking",
      "note",
      "warning",
      "sourceNote",
      "documentId",
    ])
      h[k] = text(input[k] || "", k === "note" ? 6000 : 2000);
    if (!h.name || !h.price) throw Error("Name und Preisangabe fehlen");
    const otherHotels = (
      await db.prepare("SELECT id,data FROM hotel_offers").all()
    ).results;
    if (
      otherHotels.some(
        (x: any) =>
          x.id !== id &&
          JSON.parse(x.data).name.toLocaleLowerCase() ===
            h.name.toLocaleLowerCase(),
      )
    )
      throw Error("Eine Unterkunft mit diesem Namen existiert bereits");
    h.deadline = cmsDate(input.deadline);
    h.position = number(input.position || 0);
    if (
      h.documentId &&
      !(await db
        .prepare("SELECT id FROM documents WHERE id=?")
        .bind(h.documentId)
        .first())
    )
      throw Error("Dokument nicht gefunden");
    if (!Array.isArray(input.links) || input.links.length > 8)
      throw Error("Maximal 8 Buchungslinks");
    h.links = input.links.map((l: any) => {
      const label = text(l.label, 100),
        url = cmsLink(l.url, false);
      if (!label || !url) throw Error("Linkbeschriftung und Ziel fehlen");
      return { label, url };
    });
    if (!Array.isArray(input.sections) || input.sections.length > 30)
      throw Error("Maximal 30 Detailabschnitte");
    h.sections = input.sections.map((x: any) => {
      if (!Array.isArray(x.items) || x.items.length > 50)
        throw Error("Zu viele Details");
      return {
        title: text(x.title, 200),
        items: x.items.map((y: any) => text(y, 2000)),
      };
    });
    const stmts = [
      db
        .prepare(
          "INSERT INTO hotel_offers(id,data,position,archived,updated) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,position=excluded.position,updated=excluded.updated",
        )
        .bind(id, JSON.stringify(h), h.position, old?.archived || 0, now),
    ];
    if (old) {
      const before = JSON.parse(old.data);
      if (before.name !== h.name)
        stmts.push(
          db
            .prepare("UPDATE rooms SET hotel=? WHERE hotel=?")
            .bind(h.name, before.name),
        );
    }
    await db.batch(stmts);
    return reply({ ok: true, id });
  }
  if (b.action === "cmsHotelArchive") {
    const id = text(b.id, 100);
    if (
      !(await db
        .prepare("SELECT id FROM hotel_offers WHERE id=?")
        .bind(id)
        .first())
    )
      return reply({ error: "Unterkunft nicht gefunden" }, 404);
    await db
      .prepare("UPDATE hotel_offers SET archived=? WHERE id=?")
      .bind(b.archived === false ? 0 : 1, id)
      .run();
    return reply({ ok: true });
  }
  if (b.action === "cmsPageArchive") {
    const id = text(b.id, 100);
    if (id === "start")
      throw Error("Die Übersicht bleibt als Einstieg erhalten");
    if (!(await db.prepare("SELECT id FROM wiki WHERE id=?").bind(id).first()))
      return reply({ error: "Seite nicht gefunden" }, 404);
    await db
      .prepare("UPDATE wiki SET archived=? WHERE id=?")
      .bind(b.archived === false ? 0 : 1, id)
      .run();
    return reply({ ok: true });
  }
  if (b.action === "cmsDocument") {
    const id = text(b.id, 100);
    const old: any = await db
      .prepare("SELECT * FROM documents WHERE id=?")
      .bind(id)
      .first();
    if (!old) return reply({ error: "Datei nicht gefunden" }, 404);
    if (b.restore !== undefined) {
      const previous = JSON.parse(old.history)[number(b.restore)];
      if (!previous) throw Error("Version nicht gefunden");
      const history = [
        { ...old, history: undefined },
        ...JSON.parse(old.history),
      ].slice(0, 30);
      await db
        .prepare(
          "UPDATE documents SET label=?,name=?,storage_key=?,legacy_path=?,mime=?,size=?,history=?,updated=? WHERE id=?",
        )
        .bind(
          previous.label,
          previous.name,
          previous.storage_key,
          previous.legacy_path,
          previous.mime,
          previous.size,
          JSON.stringify(history),
          now,
          id,
        )
        .run();
    } else
      await db
        .prepare("UPDATE documents SET label=?,archived=?,updated=? WHERE id=?")
        .bind(
          text(b.label ?? old.label, 200),
          b.archived === undefined ? old.archived : b.archived ? 1 : 0,
          now,
          id,
        )
        .run();
    return reply({ ok: true });
  }
  return null;
}
async function cmsUpload(db: any, bucket: any, form: FormData, now: string) {
  if (!bucket) return reply({ error: "Dateispeicher nicht verfügbar" }, 503);
  const f = form.get("file");
  if (!f || typeof f === "string") throw Error("Datei fehlt");
  if (f.size <= 0 || f.size > 10 * 1024 * 1024)
    throw Error("Dateigröße: maximal 10 MB");
  const bytes = new Uint8Array(await f.arrayBuffer());
  let mime = "";
  if (String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-")
    mime = "application/pdf";
  else if (
    bytes[0] === 137 &&
    bytes[1] === 80 &&
    bytes[2] === 78 &&
    bytes[3] === 71 &&
    bytes[4] === 13 &&
    bytes[5] === 10 &&
    bytes[6] === 26 &&
    bytes[7] === 10
  )
    mime = "image/png";
  else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    mime = "image/jpeg";
  else if (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    mime = "image/webp";
  if (!mime) throw Error("Erlaubt sind PDF, PNG, JPEG und WebP");
  const id = form.get("id") ? text(form.get("id"), 100) : crypto.randomUUID();
  const old: any = form.get("id")
    ? await db.prepare("SELECT * FROM documents WHERE id=?").bind(id).first()
    : null;
  if (form.get("id") && !old) throw Error("Datei nicht gefunden");
  const name = text(f.name, 200),
    label = text(form.get("label") || old?.label || f.name, 200);
  if (!label) throw Error("Beschriftung fehlt");
  const key = "documents/" + id + "/" + crypto.randomUUID();
  await bucket.put(key, bytes, { httpMetadata: { contentType: mime } });
  const history = old
    ? [{ ...old, history: undefined }, ...JSON.parse(old.history)].slice(0, 30)
    : [];
  try {
    await db
      .prepare(
        "INSERT INTO documents(id,label,name,storage_key,legacy_path,mime,size,history,updated) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET label=excluded.label,name=excluded.name,storage_key=excluded.storage_key,legacy_path=excluded.legacy_path,mime=excluded.mime,size=excluded.size,history=excluded.history,updated=excluded.updated",
      )
      .bind(
        id,
        label,
        name,
        key,
        null,
        mime,
        f.size,
        JSON.stringify(history),
        now,
      )
      .run();
  } catch (e) {
    await bucket.delete(key);
    throw e;
  }
  return reply({ ok: true, id, url: "/api/data?file=" + id });
}
async function cmsFile(
  db: any,
  bucket: any,
  id: string,
  orga: boolean,
  origin: string,
) {
  const doc: any = await db
    .prepare("SELECT * FROM documents WHERE id=?")
    .bind(id)
    .first();
  if (!doc || (doc.archived && !orga))
    return reply({ error: "Datei nicht verfügbar" }, 404);
  if (doc.storage_key) {
    const object = await bucket?.get(doc.storage_key);
    if (!object) return reply({ error: "Datei nicht verfügbar" }, 404);
    const safeName = doc.name.replace(/[\r\n"\\]/g, "_");
    return new Response(object.body, {
      headers: {
        "Content-Type": doc.mime,
        "Content-Disposition":
          'attachment; filename="' +
          safeName.replace(/[^\x20-\x7E]/g, "_") +
          "\"; filename*=UTF-8''" +
          encodeURIComponent(doc.name),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox; default-src 'none'",
      },
    });
  }
  if (doc.legacy_path)
    return Response.redirect(new URL(doc.legacy_path, origin).href, 302);
  return reply({ error: "Datei nicht verfügbar" }, 404);
}

// car_driver is the sole stored record of carpool membership.
// Changes and notifications are written together with the member's plan via db.batch.
async function prepareTravelChanges(
  db: any,
  member: any,
  input: any,
  now: string,
) {
  // 1. Read saved state and validate all inputs; do not write anything yet.
  const all: any[] = (await db.prepare("SELECT * FROM plans").all()).results;
  const old = all.find((p) => p.member_id === member.id);
  const driver = input.mode === "Auto" && input.car_role === "Ich fahre selbst";
  const b = { ...input };
  if (driver && b.car_capacity === undefined && old?.car_capacity != null)
    b.car_capacity = old.car_capacity;
  const self = await preparePlan(db, member, b, now);
  const current = all.filter(
    (p) =>
      p.car_driver === member.id &&
      p.mode === "Auto" &&
      p.car_role === "Ich möchte mitfahren",
  );
  // Do not silently overwrite newer changes with passenger lists from a stale form.
  if (b.car_passengers_before !== undefined) {
    let before;
    try {
      before =
        typeof b.car_passengers_before === "string"
          ? JSON.parse(b.car_passengers_before)
          : b.car_passengers_before;
    } catch {
      throw Error("Ungültiger Stand der Mitfahrerliste");
    }
    if (!Array.isArray(before) || before.some((id) => typeof id !== "string"))
      throw Error("Ungültiger Stand der Mitfahrerliste");
    if (
      JSON.stringify([...before].sort()) !==
      JSON.stringify(current.map((p) => p.member_id).sort())
    )
      throw Error(
        "Die Mitfahrerliste wurde inzwischen geändert. Bitte lade die Seite neu und prüfe deine Auswahl.",
      );
  }
  let ids: string[] = [];
  if (driver) {
    let values = b.car_passengers;
    if (typeof values === "string") {
      try {
        values = JSON.parse(values);
      } catch {
        throw Error("Ungültige Mitfahrerauswahl");
      }
    }
    if (values === undefined) values = current.map((p) => p.member_id);
    if (
      !Array.isArray(values) ||
      values.length > 99 ||
      values.some((id) => typeof id !== "string")
    )
      throw Error("Ungültige Mitfahrerauswahl");
    ids = [...new Set<string>(values)];
    if (ids.length !== values.length || ids.includes(member.id))
      throw Error("Bitte andere Personen jeweils nur einmal auswählen");
    const known = (
      await db.prepare("SELECT id FROM members").all()
    ).results.map((m: any) => m.id);
    if (ids.some((id) => !known.includes(id)))
      throw Error("Unbekannte mitfahrende Person");
    const capacity = b.car_capacity != null ? number(b.car_capacity) : null;
    if (capacity !== null && ids.length > capacity)
      throw Error("Mehr Mitfahrende als Mitfahrerplätze ausgewählt");
  }
  const newDriver =
    b.mode === "Auto" && b.car_role === "Ich möchte mitfahren"
      ? b.car_driver || ""
      : "";
  if (newDriver) {
    const target = all.find((p) => p.member_id === newDriver);
    if (target?.car_driver === member.id)
      throw Error("Ihr könnt nicht gegenseitig Fahrer und Mitfahrer sein");
    if (
      !target ||
      target.mode !== "Auto" ||
      target.car_role !== "Ich fahre selbst"
    )
      throw Error(
        "Diese Person hat noch nicht angegeben, selbst mit dem Auto zu fahren. Bitte zuerst ihre Planung aktualisieren.",
      );
    if (target.car_capacity == null)
      throw Error(
        "Die Gesamtzahl der Mitfahrerplätze ist bei dieser Person noch nicht bestätigt. Bitte zuerst ergänzen lassen.",
      );
    // The checks above have validated the driver and total passenger capacity.
    const occupied = all.filter(
      (p) => p.car_driver === newDriver && p.member_id !== member.id,
    ).length;
    if (occupied >= target.car_capacity)
      throw Error("Bei dieser Person ist kein Mitfahrerplatz mehr frei");
  }
  // 2. Collect statements only; the caller executes the full batch in one transaction.
  const statements: any[] = [];
  const notify = (id: string, message: string) =>
    statements.push(
      db
        .prepare(
          "INSERT INTO notifications(id,member_id,message,created,seen) VALUES(?,?,?,?,0)",
        )
        .bind(crypto.randomUUID(), id, message, now),
    );
  // Both ways of releasing an assignment use the same update and notification.
  const releasePassenger = (
    passengerId: string,
    driverId: string,
    message: string,
  ) => {
    statements.push(
      db
        .prepare(
          "UPDATE plans SET car_driver='',updated=? WHERE member_id=? AND car_driver=?",
        )
        .bind(now, passengerId, driverId),
    );
    notify(passengerId, message);
  };
  const affectedDrivers = new Set<string>(
    [member.id, old?.car_driver].filter(Boolean),
  );
  // An explicit new assignment replaces the old one. Selected members who were drivers
  // leave their own carpools; passengers not transferred with them are notified.
  for (const id of ids) {
    const previous = all.find((p) => p.member_id === id);
    if (previous?.car_driver && previous.car_driver !== member.id) {
      affectedDrivers.add(previous.car_driver);
      const passengerName =
        (
          await db
            .prepare("SELECT name FROM members WHERE id=?")
            .bind(id)
            .first()
        )?.name || "Eine Person";
      notify(
        previous.car_driver,
        `${passengerName} fährt jetzt bei ${member.name} mit. Deine Mitfahrerliste und freien Plätze wurden aktualisiert.`,
      );
    }
    if (previous?.mode === "Auto" && previous.car_role === "Ich fahre selbst") {
      affectedDrivers.add(id);
      for (const p of all.filter(
        (p) => p.car_driver === id && !ids.includes(p.member_id),
      )) {
        releasePassenger(
          p.member_id,
          id,
          "Deine bisherige Fahrperson wurde einer anderen Fahrgemeinschaft zugeordnet und fährt nicht mehr selbst. Deine Fahrerwahl ist wieder offen.",
        );
      }
    }
  }
  // Remove old assignments first so a reduced capacity is never temporarily exceeded.
  for (const p of current.filter((p) => !ids.includes(p.member_id))) {
    releasePassenger(
      p.member_id,
      member.id,
      `${member.name} hat deine Mitfahrt aufgehoben. In deiner Planung ist die Fahrerwahl wieder offen.`,
    );
  }
  // 3. Save the member's plan and new passengers; preserve other members' accommodation and budgets.
  statements.push(self);
  for (const id of ids.filter(
    (id) => !current.some((p) => p.member_id === id),
  )) {
    statements.push(
      db
        .prepare(
          "INSERT INTO plans(member_id,status,mode,bus,budget,updated,car_role,car_driver) VALUES(?,'Noch offen','Auto','Noch offen','',?,'Ich möchte mitfahren',?) ON CONFLICT(member_id) DO UPDATE SET mode='Auto',car_role='Ich möchte mitfahren',car_driver=excluded.car_driver,car_seats=NULL,car_capacity=NULL,updated=excluded.updated",
        )
        .bind(id, now, member.id),
    );
    notify(
      id,
      `${member.name} hat dich als Mitfahrer eingetragen. Deine bisherige Anreise wurde durch Auto und Mitfahrt bei ${member.name} ersetzt. Du kannst die Zuordnung in „Meine Planung“ ändern.`,
    );
  }
  if ((old?.car_driver || "") !== newDriver) {
    if (old?.car_driver)
      notify(
        old.car_driver,
        `${member.name} fährt nicht mehr bei dir mit. Deine freien Mitfahrerplätze wurden aktualisiert.`,
      );
    if (newDriver)
      notify(
        newDriver,
        `${member.name} hat eine Mitfahrt bei dir eingetragen. Deine Mitfahrerliste und freien Plätze wurden aktualisiert.`,
      );
  }
  // 4. Calculate remaining seats from final assignments instead of incrementing or decrementing counters.
  if (newDriver) affectedDrivers.add(newDriver);
  for (const id of affectedDrivers) {
    statements.push(
      db
        .prepare(
          "UPDATE plans SET car_seats=car_capacity-(SELECT COUNT(*) FROM plans passengers WHERE passengers.car_driver=plans.member_id AND passengers.mode='Auto' AND passengers.car_role='Ich möchte mitfahren') WHERE member_id=? AND mode='Auto' AND car_role='Ich fahre selbst' AND car_capacity IS NOT NULL",
        )
        .bind(id),
    );
  }
  return statements;
}

// Validators prepare statements without writing data, keeping multi-record changes transactional.
async function preparePlan(db: any, member: any, b: any, now: string) {
  const status = choice(b.status, [
    "Noch offen",
    "Suche Zimmergemeinschaft",
    "Gebucht",
    "Privat organisiert",
    "Keine Unterkunft nötig",
  ]);
  const privatePlace =
    status === "Privat organisiert" ? text(b.private_place || "", 200) : "";
  const mode = choice(b.mode, ["Noch offen", "Bus", "Bahn", "Auto", "Andere"]);
  const bus = choice(b.bus, [
    "Noch offen",
    "Ja",
    "Vielleicht, je nach Preis",
    "Nein",
  ]);
  const budget = text(b.budget || "", 6);
  if (budget && (!Number.isFinite(Number(budget)) || Number(budget) < 0))
    throw Error("Ungültiges Budget");
  const carRole =
    mode === "Auto"
      ? choice(b.car_role, ["Ich fahre selbst", "Ich möchte mitfahren"])
      : "";
  const hasCapacity = b.car_capacity !== undefined && b.car_capacity !== null;
  if (
    carRole === "Ich fahre selbst" &&
    String(hasCapacity ? b.car_capacity : (b.car_seats ?? "")).trim() === ""
  )
    throw Error("Bitte die gesamte Zahl der Mitfahrerplätze ohne dich angeben");
  // Legacy car_seats values represent available seats. Do not reinterpret them as total capacity.
  const carCapacity =
    carRole === "Ich fahre selbst" && hasCapacity
      ? number(b.car_capacity)
      : null;
  const carSeats =
    carRole === "Ich fahre selbst"
      ? (carCapacity ?? number(b.car_seats))
      : null;
  const carDriver =
    carRole === "Ich möchte mitfahren" ? text(b.car_driver || "", 100) : "";
  if (
    carDriver &&
    (carDriver === member.id ||
      !(await db
        .prepare("SELECT id FROM members WHERE id=?")
        .bind(carDriver)
        .first()))
  )
    throw Error("Bitte ein anderes Chormitglied auswählen");
  return db
    .prepare(
      "INSERT INTO plans(member_id,status,mode,bus,budget,updated,car_role,car_seats,car_driver,car_capacity,private_place) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(member_id) DO UPDATE SET private_place=excluded.private_place,status=excluded.status,mode=excluded.mode,bus=excluded.bus,budget=excluded.budget,updated=excluded.updated,car_role=excluded.car_role,car_seats=excluded.car_seats,car_driver=excluded.car_driver,car_capacity=excluded.car_capacity",
    )
    .bind(
      member.id,
      status,
      mode,
      bus,
      budget,
      now,
      carRole,
      carSeats,
      carDriver,
      carCapacity,
      privatePlace,
    );
}

/** For private accommodation or no overnight stay, remove only the member's own room assignment.
 * Preserve other occupants, booking details, and room numbers. Do not silently
 * clean up historical duplicates: only the member explicitly saving changes moves. */
async function prepareLodgingDeparture(
  db: any,
  member: any,
  b: any,
  now: string,
) {
  if (!["Privat organisiert", "Keine Unterkunft nötig"].includes(b.status))
    return [];
  const assigned = (await db.prepare("SELECT * FROM rooms").all()).results;
  const statements: any[] = [];
  for (const room of assigned.filter((r: any) =>
    JSON.parse(r.member_ids).includes(member.id),
  )) {
    const remaining = JSON.parse(room.member_ids).filter(
      (id: string) => id !== member.id,
    );
    statements.push(
      remaining.length
        ? db
            .prepare("UPDATE rooms SET member_ids=?,updated=? WHERE id=?")
            .bind(JSON.stringify(remaining), now, room.id)
        : db.prepare("DELETE FROM rooms WHERE id=?").bind(room.id),
    );
    for (const id of remaining)
      statements.push(
        db
          .prepare(
            "INSERT INTO notifications(id,member_id,message,created,seen) VALUES(?,?,?,?,0)",
          )
          .bind(
            crypto.randomUUID(),
            id,
            `${member.name} hat eine andere Unterkunftsplanung gespeichert und gehört nicht mehr zu eurer Zimmergemeinschaft in ${room.hotel}.`,
            now,
          ),
      );
  }
  return statements;
}

async function prepareRoom(
  db: any,
  member: any,
  orga: boolean,
  b: any,
  now: string,
): Promise<any> {
  const old: any = b.id
    ? await db
        .prepare("SELECT * FROM rooms WHERE id=?")
        .bind(text(b.id))
        .first()
    : null;
  if (b.id && !old) return reply({ error: "Zimmer nicht gefunden" }, 404);
  if (old && !orga && !JSON.parse(old.member_ids).includes(member?.id))
    return reply({ error: "Kein Zugriff auf dieses Zimmer" }, 403);
  const ids = [
    ...new Set(
      (Array.isArray(b.memberIds) ? b.memberIds : []).map((x: any) =>
        text(x, 100),
      ),
    ),
  ];
  if (!ids.length || (!orga && !ids.includes(member.id)))
    throw Error("Du musst Teil der Zimmergemeinschaft bleiben");
  const known = (await db.prepare("SELECT id FROM members").all()).results.map(
    (x: any) => x.id,
  );
  if (ids.some((x) => !known.includes(x))) throw Error("Unbekanntes Mitglied");
  const hotel = text(b.hotel, 200);
  if (!hotel) throw Error("Unterkunft fehlt");
  const arrival = date(b.arrival),
    departure = date(b.departure);
  if (departure <= arrival) throw Error("Abreise muss nach Anreise liegen");
  // One room assignment per festival, regardless of overlapping dates.
  // Roommates also cannot simultaneously have private accommodation or another room assignment.
  const assigned = (await db.prepare("SELECT id,member_ids FROM rooms").all())
    .results;
  if (
    assigned.some(
      (r: any) =>
        r.id !== old?.id &&
        JSON.parse(r.member_ids).some((id: string) => ids.includes(id)),
    )
  )
    throw Error(
      "Mindestens eine Person hat bereits eine Unterkunft. Bitte den bestehenden Eintrag bearbeiten.",
    );
  const privateStays = (
    await db
      .prepare("SELECT member_id FROM plans WHERE status='Privat organisiert'")
      .all()
  ).results;
  if (
    privateStays.some(
      (p: any) => ids.includes(p.member_id) && p.member_id !== member?.id,
    )
  )
    throw Error(
      "Mindestens eine Person hat ihre Unterkunft privat organisiert. Bitte zuerst deren Planung ändern.",
    );
  // When switching from private accommodation to a hotel, action=planning writes the new status first.
  if (
    privateStays.some((p: any) => ids.includes(p.member_id)) &&
    b.action === "room"
  )
    throw Error(
      "Bitte zuerst unter Meine Planung von Privat organisiert auf Gebucht wechseln.",
    );
  const id = old?.id || crypto.randomUUID();
  const statements = [
    db
      .prepare(
        "INSERT INTO rooms(id,owner,hotel,arrival,departure,number,spaces,member_ids,updated) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET hotel=excluded.hotel,arrival=excluded.arrival,departure=excluded.departure,number=excluded.number,spaces=excluded.spaces,member_ids=excluded.member_ids,updated=excluded.updated",
      )
      .bind(
        id,
        old?.owner || member.id,
        hotel,
        arrival,
        departure,
        text(b.number || "", 30),
        number(b.spaces || 0),
        JSON.stringify(ids),
        now,
      ),
  ];
  const before = old ? JSON.parse(old.member_ids) : [];
  const affected = [...new Set([...before, ...ids])].filter(
    (x) => x !== member?.id,
  );
  for (const x of affected) {
    const changed = before.includes(x) !== ids.includes(x);
    statements.push(
      db
        .prepare(
          "INSERT INTO notifications(id,member_id,message,created,seen) VALUES(?,?,?,?,0)",
        )
        .bind(
          crypto.randomUUID(),
          x,
          changed
            ? ids.includes(x)
              ? `${member?.name || "Die Orga"} hat dich einer Zimmergemeinschaft in ${hotel} zugeordnet.`
              : `Deine Zuordnung zur Zimmergemeinschaft in ${old.hotel} wurde geändert.`
            : `Die Angaben deiner Zimmergemeinschaft in ${hotel} wurden aktualisiert.`,
          now,
        ),
    );
  }
  return { id, statements };
}
