/* Loaded after shared definitions, before bootstrap.js.
 * Demo is deliberately read-only. A URL parameter never grants real permissions.
 * Backend mode uses the API contract in app/api/data/route.ts, not Martin's
 * different tripIndex JSON layout contract. An adapter is required on his server. */
var pagesConfig = window.PKC_FRONTEND_CONFIG || { mode: "demo" };
var pagesDemo = pagesConfig.mode === "demo";
var pagesBase = new URL("./", location.href);
var pagesFixture;

function pagesAPI() {
  if (pagesConfig.mode !== "backend") throw Error("Backend ist nicht eingerichtet.");
  const url = new URL(pagesConfig.apiPath, location.href);
  if (url.origin !== location.origin || url.search || url.hash)
    throw Error("Die API muss unter derselben Adresse ohne URL-Zugangsdaten liegen.");
  return url;
}

async function pagesResponse(response) {
  if (response.status === 401) throw Error("Bitte zuerst in der PKC-App anmelden.");
  if (response.status === 403) throw Error("Für diese Aktion fehlt die Berechtigung.");
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw Error("Die Festival-Schnittstelle liefert kein JSON. Bitte die Anbindung prüfen.");
  const data = await response.json();
  if (!response.ok) throw Error(data.error || "Die Anfrage konnte nicht gespeichert werden.");
  return data;
}

async function load() {
  let data;
  if (pagesDemo) {
    const orga = new URLSearchParams(location.search).get("ansicht") === "orga";
    if (!pagesFixture) {
      const response = await fetch(new URL(orga ? "demo-orga-data.json" : "demo-data.json", pagesBase));
      if (!response.ok) throw Error("Die Vorschau konnte nicht geladen werden.");
      pagesFixture = await response.json();
    }
    data = structuredClone(pagesFixture);
    if (!orga) memberPreview = false;
    if (orga && memberPreview) {
      data.me.orga = false;
      data.me.preview = true;
      data.plans = data.plans.filter(p => p.member_id === data.me.id);
      data.questions = data.questions.filter(q => q.member_id === data.me.id);
      data.rooms = data.rooms.map(r => ({ ...r, number: r.memberIds.includes(data.me.id) ? r.number : undefined, canEdit: r.memberIds.includes(data.me.id) }));
      data.settingsHistory = [];
      data.archivedPages = [];
      data.archivedUpdates = [];
    }
  } else {
    const url = pagesAPI();
    if (memberPreview) url.searchParams.set("preview", "member");
    data = await pagesResponse(await fetch(url, { credentials: "same-origin", cache: "no-store" }));
  }
  if (!data.me || !Array.isArray(data.pages) || !Array.isArray(data.members))
    throw Error("Die Festival-Schnittstelle hat ein unerwartetes Datenformat.");
  if (state?.me?.id !== data.me.id || state?.me?.preview !== data.me.preview) {
    planningDraft = null;
    planningDirty = false;
  }
  state = data;
  if (!state.me.canPreview) {
    memberPreview = false;
    sessionStorage.removeItem("pkc-member-preview");
  }
  applyContentSettings();
  render();
  document.querySelector(".notice").textContent = pagesDemo
    ? "Öffentliche Vorschau mit Beispieldaten · Speichern, Uploads und Nachrichten sind deaktiviert."
    : "";
}

async function post(data) {
  if (pagesDemo) throw Error("Vorschau: Angaben und Nachrichten werden nicht gespeichert oder verschickt.");
  if (state?.me.preview) throw Error("Mitgliedervorschau: Änderungen sind gesperrt.");
  return pagesResponse(await fetch(pagesAPI(), {
    method: "POST", credentials: "same-origin",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  }));
}

async function uploadDocument(form) {
  if (pagesDemo) throw Error("Vorschau: Dateien werden nicht hochgeladen.");
  if (state?.me.preview) throw Error("Mitgliedervorschau: Änderungen sind gesperrt.");
  return pagesResponse(await fetch(pagesAPI(), { method: "POST", credentials: "same-origin", body: form }));
}
