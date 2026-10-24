/* News and link buttons. Saving and notifying are separate, explicit organizer actions. */
let newsExpanded = false;

function newsHeading(u) {
  return (
    u.title ||
    {
      "bus-hostel-fristen-20261014": "Gemeinsam nach Würzburg",
      "babelfish-frist-20261014": "Babelfish: früh buchen",
      "ibis-buchungsweg-20261014": "Buchung beim IBIS",
      "hotel-cards-20261013": "Unterkünfte im Überblick",
    }[u.id] ||
    "Neues aus der Orga"
  );
}

function newsList() {
  const card = (u) =>
    `<article class="update"><small>${esc(fmt(u.created))}</small>${u.title ? `<h3>${esc(u.title)}</h3>` : ""}<p>${esc(u.body)}</p><div class="actions">${updateButtons(u)}${state.me.orga ? `<button type="button" data-edit-update="${esc(u.id)}">Bearbeiten</button><button type="button" data-notify-update="${esc(u.id)}">${u.notified_at ? "Erneut benachrichtigen" : "Mitglieder benachrichtigen"}</button><button type="button" data-archive-update="${esc(u.id)}">Entfernen</button>` : ""}</div>${state.me.orga ? `<p class="form-note notification-state">${u.notified_at ? "Zuletzt benachrichtigt: " + esc(new Date(u.notified_at).toLocaleString("de-DE")) : "Noch nicht manuell benachrichtigt."}</p>` : ""}</article>`;
  return (
    ((newsExpanded ? state.updates : state.updates.slice(0, 2))
      .map(card)
      .join("") || '<p class="form-note">Noch keine Neuigkeiten.</p>') +
    (state.updates.length > 2
      ? `<button type="button" class="news-toggle" id="toggleNews">${newsExpanded ? "Weniger anzeigen" : "Alle Neuigkeiten (" + state.updates.length + ")"}</button>`
      : "") +
    (state.me.orga && state.archivedUpdates?.length
      ? `<details class="archived-news"><summary>Entfernte Neuigkeiten (${state.archivedUpdates.length})</summary>${state.archivedUpdates.map((u) => `<div class="update"><small>${esc(fmt(u.created))}</small><p>${esc(u.body)}</p><button type="button" data-restore-update="${esc(u.id)}">Wiederherstellen</button></div>`).join("")}</details>`
      : "")
  );
}

function bindNews() {
  document
    .querySelectorAll("[data-notify-update]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          confirmNewsNotification(
            state.updates.find((u) => u.id === b.dataset.notifyUpdate),
          )),
    );
  document
    .querySelectorAll("[data-edit-update]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          updateEditor(
            state.updates.find((u) => u.id === b.dataset.editUpdate),
          )),
    );
  if ($("#toggleNews"))
    $("#toggleNews").onclick = () => {
      newsExpanded = !newsExpanded;
      $("#updates").innerHTML = newsList();
      bindNews();
    };
  document.querySelectorAll("[data-archive-update]").forEach(
    (b) =>
      (b.onclick = async () => {
        b.disabled = true;
        try {
          await post({ action: "archiveUpdate", id: b.dataset.archiveUpdate });
          await load();
          toast("Neuigkeit entfernt. Du kannst sie wiederherstellen.");
        } catch (e) {
          b.disabled = false;
          toast(e.message);
        }
      }),
  );
  document.querySelectorAll("[data-restore-update]").forEach(
    (b) =>
      (b.onclick = async () => {
        b.disabled = true;
        try {
          await post({ action: "restoreUpdate", id: b.dataset.restoreUpdate });
          await load();
          toast("Neuigkeit wiederhergestellt");
        } catch (e) {
          b.disabled = false;
          toast(e.message);
        }
      }),
  );
}

function newsButtonData(u) {
  try {
    return typeof u.buttons === "string"
      ? JSON.parse(u.buttons)
      : u.buttons || [];
  } catch {
    return [];
  }
}

function updateButtons(u) {
  const buttons = newsButtonData(u);
  return buttons
    .filter(
      (b) =>
        typeof b.label === "string" &&
        typeof b.url === "string" &&
        (/^(https?:\/\/)/.test(b.url) ||
          /^#(?:plan|rooms|travel|notifications|festival|together|wiki\/[^\s"<>]+)$/.test(
            b.url,
          )),
    )
    .map(
      (b) =>
        `<a class="button" href="${esc(b.url)}" ${b.url.startsWith("#") ? "" : 'target="_blank" rel="noopener noreferrer"'}>${esc(b.label)} ${b.url.startsWith("#") ? "→" : "↗"}</a>`,
    )
    .join("");
}

