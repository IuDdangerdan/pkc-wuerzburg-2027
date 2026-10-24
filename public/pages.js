/* Landing pages: overview, festival information, and shared travel. */
function pageSummary(page) {
  return page.summary || "Infos zu " + page.title + ".";
}
function overview() {
  $("#content").innerHTML =
    title("KNEIPENCHORFESTIVAL", cfg("festivalName")) +
    `<div class="overview-date">${esc(cfg("sidebarDate"))}${state.pages.some((p) => p.id === "programm") ? '<a href="#wiki/programm">Programm & Termine →</a>' : ""}</div><section class="card overview-tasks"><svg class="festival-mark" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><g fill="currentColor"><rect x="43" y="4" width="14" height="92" rx="3"/><rect x="43" y="4" width="14" height="92" rx="3" transform="rotate(45 50 50)"/><rect x="43" y="4" width="14" height="92" rx="3" transform="rotate(90 50 50)"/><rect x="43" y="4" width="14" height="92" rx="3" transform="rotate(135 50 50)"/></g></svg><h2>Meine Planung</h2><p>Anreise und Unterkunft eintragen oder ändern.</p><div class="actions"><a class="button primary" href="#plan">Planung bearbeiten</a>${cmsLinkHTML(cfg("eventButtonLabel"), cfg("eventUrl"))}</div></section><section class="card news-section"><div class="title-row"><h2>Neuigkeiten</h2>${state.me.orga ? '<button id="addUpdate">Update schreiben</button>' : ""}</div><div id="updates"></div></section><div class="overview-links"><a href="#wiki/faq">Frage an die Orga stellen →</a><a href="#festival">Alle Festivalinfos →</a></div>`;
  $("#updates").innerHTML = newsList();
  bindNews();
  if (state.me.orga) $("#addUpdate").onclick = () => updateEditor();
}

function festivalInfo() {
  $("#content").innerHTML =
    title("FESTIVAL-WIKI", "Festivalinfos") +
    `<div class="actions"><a class="button primary" href="#wiki/faq">Frage an die Orga stellen</a>${state.me.orga ? '<button id="newPage">+ Wiki-Seite</button>' : ""}</div><input class="search" id="search" aria-label="Festivalinfos durchsuchen" placeholder="Festivalinfos durchsuchen …"><div class="grid" id="pages"></div>`;
  const show = (q) =>
    ($("#pages").innerHTML =
      state.pages
        .filter(
          (p) =>
            p.id !== "start" &&
            (p.title + " " + p.body).toLowerCase().includes(q.toLowerCase()),
        )
        .map(
          (p) =>
            `<a href="#wiki/${esc(p.id)}" class="card card-link"><div class="festival-card-head"><span class="festival-card-icon">${navIcon({ programm: "calendar", unterkunft: "rooms", anreise: "travel", kosten: "cost", technik: "music", faq: "question" }[p.id] || "info")}</span><span class="festival-card-arrow">${navIcon("arrow")}</span></div><h2>${esc(p.id === "faq" ? "Fragen & Kontakt" : p.title)}</h2><p>${esc(pageSummary(p))}</p></a>`,
        )
        .join("") || "<p>Keine passende Seite gefunden.</p>");
  show("");
  $("#search").oninput = (e) => show(e.target.value);
  if (state.me.orga)
    $("#newPage").onclick = () => {
      const id = crypto.randomUUID();
      state.pages.push({
        id,
        title: "Neue Seite",
        body: "",
        history: [],
        updated: new Date().toISOString(),
      });
      location.hash = "edit/" + id;
    };
}

function together() {
  $("#content").innerHTML =
    title("UNSER WOCHENENDE", "Gemeinsam unterwegs") +
    `<div class="grid"><a class="card card-link" href="#travel"><div class="festival-card-head"><span class="festival-card-icon">${navIcon("travel")}</span><span class="festival-card-arrow">${navIcon("arrow")}</span></div><h2>Gemeinsam anreisen</h2><p>Busplanung und Infos zu Bahn und Auto.</p></a><a class="card card-link" href="#rooms"><div class="festival-card-head"><span class="festival-card-icon">${navIcon("rooms")}</span><span class="festival-card-arrow">${navIcon("arrow")}</span></div><h2>Wer wohnt wo?</h2><p>Unterkünfte, Zimmergemeinschaften und freie Plätze.</p></a></div>`;
}
