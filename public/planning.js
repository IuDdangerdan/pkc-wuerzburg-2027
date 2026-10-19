/* Gemeinsamer Entwurf für Anreise und Unterkunft. Session-Speicherung ist pro Mitglied und Vorschau getrennt.
 * Erst action=planning speichert beide Bereiche und Zimmer atomar auf dem Server. */
let planningDraft = null,
  planningDirty = false,
  activeHash = location.hash || "#wiki/start";

const planningKey = () =>
  `pkc-planning-draft:${state.me.id}:${state.me.preview ? "preview" : "member"}`;

function rememberPlanning() {
  if (!$("#planningForm")) return;
  const values = Object.fromEntries(new FormData($("#planningForm")));
  planningDraft = {
    ...planningDraft,
    values,
    rooms: planningDraft?.rooms || [],
  };
  if (planningDirty)
    try {
      sessionStorage.setItem(planningKey(), JSON.stringify(planningDraft));
    } catch {
      // Gesperrter Browser-Speicher darf das Bearbeiten im aktuellen Tab nicht verhindern.
    }
}

function markPlanningDirty() {
  planningDirty = true;
  rememberPlanning();
  if ($("#planningSaveState")) {
    $("#planningSaveState").textContent = "Ungespeicherte Änderungen";
    $("#planningSaveState").classList.remove("saved");
  }
  if ($("#savePlanning")) $("#savePlanning").textContent = "Planung speichern";
}

function readPlanningDraft() {
  if (planningDraft && planningDirty) return planningDraft;
  // Ein unveränderter Formular-Snapshot darf frisch geladene Zuordnungen nicht verdecken.
  planningDraft = null;
  try {
    const saved = JSON.parse(sessionStorage.getItem(planningKey()) || "null");
    if (saved?.values && Array.isArray(saved.rooms)) {
      planningDirty = true;
      return (planningDraft = saved);
    }
  } catch {
    // Defekte oder alte Entwürfe ignorieren; gespeicherte Serverdaten bleiben die Grundlage.
  }
  return null;
}

function planningRooms() {
  const drafts = planningDraft?.rooms || [];
  return [
    ...mine().filter((r) => !drafts.some((d) => d.id === r.id)),
    ...drafts,
  ];
}

function handleRouteChange() {
  const nextHash = location.hash || "#wiki/start";
  if (activeHash === "#plan" && planningDirty && nextHash !== "#plan") {
    if (
      !window.confirm(
        "Deine Planung ist noch nicht gespeichert. Seite trotzdem verlassen? Dein Entwurf bleibt in diesem Browser erhalten.",
      )
    ) {
      window.history.replaceState(null, "", "#plan");
      return;
    }
  }
  const changed = nextHash !== activeHash;
  activeHash = nextHash;
  render();
  // Beim erneuten Aufrufen auch Änderungen durch andere Mitglieder holen.
  // Echte ungespeicherte Entwürfe bleiben dabei unangetastet.
  if (
    changed &&
    nextHash === "#plan" &&
    !planningDirty &&
    typeof load === "function"
  )
    load().catch((error) => toast(error.message));
  if (changed) {
    const top = () => {
      if (activeHash === nextHash)
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    };
    top();
    window.requestAnimationFrame(top);
  }
}

// Hash routes replace page content; browser history must not restore the previous page's offset.
if ("scrollRestoration" in window.history)
  window.history.scrollRestoration = "manual";