function updateEditor(update) {
  let next = 0;
  modal(
    '<h2>Update schreiben</h2><form id="update"><label for="updateTitle">Überschrift (optional)</label><input id="updateTitle" maxlength="120" placeholder="z. B. Gemeinsam nach Würzburg"><label for="updateText">Was ist neu?</label><textarea id="updateText" name="text" required maxlength="3000"></textarea><h3>Buttons (optional)</h3><div id="updateButtonRows"></div><button type="button" id="addUpdateButton">+ Button hinzufügen</button><p class="form-note">Verlinke eine Seite der App oder eine externe Website. Maximal 8 Buttons.</p><label class="member-option notify-choice"><input type="checkbox" id="notifyMembers">Mitglieder jetzt benachrichtigen</label><p class="form-note">Nach dem Speichern ist der Beitrag sichtbar. Ohne Häkchen wird niemand benachrichtigt; das kannst du später nachholen.</p><div class="actions"><button class="primary" id="publishUpdate">Neuigkeit speichern</button></div><p id="updateStatus" role="status"></p></form>',
  );
  if (update) {
    $("#updateTitle").value = newsHeading(update);
    $("#modal h2").textContent = "Neuigkeit bearbeiten";
    $("#updateText").value = update.body;
    $("#publishUpdate").textContent = "Änderungen speichern";
  }
  const targets = [
    { label: "Festivalinfos", url: "#festival" },
    { label: "Gemeinsam unterwegs", url: "#together" },
    { label: "Meine Planung", url: "#plan" },
    { label: "Wer wohnt wo?", url: "#rooms" },
    { label: "Gemeinsam anreisen", url: "#travel" },
    ...state.pages.map((p) => ({ label: p.title, url: "#wiki/" + p.id })),
  ];
  $("#addUpdateButton").onclick = () => {
    const id = next++;
    const row = document.createElement("fieldset");
    row.className = "update-button-row";
    row.innerHTML = `<legend>Button</legend><label for="buttonLabel${id}">Beschriftung</label><input id="buttonLabel${id}" data-button-label required maxlength="80" placeholder="z. B. Businteresse angeben"><label for="buttonType${id}">Linkziel</label><select id="buttonType${id}" data-button-type><option value="internal">Seite der App</option><option value="external">Externer Link</option></select><div data-internal-wrap><label for="buttonPage${id}">Seite auswählen</label><select id="buttonPage${id}" data-button-page>${targets.map((t) => `<option value="${esc(t.url)}">${esc(t.label)}</option>`).join("")}</select></div><div data-external-wrap hidden><label for="buttonUrl${id}">Webadresse</label><input id="buttonUrl${id}" data-button-url type="url" placeholder="https://…" maxlength="2000" disabled></div><button type="button" data-remove-button>Button entfernen</button>`;
    $("#updateButtonRows").append(row);
    const refresh = () => {
      $("#addUpdateButton").disabled =
        $("#updateButtonRows").children.length >= 8;
    };
    row.querySelector("[data-button-type]").onchange = () => {
      const external =
        row.querySelector("[data-button-type]").value === "external";
      row.querySelector("[data-internal-wrap]").hidden = external;
      row.querySelector("[data-external-wrap]").hidden = !external;
      row.querySelector("[data-button-page]").disabled = external;
      row.querySelector("[data-button-url]").disabled = !external;
      row.querySelector("[data-button-url]").required = external;
    };
    row.querySelector("[data-remove-button]").onclick = () => {
      row.remove();
      refresh();
    };
    refresh();
    row.querySelector("[data-button-label]").focus();
  };
  if (update)
    for (const button of newsButtonData(update)) {
      $("#addUpdateButton").click();
      const row = $("#updateButtonRows").lastElementChild;
      row.querySelector("[data-button-label]").value = button.label;
      const external = !button.url.startsWith("#");
      row.querySelector("[data-button-type]").value = external
        ? "external"
        : "internal";
      row.querySelector("[data-button-type]").onchange();
      row.querySelector(
        external ? "[data-button-url]" : "[data-button-page]",
      ).value = button.url;
    }
  $("#update").onsubmit = async (e) => {
    e.preventDefault();
    const buttons = [...$("#updateButtonRows").children].map((row) => ({
      label: row.querySelector("[data-button-label]").value,
      url:
        row.querySelector("[data-button-type]").value === "external"
          ? row.querySelector("[data-button-url]").value
          : row.querySelector("[data-button-page]").value,
    }));
    $("#publishUpdate").disabled = true;
    try {
      await post({
        action: "update",
        id: update?.id,
        title: $("#updateTitle").value,
        text: $("#updateText").value,
        buttons,
        notify: $("#notifyMembers").checked,
      });
      $("#modal").close();
      await load();
      toast("Neuigkeit gespeichert");
    } catch (error) {
      $("#updateStatus").textContent = error.message;
      $("#publishUpdate").disabled = false;
    }
  };
}

function confirmNewsNotification(update) {
  if (!update) return;
  modal(
    `<h2>Mitglieder benachrichtigen?</h2><p>Alle Mitglieder erhalten eine Nachricht zu dieser Neuigkeit.</p>${update.notified_at ? '<p class="form-note">Dieser Beitrag wurde bereits angekündigt. Du verschickst damit eine weitere Nachricht.</p>' : ""}<blockquote>${esc(update.title || update.body.slice(0, 180))}</blockquote><div class="actions"><button type="button" class="primary" id="confirmNotify">Jetzt benachrichtigen</button><button type="button" id="cancelNotify">Abbrechen</button></div><p id="notifyStatus" role="status"></p>`,
  );
  $("#cancelNotify").onclick = () => $("#modal").close();
  $("#confirmNotify").onclick = async (e) => {
    e.target.disabled = true;
    try {
      await post({ action: "notifyUpdate", id: update.id });
      $("#modal").close();
      await load();
      toast("Mitglieder wurden benachrichtigt");
    } catch (error) {
      $("#notifyStatus").textContent = error.message;
      e.target.disabled = false;
    }
  };
}
