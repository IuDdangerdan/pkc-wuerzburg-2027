/* Geschützte Rückmeldungen, CSV-Export sowie vorläufige Konto- und Rollenzuordnung. */
function admin() {
  if (!state.me.orga) {
    $("#content").innerHTML = title(
      "ZUGRIFF",
      "Nur mit Orga-Rolle",
      "Diese Übersicht ist für dich nicht freigegeben.",
    );
    return;
  }
  $("#content").innerHTML =
    title(
      "ORGA-ANSICHT",
      "Alles im Blick",
      "Geschützte Übersicht. Hier siehst du die vollständigen Rückmeldungen.",
    ) +
    `<section class="card" style="margin-bottom:22px"><h2>Fragen an die Website-Orga</h2><p class="form-note">Gemeinsamer Posteingang für alle mit Orga-Rolle. Die Absender sehen nur ihre eigenen Fragen.</p>${questionMessages()}</section><div class="card"><h2>${esc(cfg("taskTitle"))}</h2><p>${esc(cfg("taskText"))}</p></div><section class="admin-feedback"><div class="title-row"><h2>Unterkunft</h2><button id="exportLodging">Unterkunft als CSV</button></div>${select("Unterkunft filtern", "lodgingFilter", ["Alle", ...lodgingStatuses])}<div id="lodgingResults"></div><details class="admin-room-details"><summary>Zimmer bearbeiten & Zimmernummern ergänzen</summary><div class="grid">${state.rooms.map(roomCard).join("") || "<p>Noch keine Zimmer erfasst.</p>"}</div></details></section><section class="admin-feedback"><div class="title-row"><h2>Anreise</h2><button id="exportTravel">Anreise als CSV</button></div>${select("Anreise filtern", "travelFilter", ["Alle", "Reiseart offen", "Businteresse", "Bus", "Bahn", "Auto: selbst fahren", "Auto: mitfahren", "Andere"])}<div id="travelResults"></div></section>${
      state.me.owner
        ? '<section class="card" style="margin-top:28px"><h2>Konten & Rollen</h2><p class="form-note">Mitglieder melden sich einmal an. Danach kannst du ihr Konto einem Namen zuordnen. Die PKC-App-Anmeldung ist noch nicht angebunden.</p><div id="accounts"></div><h3 style="margin-top:24px">Orga-Berechtigung vergeben</h3><form id="roleForm"><label for="roleMember">Mitglied</label><select id="roleMember">' +
          state.members
            .filter((m) => m.id !== state.me.id)
            .map((m) => `<option value="${esc(m.id)}">${esc(m.name)}</option>`)
            .join("") +
          "</select>" +
          select("Rolle", "role", ["member", "orga"]) +
          '<div class="actions"><button>Rolle speichern</button></div></form></section>'
        : ""
    }`;
  const lodgingRows = () => {
    const ids = [
      ...new Set([
        ...state.plans.map((p) => p.member_id),
        ...state.rooms.flatMap((r) => r.memberIds),
      ]),
    ];
    return ids
      .map((id) => ({
        id,
        plan: state.plans.find((p) => p.member_id === id),
        rooms: state.rooms.filter((r) => r.memberIds.includes(id)),
      }))
      .filter(
        (r) =>
          $("#lodgingFilter").value === "Alle" ||
          r.plan?.status === $("#lodgingFilter").value,
      );
  };
  const travelRows = () =>
    state.plans.filter((p) => {
      const f = $("#travelFilter").value;
      return (
        f === "Alle" ||
        (f === "Reiseart offen" && p.mode === "Noch offen") ||
        (f === "Businteresse" &&
          ["Ja", "Vielleicht, je nach Preis"].includes(p.bus)) ||
        (f === "Auto: selbst fahren" &&
          p.mode === "Auto" &&
          p.car_role === "Ich fahre selbst") ||
        (f === "Auto: mitfahren" &&
          p.mode === "Auto" &&
          p.car_role === "Ich möchte mitfahren") ||
        p.mode === f
      );
    });
  const table = (headers, rows) =>
    rows.length
      ? '<div class="card table-wrap"><table class="feedback-table" role="table"><thead><tr role="row">' +
        headers
          .map((h) => '<th scope="col" role="columnheader">' + esc(h) + "</th>")
          .join("") +
        "</tr></thead><tbody>" +
        rows
          .map(
            (r) =>
              '<tr role="row">' +
              r
                .map(
                  (c, i) =>
                    '<td role="cell" data-label="' +
                    esc(headers[i]) +
                    '">' +
                    esc(c) +
                    "</td>",
                )
                .join("") +
              "</tr>",
          )
          .join("") +
        "</tbody></table></div>"
      : '<div class="empty">Keine passenden Rückmeldungen.</div>';
  const showLodging = () =>
    ($("#lodgingResults").innerHTML = table(
      [
        "Name",
        "Unterkunftsstatus",
        "Unterkunft",
        "Zimmergemeinschaft",
        "Zeitraum",
        "Zimmernummer",
      ],
      lodgingRows().map((r) => [
        name(r.id),
        r.plan?.status || "Nicht angegeben",
        r.plan?.status === "Privat organisiert"
          ? r.plan.private_place || "Ort nicht angegeben"
          : r.rooms.map((x) => x.hotel).join("; ") || "–",
        r.rooms.map((x) => x.memberIds.map(name).join(", ")).join("; ") || "–",
        r.rooms
          .map((x) => fmt(x.arrival) + " – " + fmt(x.departure))
          .join("; ") || "–",
        r.rooms.map((x) => x.number || "Noch offen").join("; ") || "–",
      ]),
    ));
  const showTravel = () =>
    ($("#travelResults").innerHTML = table(
      [
        "Name",
        "Reiseart",
        "Businteresse",
        "Max. Buspreis",
        "Fahrer/Mitfahrer",
        "Mitfahrerplätze gesamt",
        "Bereits Mitfahrende",
        "Freie Autoplätze",
        "Mitfahrt bei",
      ],
      travelRows().map((p) => [
        name(p.member_id),
        p.mode,
        p.bus,
        p.budget ? p.budget + " €" : "–",
        p.car_role || "–",
        p.car_capacity ?? "Noch nicht bestätigt",
        (p.car_passengers || []).map(name).join(", ") || "–",
        p.car_seats ?? "–",
        p.car_driver ? name(p.car_driver) : "–",
      ]),
    ));
  showLodging();
  showTravel();
  $("#lodgingFilter").onchange = showLodging;
  $("#travelFilter").onchange = showTravel;
  $("#exportLodging").onclick = () =>
    exportFeedbackTable("#lodgingResults", "wuerzburg-unterkunft.csv");
  $("#exportTravel").onclick = () =>
    exportFeedbackTable("#travelResults", "wuerzburg-anreise.csv");
  bindRooms();
  if (state.me.owner) {
    $("#accounts").innerHTML = state.accounts
      .map(
        (a) =>
          `<form class="accountForm"><p>${esc(a.name)} · ${a.member_id ? "zugeordnet: " + esc(name(a.member_id)) : "noch nicht zugeordnet"}</p><label>Chormitglied<select name="memberId">${state.members.map((m) => `<option value="${esc(m.id)}" ${m.id === a.member_id ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select></label><input type="hidden" name="accountId" value="${esc(a.id)}"><button>Zuordnen</button></form>`,
      )
      .join("");
    document.querySelectorAll(".accountForm").forEach(
      (f) =>
        (f.onsubmit = async (e) => {
          e.preventDefault();
          try {
            await post({
              action: "link",
              ...Object.fromEntries(new FormData(e.target)),
            });
            await load();
            toast("Konto zugeordnet");
          } catch (e) {
            toast(e.message);
          }
        }),
    );
    $("#roleMember").onchange = () => {
      $("#role").value =
        state.roles.find((r) => r.id === $("#roleMember").value)?.role ||
        "member";
    };
    $("#roleMember").onchange();
    $("#roleForm").onsubmit = async (e) => {
      e.preventDefault();
      try {
        await post({
          action: "role",
          memberId: $("#roleMember").value,
          role: $("#role").value,
        });
        await load();
        toast("Rolle gespeichert");
      } catch (e) {
        toast(e.message);
      }
    };
  }
}

function exportFeedbackTable(selector, filename) {
  const rows = [...$(selector).querySelectorAll("tr")].map((r) =>
    [...r.querySelectorAll("th,td")].map((c) => c.textContent),
  );
  if (!rows.length) {
    toast("Keine Rückmeldungen zum Exportieren");
    return;
  }
  const quote = String.fromCharCode(34);
  const cell = (x) =>
    quote +
    String(x ?? "")
      .replace(/^[=+@-]/, String.fromCharCode(39) + "$&")
      .replaceAll(quote, quote + quote) +
    quote;
  const csv = rows.map((r) => r.map(cell).join(";")).join("\r\n");
  const u = URL.createObjectURL(
    new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = u;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(u);
}
