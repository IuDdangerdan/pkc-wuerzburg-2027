/* Shared state, DOM helpers, API calls, and page routing.
 * Classic defer scripts deliberately share this namespace; initialization starts in bootstrap.js. */
let memberPreview = sessionStorage.getItem("pkc-member-preview") === "1";

const $ = (s) => document.querySelector(s);

let state;

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

const fmt = (s) => (s ? new Date(s).toLocaleDateString("de-DE") : "–");

const name = (id) => state.members.find((m) => m.id === id)?.name || "Mitglied";

const mine = () => state.rooms.filter((r) => r.memberIds.includes(state.me.id));

function toast(t) {
  $("#toast").textContent = t;
  $("#toast").style.display = "block";
  setTimeout(() => ($("#toast").style.display = "none"), 4000);
}

async function load() {
  const r = await fetch(
    "/api/data" + (memberPreview ? "?preview=member" : ""),
    { cache: "no-store" },
  );
  const d = await r.json();
  if (!r.ok) throw Error(d.error);
  if (state?.me?.id !== d.me.id || state?.me?.preview !== d.me.preview) {
    planningDraft = null;
    planningDirty = false;
  }
  state = d;
  if (!state.me.canPreview) {
    memberPreview = false;
    sessionStorage.removeItem("pkc-member-preview");
  }
  applyContentSettings();
  render();
}

async function post(data) {
  if (state?.me.preview)
    throw Error(
      "Mitglieder-Vorschau: Änderungen werden nicht gespeichert. Wechsle zur Orga-Ansicht.",
    );
  const r = await fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const d = await r.json();
  if (!r.ok) throw Error(d.error);
  return d;
}

function title(k, t, desc = "") {
  return `${k ? `<div class="eyebrow">${k}</div>` : ""}<h1>${esc(t)}</h1>${desc ? `<p class="lead">${esc(desc)}</p>` : ""}`;
}

function modal(html) {
  $("#modal").innerHTML = html + '<button id="closeModal">Schließen</button>';
  $("#closeModal").onclick = () => $("#modal").close();
  $("#modal").showModal();
}

function field(label, key, value = "", type = "text") {
  return `<label for="${key}">${label}</label><input id="${key}" name="${key}" type="${type}" value="${esc(value)}">`;
}

function select(label, key, opts, value) {
  return `<label for="${key}">${label}</label><select id="${key}" name="${key}">${opts.map((o) => `<option ${o === value ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
}

function render() {
  if (!state) return;
  if (typeof stopNotificationReading === "function") stopNotificationReading();
  renderPreviewControl();
  if (typeof syncThemeControl === "function") syncThemeControl();
  const route = location.hash.slice(1) || "wiki/start";
  $("#identity").textContent = state.me.name;
  renderNavigation(route);
  if (route.startsWith("edit/")) return edit(route.slice(5));
  if (
    ["plan", "rooms", "travel", "admin", "notifications"].includes(route) &&
    !state.me.linked &&
    !state.me.orga
  ) {
    $("#content").innerHTML = title(
      "KONTOZUORDNUNG",
      "Fast dabei",
      "Die Orga muss dein Konto zuerst deinem Namen in der Chorliste zuordnen.",
    );
    return;
  }
  if (route === "manage" || route.startsWith("manage/"))
    return manageContent(route.split("/")[1]);
  if (route === "festival") return festivalInfo();
  if (route === "together") return together();
  if (route === "plan") return renderPlanning();
  if (route === "rooms") return rooms();
  if (route === "travel") return travel();
  if (route === "admin") return admin();
  if (route === "notifications") return renderNotifications();
  wiki(route.split("/")[1] || "start");
}

function renderPreviewControl() {
  const button = $("#viewMode"),
    banner = $("#previewNotice");
  button.hidden = !state.me.canPreview;
  button.textContent = state.me.preview
    ? "Zur Orga-Ansicht"
    : "Mitgliederansicht";
  button.setAttribute("aria-pressed", String(!!state.me.preview));
  banner.hidden = !state.me.preview;
  banner.textContent =
    "Mitglieder-Vorschau · Du siehst die Seite mit deinem eigenen Mitgliedskonto, ohne Orga-Funktionen. Änderungen sind in dieser Vorschau gesperrt.";
  button.onclick = async () => {
    button.disabled = true;
    const before = memberPreview;
    try {
      memberPreview = !state.me.preview;
      sessionStorage.setItem("pkc-member-preview", memberPreview ? "1" : "0");
      if (
        memberPreview &&
        /^(admin|manage|edit\/)/.test(location.hash.slice(1))
      )
        location.hash = "wiki/start";
      await load();
    } catch (error) {
      memberPreview = before;
      sessionStorage.setItem("pkc-member-preview", before ? "1" : "0");
      toast(error.message);
    } finally {
      button.disabled = false;
    }
  };
}
