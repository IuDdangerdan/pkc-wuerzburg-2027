/* Redaktionelle Inhalte und strukturierte Angebote; Daten kommen aus state, nicht aus dem HTML. */
/* Redaktionelle Verwaltung, ausschließlich mit Website-Orga-Rolle. */
const SETTINGS_GROUPS = [
  [
    "Festival & Kontakt",
    [
      ["siteTitle", "Seitentitel im Browser"],
      ["festivalName", "Festivalname"],
      ["festivalEyebrow", "Kurze Festivalüberschrift"],
      ["sidebarDate", "Datum & Ort in der Navigation"],
      ["sidebarFooter", "Chorname"],
      ["sidebarMotto", "Motto"],
      ["brandSubtitle", "Text neben dem Logo"],
      ["eventStart", "Anreise-Vorgabe", "date"],
      ["eventEnd", "Abreise-Vorgabe", "date"],
      ["eventUrl", "Teilnahmeabstimmung: Link"],
      ["eventButtonLabel", "Teilnahmeabstimmung: Buttontext"],
      ["contactName", "Kontaktperson"],
      ["whatsappNumber", "WhatsApp-Nummer (mit Ländervorwahl, nur Ziffern)"],
    ],
  ],
  [
    "Anreise & Fristen",
    [
      ["busDeadline", "Businteresse: Rückmeldefrist", "date"],
      ["busDeadlineText", "Hinweis zur Busfrist", "textarea"],
      ["travelTitle", "Anreiseseite: Überschrift"],
      ["travelIntro", "Anreiseseite: Einleitung", "textarea"],
      ["travelBusTitle", "Bus: Überschrift"],
      ["travelBusTag", "Bus: Statushinweis"],
      ["travelBusText", "Bus: Beschreibung", "textarea"],
      ["travelOtherTitle", "Bahn & Auto: Überschrift"],
      ["travelOtherText", "Bahn & Auto: Beschreibung", "textarea"],
    ],
  ],
  [
    "Hinweise & Fragen",
    [
      ["offersIntro", "Hinweis vor den Hotelangeboten", "textarea"],
      ["planIntro", "Meine Planung: Einleitung", "textarea"],
      ["roomsIntro", "Wer wohnt wo: Einleitung", "textarea"],
      [
        "questionIntro",
        "Fragenformular: Einleitung ({contact} = Kontaktperson)",
        "textarea",
      ],
      ["questionPrivacy", "Fragenformular: Sichtbarkeitshinweis", "textarea"],
      ["taskTitle", "Orga-Aufgabe: Überschrift"],
      ["taskText", "Orga-Aufgabe: Beschreibung", "textarea"],
    ],
  ],
];
const cfg = (key) => state?.settings?.[key] || "";
function configField(key, label, type = "text", value = cfg(key)) {
  return `<label for="cfg-${esc(key)}">${esc(label)}</label>${type === "textarea" ? `<textarea id="cfg-${esc(key)}" name="${esc(key)}" rows="3" maxlength="3000">${esc(value)}</textarea>` : `<input id="cfg-${esc(key)}" name="${esc(key)}" type="${type}" value="${esc(value)}" maxlength="3000">`}`;
}
function cmsLinkHTML(label, url, classes = "button") {
  if (!url) return "";
  return `<a class="${classes}" href="${esc(managedUrl(url))}" ${url.startsWith("#") ? "" : 'target="_blank" rel="noopener noreferrer"'}>${esc(label)} ${url.startsWith("#") ? "→" : "↗"}</a>`;
}
function managedUrl(url) {
  const doc = state?.documents?.find((d) => d.legacyPath === url);
  return doc ? doc.url : url;
}
function applyContentSettings() {
  document.title = cfg("siteTitle");
  $(".brand small").textContent = cfg("brandSubtitle");
  $(".festival").innerHTML =
    `<span>UNSER FESTIVAL-WIKI</span><strong>${esc(cfg("festivalName"))}</strong><p>${esc(cfg("sidebarDate"))}</p>`;
  $(".aside-bottom").innerHTML =
    esc(cfg("sidebarFooter")) +
    "<br><small>" +
    esc(cfg("sidebarMotto")) +
    "</small>";
}
function accommodationContent(body) {
  const marker = "[[UNTERKUNFTSANGEBOTE]]";
  if (!body.includes(marker)) return md(body);
  const notes = body.replace(marker, "\n");
  return `<details class="booking-information"><summary>Infos & Hinweise zur Buchung</summary><div class="booking-information-body">${md(notes)}${cfg("offersIntro") ? '<p class="form-note">' + esc(cfg("offersIntro")) + "</p>" : ""}</div></details>${hotelOffers(false)}`;
}
function hotelOffers(includeIntro = true) {
  const hs = state.hotels.filter((h) => !h.archived);
  return (
    (includeIntro && cfg("offersIntro")
      ? '<p class="form-note">' + esc(cfg("offersIntro")) + "</p>"
      : "") +
    '<div class="hotel-cards">' +
    hs
      .map((h, i) => {
        const doc = state.documents.find(
          (d) => d.id === h.documentId && !d.archived,
        );
        return `<details class="hotel-card" id="hotel-${esc(h.id)}"><summary class="hotel-summary"><span class="hotel-summary-top"><span class="hotel-name" id="hotel-title-${i}">${esc(h.name)}</span><span class="tag">${h.deadline ? "Abruf bis " + esc(fmt(h.deadline)) : "Keine Abruffrist genannt"}</span></span><span class="hotel-summary-price">${esc(h.price)}</span></summary><div class="hotel-offer-body"><dl><dt>Frühstück</dt><dd>${esc(h.breakfast || "Nicht angegeben")}</dd><dt>Buchung</dt><dd>${esc(h.booking)}</dd></dl>${h.note || h.warning ? `<div class="booking-note">${h.note ? "<p>" + inline(h.note) + "</p>" : ""}${h.warning ? "<strong>" + esc(h.warning) + "</strong>" : ""}</div>` : ""}<div class="actions">${(h.links || []).map((l) => cmsLinkHTML(l.label, l.url)).join("")}</div><details class="hotel-room-details"><summary>Zimmer & Bedingungen</summary><div class="hotel-detail-content">${hotelDetailSections(h)}${h.sourceNote ? '<p class="form-note">' + esc(h.sourceNote) + "</p>" : ""}${doc ? cmsLinkHTML(doc.label, doc.url, "") : ""}</div></details>${state.me.orga ? `<div class="actions"><button data-cms-hotel="${esc(h.id)}">Angebot bearbeiten</button></div>` : ""}</div></details>`;
      })
      .join("") +
    "</div>"
  );
}
function hotelDocuments() {
  return (
    '<div class="actions">' +
    state.documents
      .filter((d) => !d.archived)
      .map((d) => cmsLinkHTML(d.label, d.url))
      .join("") +
    "</div>"
  );
}
function bookingDeadlines() {
  const hotels = state.hotels
    .filter((h) => !h.archived && h.deadline)
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
  return (
    "<ul>" +
    hotels
      .map((h) => "<li>" + esc(fmt(h.deadline)) + ": " + esc(h.name) + "</li>")
      .join("") +
    "</ul>"
  );
}
function bindHotelEditors() {
  document
    .querySelectorAll("[data-cms-hotel]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          hotelEditor(state.hotels.find((h) => h.id === b.dataset.cmsHotel))),
    );
}
const CMS_AREAS = [
  {
    id: "text",
    title: "Texte & Kontakt",
    description: "Festivaldaten, Hinweise und Kontaktperson.",
    icon: "book",
  },
  {
    id: "travel",
    title: "Fristen & Anreise",
    description: "Festivalzeitraum, Busfrist und Anreiseinformationen.",
    icon: "travel",
  },
  {
    id: "hotels",
    title: "Unterkünfte",
    description: "Hotelangebote, Preise, Bedingungen und Buchungslinks.",
    icon: "rooms",
  },
  {
    id: "files",
    title: "Dateien & Wiki",
    description: "PDFs und Bilder verwalten, Wiki-Seiten pflegen.",
    icon: "plan",
  },
];
function manageContent(area) {
  if (!state.me.orga) {
    $("#content").innerHTML = title("ZUGRIFF", "Nur für die Orga");
    return;
  }
  const selected = CMS_AREAS.find((x) => x.id === area);
  if (!selected) {
    $("#content").innerHTML =
      title(
        "ORGA · INHALTE",
        "Inhalte verwalten",
        "Wähle den Bereich, den du bearbeiten möchtest. Änderungen werden direkt gespeichert; Benachrichtigungen gibst du gesondert frei.",
      ) +
      `<div class="cms-area-grid">${CMS_AREAS.map((x) => `<a class="card cms-area-card" href="#manage/${x.id}"><span class="cms-area-icon">${navIcon(x.icon)}</span><h2>${esc(x.title)}</h2><p>${esc(x.description)}</p><span class="cms-area-open">Bereich öffnen →</span></a>`).join("")}</div>`;
    return;
  }
  const areaTitle = selected.title;
  const dates = ["eventStart", "eventEnd"];
  const groups =
    area === "text"
      ? [
          [
            SETTINGS_GROUPS[0][0],
            SETTINGS_GROUPS[0][1].filter((f) => !dates.includes(f[0])),
          ],
          SETTINGS_GROUPS[2],
        ]
      : area === "travel"
        ? [
            [
              "Festivalzeitraum",
              SETTINGS_GROUPS[0][1].filter((f) => dates.includes(f[0])),
            ],
            SETTINGS_GROUPS[1],
          ]
        : [];
  const keys = groups.flatMap((g) => g[1].map((f) => f[0]));
  $("#content").innerHTML =
    `<a class="cms-back" href="#manage">← Alle Inhaltsbereiche</a>` +
    title("ORGA · INHALTE", areaTitle, selected.description) +
    `<nav class="cms-area-nav" aria-label="Inhaltsbereiche">${CMS_AREAS.map((x) => `<a href="#manage/${x.id}" ${x.id === area ? 'aria-current="page"' : ""}>${esc(x.title)}</a>`).join("")}</nav>` +
    (area === "text" || area === "travel"
      ? `<section id="cmsSettings" class="cms-section"><form id="settingsForm">${groups.map(([heading, fields], i) => `<details class="card cms-group" ${i === 0 ? "open" : ""}><summary>${esc(heading)}</summary><div class="cms-fields">${fields.map(([key, label, type]) => configField(key, label, type)).join("")}</div></details>`).join("")}<div class="actions"><button class="primary">${esc(areaTitle)} speichern</button></div><p id="settingsStatus" role="status"></p></form>${state.settingsHistory?.length ? `<details class="cms-history"><summary>Frühere Einstellungen dieses Bereichs</summary>${state.settingsHistory.map((v, i) => `<div class="update"><small>${esc(fmt(v.date))}</small><button data-config-restore="${i}">Bereich wiederherstellen</button></div>`).join("")}</details>` : ""}</section>`
      : area === "hotels"
        ? `<section id="cmsHotels" class="cms-section"><div class="title-row"><h2>Hotelangebote</h2><button id="cmsAddHotel">+ Unterkunft hinzufügen</button></div><p class="form-note">Änderungen gelten für die Hotelkarten, Buchungsfristen und Unterkunftsauswahl. Bestehende Zimmer bleiben beim Ausblenden erhalten.</p><div class="cms-list">${state.hotels
            .filter((h) => !h.archived)
            .map(cmsHotelRow)
            .join("")}</div>${
            state.hotels.some((h) => h.archived)
              ? `<details><summary>Ausgeblendete Unterkünfte</summary>${state.hotels
                  .filter((h) => h.archived)
                  .map(cmsHotelRow)
                  .join("")}</details>`
              : ""
          }</section>`
        : `<section id="cmsDocs" class="cms-section"><h2>Dateien & PDFs</h2><p class="form-note">PDF, PNG, JPEG oder WebP, maximal 10 MB. Beim Ersetzen bleibt der Link erhalten. Frühere Versionen lassen sich wiederherstellen.</p><form id="documentUpload" class="card cms-upload"><label for="documentLabel">Beschriftung</label><input id="documentLabel" name="label" required maxlength="200"><label for="documentFile">Datei</label><input id="documentFile" name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" required><button class="primary">Datei hochladen</button><p id="uploadStatus" role="status"></p></form><div class="cms-list">${state.documents.map(cmsDocumentRow).join("")}</div></section><section id="cmsPages" class="cms-section"><div class="title-row"><h2>Wiki-Seiten</h2><button id="cmsAddPage">+ Seite hinzufügen</button></div><p class="form-note">Titel, Texte, Kurzbeschreibungen und Reihenfolge bearbeitest du über „Bearbeiten“. Ausgeblendete Seiten können wiederhergestellt werden.</p>${[
            ...state.pages,
            ...(state.archivedPages || []),
          ]
            .filter((p) => p.id !== "start")
            .map(
              (p) =>
                `<div class="cms-row"><div><strong>${esc(p.title)}</strong><small>${p.archived ? "Ausgeblendet" : esc(p.summary || "Keine Kurzbeschreibung")}</small></div><div class="actions"><a class="button" href="#edit/${esc(p.id)}">Bearbeiten</a>${p.id !== "start" ? `<button data-page-archive="${esc(p.id)}" data-hidden="${p.archived ? "1" : "0"}">${p.archived ? "Wiederherstellen" : "Ausblenden"}</button>` : ""}</div></div>`,
            )
            .join("")}</section>`);
  bindCms(keys);
}

