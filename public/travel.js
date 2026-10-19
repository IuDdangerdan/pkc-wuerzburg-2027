/* Gemeinsame Anreise, Fahrerauswahl und Busfrist. */
function travel() {
  $("#content").innerHTML =
    '<div class="page-back-row"><a class="button" href="#together">← Zurück zu Gemeinsam unterwegs</a></div>' +
    title("", cfg("travelTitle"), cfg("travelIntro")) +
    `<div class="grid"><div class="card"><span class="tag">${esc(cfg("travelBusTag"))}</span><h2 style="margin-top:18px">${esc(cfg("travelBusTitle"))}</h2>${busDeadlineNote(false)}<p>${esc(cfg("travelBusText"))}</p><a class="button primary" href="#plan">Businteresse angeben</a></div><div class="card"><h2>${esc(cfg("travelOtherTitle"))}</h2><p>${esc(cfg("travelOtherText"))}</p><a class="button" href="#wiki/anreise">Infos zur Anreise →</a></div></div>`;
}

function bindDriverPicker() {
  const show = () => {
    const q = $("#driverSearch").value.trim().toLocaleLowerCase("de");
    const members = state.members.filter(
      (m) => m.id !== state.me.id && m.name.toLocaleLowerCase("de").includes(q),
    );
    $("#driverOptions").innerHTML =
      '<button type="button" data-driver="">Noch offen / Auswahl entfernen</button>' +
      members
        .map(
          (m) =>
            `<button type="button" data-driver="${esc(m.id)}" aria-pressed="${m.id === $("#car_driver").value}">${esc(m.name)}</button>`,
        )
        .join("") +
      (members.length ? "" : '<p class="form-note">Keine Person gefunden.</p>');
    $("#driverOptions")
      .querySelectorAll("[data-driver]")
      .forEach(
        (b) =>
          (b.onclick = () => {
            $("#car_driver").value = b.dataset.driver;
            $("#driverToggle").textContent =
              (b.dataset.driver
                ? name(b.dataset.driver)
                : "Noch offen – Person auswählen") + " ▾";
            $("#driverPicker").hidden = true;
            $("#driverToggle").setAttribute("aria-expanded", "false");
            $("#driverToggle").focus();
            if ($("#planningForm")) markPlanningDirty();
          }),
      );
  };
  $("#driverToggle").onclick = () => {
    const picker = $("#driverPicker");
    picker.hidden = !picker.hidden;
    $("#driverToggle").setAttribute("aria-expanded", String(!picker.hidden));
    if (!picker.hidden) {
      $("#driverSearch").value = "";
      show();
      $("#driverSearch").focus();
    }
  };
  $("#driverSearch").oninput = show;
  $("#driverSearch").onkeydown = (e) => {
    if (e.key === "Enter") e.preventDefault();
    if (e.key === "Escape") {
      $("#driverPicker").hidden = true;
      $("#driverToggle").setAttribute("aria-expanded", "false");
      $("#driverToggle").focus();
    }
  };
  show();
}

function busDeadlineNote(withLink) {
  return cfg("busDeadline")
    ? `<p class="bus-deadline"><strong>Businteresse: Rückmeldung bis ${esc(fmt(cfg("busDeadline")))}.</strong> ${esc(cfg("busDeadlineText"))}${withLink ? ' <a href="#plan">Businteresse eintragen →</a>' : ""}</p>`
    : "";
}

// Mehrfachauswahl bleibt im gemeinsamen Entwurf; erst Speichern verändert andere Planungen.
function bindPassengerPicker() {
  const selected = new Set(JSON.parse($("#car_passengers").value || "[]"));
  const button = $("#passengersToggle");
  const occupancy = () => {
    const raw = $("#car_capacity").value;
    const capacity = Number(raw);
    const available = capacity - selected.size;
    $("#carOccupancy").textContent =
      raw === ""
        ? `${selected.size} Personen ausgewählt.`
        : available < 0
          ? "Mehr Personen ausgewählt als Plätze vorhanden."
          : `${capacity} Plätze insgesamt · ${selected.size} belegt · ${available} frei`;
    $("#car_capacity").setCustomValidity?.(
      raw !== "" && available < 0
        ? "Bitte mindestens so viele Plätze wie Mitfahrende angeben."
        : "",
    );
    button.textContent =
      (selected.size
        ? [...selected].map(name).join(", ")
        : "Personen auswählen") + " ▾";
  };
  const close = () => {
    $("#passengersPicker").hidden = true;
    button.setAttribute("aria-expanded", "false");
    button.focus();
  };
  const show = () => {
    const q = $("#passengersSearch").value.trim().toLocaleLowerCase("de");
    const matches = state.members.filter(
      (m) => m.id !== state.me.id && m.name.toLocaleLowerCase("de").includes(q),
    );
    $("#passengersOptions").innerHTML =
      matches
        .map(
          (m) =>
            `<label class="member-option"><input type="checkbox" value="${esc(m.id)}" ${selected.has(m.id) ? "checked" : ""}><span>${esc(m.name)}</span></label>`,
        )
        .join("") || '<p class="form-note">Keine Person gefunden.</p>';
    $("#passengersOptions")
      .querySelectorAll("input")
      .forEach(
        (input) =>
          (input.onchange = () => {
            input.checked
              ? selected.add(input.value)
              : selected.delete(input.value);
            $("#car_passengers").value = JSON.stringify([...selected]);
            occupancy();
            markPlanningDirty();
          }),
      );
  };
  button.onclick = () => {
    const picker = $("#passengersPicker");
    picker.hidden = !picker.hidden;
    button.setAttribute("aria-expanded", String(!picker.hidden));
    if (!picker.hidden) {
      $("#passengersSearch").value = "";
      show();
      $("#passengersSearch").focus();
    }
  };
  $("#passengersSearch").oninput = show;
  $("#passengersPicker").onkeydown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
    if (e.key === "Enter" && e.target.id === "passengersSearch")
      e.preventDefault();
  };
  $("#finishPassengers").onclick = close;
  $("#car_capacity").oninput = occupancy;
  occupancy();
}