window.addEventListener("beforeunload", (e) => {
  if (planningDirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});

function renderPlanning() {
  const saved = state.plans.find((p) => p.member_id === state.me.id) || {},
    draft = readPlanningDraft();
  const p = draft?.values || saved;
  if (!planningDraft) planningDraft = { values: { ...saved }, rooms: [] };
  $("#content").innerHTML =
    title("DEIN WOCHENENDE", "Meine Planung", cfg("planIntro")) +
    `<form id="planningForm"><section class="card form plan-section" id="planTravel"><h2>Anreise</h2>${select("Wie möchtest du reisen?", "mode", ["Noch offen", "Bus", "Bahn", "Auto", "Andere"], p.mode)}<div id="carOptions">${select("Fährst du selbst oder möchtest du mitfahren?", "car_role", ["Bitte auswählen", "Ich fahre selbst", "Ich möchte mitfahren"], p.car_role)}<div id="carSeatsWrap">${field("Mitfahrerplätze insgesamt (ohne dich)", "car_capacity", p.car_capacity ?? "", "number")}<p class="form-note">Alle Plätze zählen – auch die schon belegten. Beispiel: 4 Plätze insgesamt, davon 2 belegt.</p>${saved.car_role === "Ich fahre selbst" && saved.car_capacity == null ? '<p class="form-note">Bisher wurden freie Plätze abgefragt. Bitte trage die Gesamtzahl neu ein.</p>' : ""}<label for="passengersToggle">Wer fährt schon bei dir mit? (optional)</label><input type="hidden" name="car_passengers_before" value="${esc(JSON.stringify(saved.car_passengers || []))}"><input type="hidden" name="car_passengers" id="car_passengers" value="${esc(typeof p.car_passengers === "string" ? p.car_passengers : JSON.stringify(p.car_passengers || []))}"><button type="button" id="passengersToggle" aria-expanded="false" aria-controls="passengersPicker">Personen auswählen ▾</button><div id="passengersPicker" hidden><input type="search" id="passengersSearch" placeholder="Nach Namen suchen …" aria-label="Mitfahrer suchen"><div id="passengersOptions"></div><button type="button" id="finishPassengers">Fertig</button></div><p id="carOccupancy" class="form-note" role="status"></p><p class="form-note">Beim Speichern wird bei diesen Personen „Auto · Mitfahrt bei dir“ eingetragen. Eine bisherige Zuordnung wird ersetzt. Betroffene Personen und bisherige Fahrer werden benachrichtigt. Bisherige Selbstfahrer werden zu Mitfahrern; ihre bisherigen Mitfahrer bekommen wieder eine offene Fahrerwahl.</p></div><div id="carPassengerWrap"><label for="driverToggle">Bei wem fährst du mit? (optional)</label><input type="hidden" name="car_driver" id="car_driver" value="${esc(p.car_driver || "")}"><button type="button" id="driverToggle" aria-expanded="false" aria-controls="driverPicker">${esc(p.car_driver ? name(p.car_driver) : "Noch offen – Person auswählen")} ▾</button><div id="driverPicker" hidden><input type="search" id="driverSearch" placeholder="Nach Namen suchen …" aria-label="Fahrer suchen"><div id="driverOptions"></div></div></div></div>${busDeadlineNote(false)}${select("Interesse am gemeinsamen Bus? (unverbindlich)", "bus", ["Noch offen", "Ja", "Vielleicht, je nach Preis", "Nein"], p.bus)}<details class="optional-details" ${p.budget ? "open" : ""}><summary>Preisrahmen angeben (optional)</summary>${field("Maximaler Buspreis für Hin- und Rückfahrt (€)", "budget", p.budget, "number")}</details></section><section class="card form plan-section" id="planLodging"><h2>Unterkunft</h2><p class="form-note">Hotels, Preise und Buchungsinfos findest du in unserer Unterkunftsübersicht.</p><a class="button" href="#wiki/unterkunft">Unterkünfte ansehen →</a>${select("Dein Unterkunftsstatus", "status", lodgingStatuses, p.status)}<div id="privateStay">${field("Wo übernachtest du? (optional)", "private_place", p.private_place)}<p class="form-note">Privat organisiert reicht als Angabe. Wenn du einen Ort einträgst, sehen ihn die Chormitglieder unter „Wer wohnt wo?“.</p></div><p id="leaveRoomNote" class="form-note" hidden>Beim Speichern verlässt du deine bisherige Zimmergemeinschaft. Die anderen Bewohner bleiben eingetragen und werden benachrichtigt.</p><div class="plan-rooms"><div id="planningRooms"></div><button type="button" id="addRoom">+ Unterkunft eintragen</button><p class="form-note">Alle buchen selbst. Die Unterkunftsangaben sehen Mitglieder; Zimmernummern nur eure Zimmergemeinschaft und die Orga.</p></div></section><div class="card form planning-finish"><button id="savePlanning" type="submit" class="primary">Planung speichern</button><p id="planningSaveState" class="save-state ${!planningDirty && saved.updated ? "saved" : ""}" role="status" tabindex="-1">${planningDirty ? "Ungespeicherte Änderungen" : saved.updated ? "Deine Planung ist gespeichert." : "Noch keine Planung gespeichert."}</p><p class="form-note">Speichert Anreise, Unterkunftsstatus und übernommene Zimmerangaben zusammen.</p></div></form>`;
  const carToggle = () => {
    const car = $("#mode").value === "Auto",
      driver = car && $("#car_role").value === "Ich fahre selbst",
      passenger = car && $("#car_role").value === "Ich möchte mitfahren";
    $("#carOptions").hidden = !car;
    $("#car_role").disabled = !car;
    $("#car_role").required = car;
    $("#carSeatsWrap").hidden = !driver;
    $("#car_capacity").disabled = !driver;
    $("#car_passengers").disabled = !driver;
    $("#car_capacity").required = driver;
    $("#carPassengerWrap").hidden = !passenger;
    $("#car_driver").disabled = !passenger;
  };
  $("#car_role").options[0].value = "";
  $("#car_capacity").min = 0;
  $("#car_capacity").max = 99;
  $("#car_capacity").step = 1;
  $("#budget").min = 0;
  $("#mode").onchange = carToggle;
  $("#car_role").onchange = carToggle;
  carToggle();
  bindDriverPicker();
  bindPassengerPicker();
  const lodgingToggle = () => {
    const status = $("#status").value;
    $(".plan-rooms").hidden = status !== "Gebucht";
    $("#privateStay").hidden = status !== "Privat organisiert";
    $("#private_place").disabled = status !== "Privat organisiert";
    $("#private_place").maxLength = 200;
    $("#leaveRoomNote").hidden =
      !mine().length ||
      !["Privat organisiert", "Keine Unterkunft nötig"].includes(status);
  };
  $("#status").onchange = lodgingToggle;
  lodgingToggle();
  $("#planningForm").oninput = (e) => {
    if (e.target.name) markPlanningDirty();
  };
  $("#planningForm").onchange = (e) => {
    if (e.target.name) markPlanningDirty();
  };
  $("#planningForm").onsubmit = savePlanning;
  $("#addRoom").onclick = () => {
    rememberPlanning();
    roomEditor(planningRooms()[0]);
  };
  renderPlanningRooms();
}

function renderPlanningRooms() {
  // Kein zweiter Eintrag: vorhandene Unterkunft bearbeiten statt weitere hinzufügen.
  $("#addRoom").hidden = planningRooms().length > 0;
  $("#planningRooms").innerHTML = planningRooms()
    .map(
      (r) =>
        `<div class="planning-room"><strong>${esc(r.hotel)}</strong><p>${esc(fmt(r.arrival))} – ${esc(fmt(r.departure))}</p>${r.memberIds?.length > 1 ? "<p>" + r.memberIds.map((id) => esc(name(id))).join(", ") + "</p>" : ""}${r.number ? "<p>Zimmernummer: " + esc(r.number) + "</p>" : ""}${r.spaces > 0 ? "<p>" + esc(r.spaces) + " freie Plätze</p>" : ""}${r.pending ? '<p class="form-note">Übernommen · noch nicht gespeichert</p>' : ""}<button type="button" data-plan-room="${esc(r.id || r.draftId)}">Bearbeiten</button></div>`,
    )
    .join("");
  document.querySelectorAll("[data-plan-room]").forEach(
    (b) =>
      (b.onclick = () => {
        rememberPlanning();
        roomEditor(
          planningRooms().find(
            (r) => (r.id || r.draftId) === b.dataset.planRoom,
          ),
        );
      }),
  );
}

async function savePlanning(e) {
  e.preventDefault();
  rememberPlanning();
  const controls = [...e.target.elements].map((node) => ({
    node,
    disabled: node.disabled,
  }));
  controls.forEach(({ node }) => (node.disabled = true));
  $("#planningSaveState").textContent = "Wird gespeichert …";
  try {
    await post({
      action: "planning",
      ...planningDraft.values,
      rooms:
        planningDraft.values.status === "Gebucht"
          ? planningDraft.rooms.map(
              ({
                id,
                hotel,
                arrival,
                departure,
                number,
                spaces,
                memberIds,
              }) => ({
                id,
                hotel,
                arrival,
                departure,
                number,
                spaces,
                memberIds,
              }),
            )
          : [],
    });
    planningDirty = false;
    planningDraft = null;
    try {
      sessionStorage.removeItem(planningKey());
    } catch {}
    try {
      await load();
    } catch {
      $("#content").innerHTML =
        title(
          "MEINE PLANUNG",
          "Deine Planung ist gespeichert.",
          "Die Ansicht konnte noch nicht aktualisiert werden.",
        ) +
        '<button type="button" onclick="location.reload()">Ansicht neu laden</button>';
      return;
    }
    if ($("#planningSaveState")) {
      $("#planningSaveState").textContent = "Deine Planung ist gespeichert.";
      $("#planningSaveState").classList.add("saved");
      $("#planningSaveState").focus({ preventScroll: true });
    }
    toast("Planung gespeichert");
  } catch (error) {
    if ($("#planningSaveState"))
      $("#planningSaveState").textContent = error.message;
    controls.forEach(({ node, disabled }) => (node.disabled = disabled));
  }
}
