/* Wiki rendering, restricted Markdown, and editorial version history. */
function inline(s) {
  return esc(s).replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+|tel:[^\s)]+|\/api\/data\?file=[a-zA-Z0-9_-]+|\/documents\/[a-zA-Z0-9_.-]+|#(?:plan|rooms|travel|wiki\/[a-zA-Z0-9_-]+))\)/g,
    (_, label, url) => {
      const external = !url.startsWith("#");
      return (
        '<a href="' +
        esc(managedUrl(url.replaceAll("&amp;", "&"))) +
        '" ' +
        (external ? 'target="_blank" rel="noopener noreferrer"' : "") +
        ">" +
        label +
        (external ? " ↗" : " →") +
        "</a>"
      );
    },
  );
}

function md(s) {
  let out = "",
    list = false;
  for (const l of s.split("\n")) {
    if (l === "[[BUCHUNGSFRISTEN]]") {
      if (list) {
        out += "</ul>";
        list = false;
      }
      out += bookingDeadlines();
      continue;
    }
    if (l === "[[UNTERKUNFTSANGEBOTE]]" || l === "[[UNTERKUNFTSDOKUMENTE]]") {
      if (list) {
        out += "</ul>";
        list = false;
      }
      out += l === "[[UNTERKUNFTSANGEBOTE]]" ? hotelOffers() : hotelDocuments();
      continue;
    }
    if (l.startsWith("- ")) {
      if (!list) {
        out += "<ul>";
        list = true;
      }
      out += "<li>" + inline(l.slice(2)) + "</li>";
      continue;
    }
    if (list) {
      out += "</ul>";
      list = false;
    }
    out += l.startsWith("## ")
      ? "<h2>" + inline(l.slice(3)) + "</h2>"
      : l
        ? "<p>" + inline(l) + "</p>"
        : "";
  }
  return out + (list ? "</ul>" : "");
}

function wiki(id) {
  if (id === "start") return overview();
  const p = state.pages.find((x) => x.id === id);
  if (!p) {
    $("#content").innerHTML = title("WIKI", "Seite nicht verfügbar");
    return;
  }
  $("#content").innerHTML =
    `<div class="title-row"><div>${title(esc(cfg("festivalEyebrow")), id === "faq" ? "Fragen & Kontakt" : p.title)}</div>${state.me.orga ? '<button id="edit">Seite bearbeiten</button>' : ""}</div><div class="meta">Stand: ${esc(fmt(p.updated))} ${state.me.orga ? `· <button id="history">Versionsverlauf (${p.history.length})</button>` : ""}</div>` +
    (id === "faq" ? questionSection() : "") +
    `${["anreise", "kosten"].includes(id) ? busDeadlineNote(true) : ""}<article class="article card">${id === "faq" ? "<h2>Häufige Fragen</h2>" : ""}${id === "unterkunft" ? accommodationContent(p.body) : md(p.body)}</article><div class="actions">${id === "unterkunft" ? '<a class="button primary" href="#plan">Meine Unterkunft eintragen</a><a class="button" href="#rooms">Wer wohnt wo? →</a>' : id === "anreise" ? '<a class="button primary" href="#plan">Meine Planung →</a>' : ""}<a class="button" href="#festival">Alle Festivalinfos</a><button id="copy">Seitenlink kopieren</button></div>`;
  bindHotelEditors();
  if (id === "faq") bindQuestions();
  if (state.me.orga) {
    $("#edit").onclick = () => (location.hash = "edit/" + p.id);
    $("#history").onclick = () => history(p);
  }
  $("#copy").onclick = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      toast("Seitenlink kopiert");
    } catch {
      toast("Bitte kopiere die Adresse aus der Browserzeile");
    }
  };
}

function history(p) {
  modal(
    "<h2>Versionsverlauf</h2>" +
      (!p.history.length
        ? "<p>Noch keine früheren Versionen.</p>"
        : p.history
            .map(
              (h, i) =>
                `<div class="update"><small>${esc(fmt(h.date))} · ${esc(h.title)}</small><p>${esc(h.body.slice(0, 150))}…</p><button data-restore="${i}">Diese Version wiederherstellen</button></div>`,
            )
            .join("")),
  );
  document.querySelectorAll("[data-restore]").forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          const h = p.history[+b.dataset.restore];
          await post({
            action: "wiki",
            id: p.id,
            title: h.title,
            body: h.body,
          });
          $("#modal").close();
          await load();
          toast("Version wiederhergestellt");
        } catch (e) {
          toast(e.message);
        }
      }),
  );
}

function edit(id) {
  if (!state.me.orga) {
    $("#content").innerHTML = title("ZUGRIFF", "Nur für die Orga");
    return;
  }
  const p = [...state.pages, ...(state.archivedPages || [])].find(
    (x) => x.id === id,
  );
  if (!p) return wiki("start");
  $("#content").innerHTML =
    title("WIKI BEARBEITEN", "Wissen gemeinsam festhalten") +
    `<form id="editor" class="form"><label for="pageTitle">Titel</label><input id="pageTitle" name="title" required maxlength="150" value="${esc(p.title)}">${field("Kurzbeschreibung (Übersicht)", "summary", p.summary)}${field("Reihenfolge (0–99)", "position", p.position || 0, "number")}<label for="pageBody">Inhalt</label><p class="form-note">Abschnitt: ## Überschrift · Aufzählung: - Punkt · Link: [Text](https://…) · Dateilinks findest du unter Inhalte verwalten → Dateien. [[UNTERKUNFTSANGEBOTE]] zeigt Hotelkarten, [[BUCHUNGSFRISTEN]] die aktuellen Hotel-Fristen.</p><textarea id="pageBody" name="body" required maxlength="30000">${esc(p.body)}</textarea><div class="actions"><button class="primary">Änderungen speichern</button><button type="button" id="preview">Vorschau</button><a class="button" href="#wiki/${p.id}">Abbrechen</a></div><div id="editPreview" class="article"></div></form>`;
  $("#preview").onclick = () =>
    ($("#editPreview").innerHTML =
      id === "unterkunft"
        ? accommodationContent($("#pageBody").value)
        : md($("#pageBody").value));
  $("#editor").onsubmit = async (e) => {
    e.preventDefault();
    try {
      await post({
        action: "wiki",
        id: p.id,
        ...Object.fromEntries(new FormData(e.target)),
      });
      await load();
      location.hash = "wiki/" + p.id;
      toast("Wiki-Seite gespeichert");
    } catch (e) {
      toast(e.message);
    }
  };
}