function cmsHotelRow(h) {
  return `<div class="cms-row"><div><strong>${esc(h.name)}</strong><small>${esc(h.price)}${h.deadline ? " · bis " + esc(fmt(h.deadline)) : ""}</small></div><div class="actions"><button data-cms-hotel="${esc(h.id)}">Bearbeiten</button><button data-hotel-archive="${esc(h.id)}" data-hidden="${h.archived ? "1" : "0"}">${h.archived ? "Wiederherstellen" : "Ausblenden"}</button></div></div>`;
}
function cmsDocumentRow(d) {
  return `<div class="cms-row"><div><strong>${esc(d.label)}${d.archived ? " · ausgeblendet" : ""}</strong><small>${esc(d.name)} · ${esc(fmt(d.updated))}</small><a href="${esc(d.url)}" target="_blank" rel="noopener">Datei öffnen ↗</a></div><div class="actions"><button data-doc-edit="${esc(d.id)}">Verwalten</button><button data-doc-copy="${esc(d.id)}">Link kopieren</button></div></div>`;
}
function bindCms(activeKeys = []) {
  if ($("#settingsForm"))
    $("#settingsForm").onsubmit = async (e) => {
      e.preventDefault();
      const button = e.target.querySelector("button");
      button.disabled = true;
      try {
        await post({
          action: "cmsSettings",
          settings: Object.fromEntries(new FormData(e.target)),
        });
        await load();
        toast("Einstellungen gespeichert");
      } catch (error) {
        $("#settingsStatus").textContent = error.message;
        button.disabled = false;
      }
    };
  document.querySelectorAll("[data-config-restore]").forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          await post({
            action: "cmsSettings",
            settings: Object.fromEntries(
              activeKeys.map((key) => [
                key,
                state.settingsHistory[+b.dataset.configRestore].data[key] ??
                  cfg(key),
              ]),
            ),
          });
          await load();
          toast("Bereich wiederhergestellt");
        } catch (e) {
          toast(e.message);
        }
      }),
  );
  if ($("#cmsAddHotel")) $("#cmsAddHotel").onclick = () => hotelEditor();
  bindHotelEditors();
  document.querySelectorAll("[data-hotel-archive]").forEach(
    (b) =>
      (b.onclick = () =>
        cmsAction({
          action: "cmsHotelArchive",
          id: b.dataset.hotelArchive,
          archived: b.dataset.hidden !== "1",
        })),
  );
  document.querySelectorAll("[data-page-archive]").forEach(
    (b) =>
      (b.onclick = () =>
        cmsAction({
          action: "cmsPageArchive",
          id: b.dataset.pageArchive,
          archived: b.dataset.hidden !== "1",
        })),
  );
  if ($("#cmsAddPage"))
    $("#cmsAddPage").onclick = () => {
      const id = crypto.randomUUID();
      state.pages.push({
        id,
        title: "Neue Seite",
        body: "",
        summary: "",
        position: state.pages.length,
        history: [],
        updated: new Date().toISOString(),
      });
      location.hash = "edit/" + id;
    };
  if ($("#documentUpload"))
    $("#documentUpload").onsubmit = async (e) => {
      e.preventDefault();
      const button = e.target.querySelector("button");
      button.disabled = true;
      try {
        await uploadDocument(new FormData(e.target));
        await load();
        toast("Datei gespeichert");
      } catch (error) {
        $("#uploadStatus").textContent = error.message;
        button.disabled = false;
      }
    };
  document
    .querySelectorAll("[data-doc-edit]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          documentEditor(
            state.documents.find((d) => d.id === b.dataset.docEdit),
          )),
    );
  document.querySelectorAll("[data-doc-copy]").forEach(
    (b) =>
      (b.onclick = async () => {
        const d = state.documents.find((d) => d.id === b.dataset.docCopy);
        try {
          await navigator.clipboard.writeText(
            new URL(d.url, location.origin).href,
          );
          toast("Link kopiert");
        } catch {
          modal(
            '<h2>Dateilink</h2><input readonly value="' +
              esc(new URL(d.url, location.origin).href) +
              '">',
          );
        }
      }),
  );
}
async function cmsAction(data) {
  try {
    await post(data);
    await load();
    toast("Änderung gespeichert");
  } catch (error) {
    toast(error.message);
  }
}
async function uploadDocument(form) {
  const r = await fetch("/api/data", { method: "POST", body: form });
  const d = await r.json();
  if (!r.ok) throw Error(d.error);
  return d;
}
function documentEditor(d) {
  modal(
    `<h2>Datei verwalten</h2><form id="docMetadata">${field("Beschriftung", "docLabel", d.label)}<div class="actions"><button>Beschriftung speichern</button><button type="button" id="docArchive">${d.archived ? "Wiederherstellen" : "Ausblenden"}</button></div></form><p class="form-note">Ausblenden macht die Datei für Mitglieder unzugänglich. Passe zuvor Verweise in Wiki-Seiten und Hotelangeboten an.</p><h3>Datei ersetzen</h3><form id="docReplace"><input name="id" type="hidden" value="${esc(d.id)}"><label for="replacementFile">Neue Datei (Link bleibt gleich)</label><input name="file" id="replacementFile" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" required><div class="actions"><button>Datei ersetzen</button></div><p id="replaceStatus" role="status"></p></form>${d.history?.length ? "<h3>Frühere Versionen</h3>" + d.history.map((v) => `<div class="update"><small>${esc(fmt(v.date))} · ${esc(v.name)}</small><button data-doc-restore="${v.index}">Version wiederherstellen</button></div>`).join("") : ""}`,
  );
  $("#docMetadata").onsubmit = async (e) => {
    e.preventDefault();
    try {
      await post({
        action: "cmsDocument",
        id: d.id,
        label: $("#docLabel").value,
      });
      $("#modal").close();
      await load();
      toast("Beschriftung gespeichert");
    } catch (error) {
      toast(error.message);
    }
  };
  $("#docArchive").onclick = async () => {
    try {
      await post({ action: "cmsDocument", id: d.id, archived: !d.archived });
      $("#modal").close();
      await load();
      toast("Änderung gespeichert");
    } catch (error) {
      toast(error.message);
    }
  };
  $("#docReplace").onsubmit = async (e) => {
    e.preventDefault();
    const button = e.target.querySelector("button");
    button.disabled = true;
    try {
      await uploadDocument(new FormData(e.target));
      $("#modal").close();
      await load();
      toast("Datei ersetzt, Link bleibt erhalten");
    } catch (error) {
      $("#replaceStatus").textContent = error.message;
      button.disabled = false;
    }
  };
  document.querySelectorAll("[data-doc-restore]").forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          await post({
            action: "cmsDocument",
            id: d.id,
            restore: +b.dataset.docRestore,
          });
          $("#modal").close();
          await load();
          toast("Dateiversion wiederhergestellt");
        } catch (e) {
          toast(e.message);
        }
      }),
  );
}
function hotelEditor(h) {
  if (!state.me.orga) return;
  const sections = (h?.sections || [])
    .map((x) => "# " + x.title + "\n" + x.items.map((t) => "- " + t).join("\n"))
    .join("\n\n");
  modal(
    `<h2>${h ? "Unterkunft bearbeiten" : "Unterkunft hinzufügen"}</h2><form id="hotelEditor"><div class="cms-fields">${field("Name", "hotelName", h?.name)}${field("Preis (mit Preisgrundlage)", "hotelPrice", h?.price)}${field("Frühstück", "hotelBreakfast", h?.breakfast)}${field("Buchungsfrist (optional)", "hotelDeadline", h?.deadline, "date")}${field("Buchung: Kontakt / Stichwort", "hotelBooking", h?.booking)}${field("Reihenfolge (0–99)", "hotelPosition", h?.position || 0, "number")}<label for="hotelDoc">Originaldokument</label><select id="hotelDoc"><option value="">Kein Dokument</option>${state.documents
      .filter((d) => !d.archived || d.id === h?.documentId)
      .map(
        (d) =>
          `<option value="${esc(d.id)}" ${d.id === h?.documentId ? "selected" : ""}>${esc(d.label)}</option>`,
      )
      .join(
        "",
      )}</select><label for="hotelNote">Buchungshinweis (optional, Links wie im Wiki)</label><textarea id="hotelNote" rows="3">${esc(h?.note)}</textarea>${field("Hervorgehobener Hinweis (optional)", "hotelWarning", h?.warning)}${field("Quellenhinweis (optional)", "hotelSource", h?.sourceNote)}<label for="hotelSections">Zimmer & Bedingungen</label><p class="form-note">Pro Abschnitt eine Überschrift mit #, darunter einzelne Zeilen mit -. Beispiel: # Doppelzimmer, darunter - 100 € pro Zimmer/Nacht</p><textarea id="hotelSections" rows="7">${esc(sections)}</textarea></div><h3>Buchungsbuttons</h3><div id="hotelLinkRows"></div><button type="button" id="addHotelLink">+ Linkbutton hinzufügen</button><div class="actions"><button class="primary" id="saveHotel">Unterkunft speichern</button></div><p id="hotelStatus" role="status"></p></form>`,
  );
  let index = 0;
  const addLink = (l = { label: "", url: "" }) => {
    const id = index++;
    const row = document.createElement("div");
    row.className = "cms-link-row";
    row.innerHTML = `<label for="hotelLinkLabel${id}">Buttontext</label><input id="hotelLinkLabel${id}" data-label value="${esc(l.label)}" required maxlength="100"><label for="hotelLinkUrl${id}">Link (https://…, mailto:… oder Dateilink)</label><input id="hotelLinkUrl${id}" data-url value="${esc(l.url)}" required maxlength="2000"><button type="button">Link entfernen</button>`;
    row.querySelector("button").onclick = () => {
      row.remove();
      $("#addHotelLink").disabled = false;
    };
    $("#hotelLinkRows").append(row);
    $("#addHotelLink").disabled = $("#hotelLinkRows").children.length >= 8;
  };
  (h?.links || []).forEach(addLink);
  $("#addHotelLink").onclick = () => addLink();
  $("#hotelEditor").onsubmit = async (e) => {
    e.preventDefault();
    const parsed = [];
    let section = null;
    for (const line of $("#hotelSections").value.split("\n")) {
      if (line.startsWith("# ")) {
        section = { title: line.slice(2).trim(), items: [] };
        parsed.push(section);
      } else if (line.trim()) {
        if (!section) {
          section = { title: "Details", items: [] };
          parsed.push(section);
        }
        section.items.push(line.replace(/^-\s*/, ""));
      }
    }
    const hotel = {
      name: $("#hotelName").value,
      price: $("#hotelPrice").value,
      breakfast: $("#hotelBreakfast").value,
      deadline: $("#hotelDeadline").value,
      booking: $("#hotelBooking").value,
      position: $("#hotelPosition").value,
      documentId: $("#hotelDoc").value,
      note: $("#hotelNote").value,
      warning: $("#hotelWarning").value,
      sourceNote: $("#hotelSource").value,
      sections: parsed,
      links: [...$("#hotelLinkRows").children].map((row) => ({
        label: row.querySelector("[data-label]").value,
        url: row.querySelector("[data-url]").value,
      })),
    };
    $("#saveHotel").disabled = true;
    try {
      await post({ action: "cmsHotel", id: h?.id, hotel });
      $("#modal").close();
      await load();
      toast("Unterkunft gespeichert");
    } catch (error) {
      $("#hotelStatus").textContent = error.message;
      $("#saveHotel").disabled = false;
    }
  };
}

function hotelDetailSections(h) {
  return h.sections
    .map(
      (section) =>
        '<section class="hotel-detail-section"><h4>' +
        esc(section.title) +
        "</h4><ul>" +
        section.items.map((item) => "<li>" + esc(item) + "</li>").join("") +
        "</ul></section>",
    )
    .join("");
}
