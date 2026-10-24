/* Room display and editor. Planning changes stay in the draft until the full plan is saved. */
// Shared browser status list for planning and organizer filters; the server validates independently.
const lodgingStatuses = Object.freeze([
  "Noch offen",
  "Suche Zimmergemeinschaft",
  "Gebucht",
  "Privat organisiert",
  "Keine Unterkunft nötig",
]);

function roomCard(r) {
  return `<div class="card room-card"><span class="tag">${esc(fmt(r.arrival))} – ${esc(fmt(r.departure))}</span><h3 style="margin-top:16px">${esc(r.hotel)}</h3><p>${r.memberIds.map((x) => esc(name(x))).join(", ")}</p>${r.spaces > 0 ? `<span class="tag">${r.spaces} ${r.spaces === 1 ? "Platz" : "Plätze"} frei · Kontakt: ${esc(name(r.memberIds[0]))}</span>` : ""}${r.number !== undefined ? `<p>Zimmernummer: ${esc(r.number || "noch offen")}</p>` : ""}${r.canEdit ? `<div class="actions"><button data-room="${esc(r.id)}">Zimmer bearbeiten</button><button data-number="${esc(r.id)}">Zimmernummer ergänzen</button></div>` : ""}</div>`;
}

function bindRooms() {
  document
    .querySelectorAll("[data-room]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          roomEditor(state.rooms.find((r) => r.id === b.dataset.room))),
    );
  document.querySelectorAll("[data-number]").forEach(
    (b) =>
      (b.onclick = () => {
        const r = state.rooms.find((r) => r.id === b.dataset.number);
        modal(
          `<h2>Zimmernummer ergänzen</h2><form id="numberForm">${field("Zimmernummer (optional)", "number", r.number)}<div class="actions"><button class="primary">Speichern</button></div></form>`,
        );
        $("#numberForm").onsubmit = async (e) => {
          e.preventDefault();
          try {
            await post({
              action: "roomNumber",
              id: r.id,
              number: new FormData(e.target).get("number"),
            });
            $("#modal").close();
            await load();
            toast("Zimmernummer gespeichert");
          } catch (e) {
            toast(e.message);
          }
        };
      }),
  );
}

function roomEditor(r) {
  const staged = !!$("#planningForm");
  // All entry points reuse the person's existing entry.
  if (!r) r = staged ? planningRooms()[0] : mine()[0];
  let ids = new Set(r?.memberIds || [state.me.id]);
  const hotels = state.hotels.filter((h) => !h.archived).map((h) => h.name);
  if (r?.hotel === "IBIS") r = { ...r, hotel: "IBIS Würzburg City" };
  if (r?.hotel === "homekeepers / HomieStay")
    r = { ...r, hotel: "HomieStay / homie hotels" };
  const other = r && !hotels.includes(r.hotel);
  modal(
    `<h2>${r ? "Zimmer bearbeiten" : "Zimmer eintragen"}</h2><form id="roomForm">${select("Unterkunft", "hotel", ["Bitte auswählen", ...hotels, "Andere Unterkunft"], other ? "Andere Unterkunft" : r?.hotel)}<div id="otherWrap">${field("Name der Unterkunft", "other", other ? r.hotel : "")}</div><div class="grid"><div>${field("Anreise", "arrival", r?.arrival || cfg("eventStart"), "date")}</div><div>${field("Abreise", "departure", r?.departure || cfg("eventEnd"), "date")}</div></div><details class="optional-details" ${r?.memberIds?.length > 1 || r?.number || r?.spaces ? "open" : ""}><summary>Weitere Zimmerangaben (freiwillig)</summary><label>Wer teilt dein Zimmer?</label><button type="button" id="toggleMembers" aria-expanded="false">Mitglieder auswählen ▾</button><div id="memberPicker" hidden><input id="memberSearch" placeholder="Nach Namen suchen …" aria-label="Mitglieder suchen"><div id="memberOptions" role="group" aria-label="Zimmerpartner auswählen"></div><button type="button" id="finishMembers">Fertig</button></div><div id="selected" class="form-note"></div><p class="form-note">Ausgewählte Personen werden nach dem Speichern benachrichtigt.</p>${field("Zimmernummer (optional, auch später nachtragbar)", "number", r?.number)}${field("Freie Plätze anbieten (freiwillig)", "spaces", r?.spaces || 0, "number")}</details><div class="actions"><button class="primary">${staged ? "Zimmer übernehmen" : "Zimmer speichern"}</button></div>${staged ? '<p class="form-note">Anschließend unten die gesamte Planung speichern.</p>' : ""}</form>`,
  );
  const options = () => {
    $("#memberOptions").innerHTML = state.members
      .filter((m) =>
        m.name.toLowerCase().includes($("#memberSearch").value.toLowerCase()),
      )
      .map(
        (m) =>
          `<label class="member-option"><input type="checkbox" value="${esc(m.id)}" ${ids.has(m.id) ? "checked" : ""} ${m.id === state.me.id && !state.me.orga ? "disabled" : ""}>${esc(m.name)}</label>`,
      )
      .join("");
    $("#selected").textContent = "Im Zimmer: " + [...ids].map(name).join(", ");
    $("#memberOptions")
      .querySelectorAll("input")
      .forEach(
        (c) =>
          (c.onchange = () => {
            c.checked ? ids.add(c.value) : ids.delete(c.value);
            $("#selected").textContent =
              "Im Zimmer: " + [...ids].map(name).join(", ");
          }),
      );
  };
  options();
  $("#memberSearch").oninput = options;
  $("#toggleMembers").onclick = () => {
    const p = $("#memberPicker");
    p.hidden = !p.hidden;
    $("#toggleMembers").setAttribute("aria-expanded", String(!p.hidden));
    if (!p.hidden) $("#memberSearch").focus();
  };
  const finish = () => {
    $("#memberPicker").hidden = true;
    $("#toggleMembers").setAttribute("aria-expanded", "false");
    $("#toggleMembers").focus();
  };
  $("#finishMembers").onclick = finish;
  $("#memberPicker").onkeydown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      finish();
    }
  };
  $("#hotel").options[0].value = "";
  $("#hotel").required = true;
  $("#arrival").required = true;
  $("#departure").required = true;
  $("#memberSearch").onkeydown = (e) => {
    if (e.key === "Enter") e.preventDefault();
  };
  const otherToggle = () => {
    const other = $("#hotel").value === "Andere Unterkunft";
    $("#otherWrap").hidden = !other;
    $("#other").required = other;
  };
  $("#hotel").onchange = otherToggle;
  otherToggle();
  $("#spaces").min = 0;
  $("#spaces").max = 99;
  $("#roomForm").onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    d.hotel = d.hotel === "Andere Unterkunft" ? d.other : d.hotel;
    if (staged) {
      const room = {
        ...d,
        id: r?.id,
        draftId: r?.draftId || crypto.randomUUID(),
        memberIds: [...ids],
        spaces: Number(d.spaces || 0),
        pending: true,
      };
      planningDraft.rooms = planningDraft.rooms.filter(
        (x) => (x.id || x.draftId) !== (r?.id || r?.draftId),
      );
      planningDraft.rooms.push(room);
      $("#modal").close();
      markPlanningDirty();
      renderPlanningRooms();
      return;
    }
    try {
      await post({ action: "room", ...d, id: r?.id, memberIds: [...ids] });
      $("#modal").close();
      await load();
      toast("Zimmer gespeichert. Die Zimmerpartner wurden benachrichtigt.");
    } catch (e) {
      toast(e.message);
    }
  };
}

function rooms() {
  $("#content").innerHTML =
    '<div class="page-back-row"><a class="button" href="#together">← Zurück zu Gemeinsam unterwegs</a></div>' +
    title("", "Wer wohnt wo?", cfg("roomsIntro")) +
    `<div class="actions"><a class="button primary" href="#plan">Meine Unterkunft eintragen</a><a class="button" href="#wiki/unterkunft">Hotelangebote ansehen</a></div><input id="roomSearch" class="search" aria-label="Unterkünfte oder Mitglieder suchen" placeholder="Hotel oder Namen suchen …"><label class="member-option"><input id="freeOnly" type="checkbox">Nur Zimmer mit freien Plätzen</label><div id="roomResults"></div>`;
  const show = () => {
    const q = $("#roomSearch").value.toLowerCase();
    const rs = state.rooms.filter(
      (r) =>
        (!$("#freeOnly").checked || r.spaces > 0) &&
        (r.hotel + " " + r.memberIds.map(name).join(" "))
          .toLowerCase()
          .includes(q),
    );
    const privateStays = $("#freeOnly").checked
      ? []
      : (state.privateStays || []).filter((p) =>
          ("Privat organisiert " + p.private_place + " " + name(p.member_id))
            .toLowerCase()
            .includes(q),
        );
    const groups = [...new Set(rs.map((r) => r.hotel))];
    $("#roomResults").innerHTML = groups.length
      ? groups
          .map(
            (h) =>
              `<h2 style="margin-top:30px">${esc(h)}</h2><div class="grid">${rs
                .filter((r) => r.hotel === h)
                .map(roomCard)
                .join("")}</div>`,
          )
          .join("")
      : '<div class="empty">Noch keine passenden Zimmer. Du kannst deine Unterkunft unter „Meine Planung“ eintragen.</div>';
    if (privateStays.length)
      $("#roomResults").innerHTML =
        (groups.length ? $("#roomResults").innerHTML : "") +
        '<h2 style="margin-top:30px">Privat organisiert</h2><div class="grid">' +
        privateStays
          .map(
            (p) =>
              `<div class="card room-card"><h3>${esc(name(p.member_id))}</h3><p>${esc(p.private_place || "Ort nicht angegeben")}</p></div>`,
          )
          .join("") +
        "</div>";
    bindRooms();
  };
  show();
  $("#roomSearch").oninput = show;
  $("#freeOnly").onchange = show;
}
