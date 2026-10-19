/* Kontaktformular und Fragenpostfach. Sichtbarkeit wird zusätzlich auf dem Server geprüft. */
function questionMessages() {
  return (
    (state.questions || [])
      .map(
        (q) =>
          `<div class="update"><small>${esc(fmt(q.created))}${state.me.orga ? " · " + esc(name(q.member_id)) : ""}</small><p style="white-space:pre-wrap">${esc(q.body)}</p></div>`,
      )
      .join("") ||
    `<p class="form-note">${state.me.orga ? "Noch keine Fragen eingegangen." : "Du hast noch keine Frage gesendet."}</p>`
  );
}

function questionSection() {
  return `<section class="card form" style="margin-top:24px"><h2>Noch eine Frage?</h2><p>${esc(cfg("questionIntro").replaceAll("{contact}", cfg("contactName")))} ${cfg("whatsappNumber") ? cmsLinkHTML("WhatsApp an " + cfg("contactName"), "https://wa.me/" + cfg("whatsappNumber"), "") : ""}</p><p class="form-note">${esc(cfg("questionPrivacy"))}</p><form id="questionForm"><label for="questionText">Deine Frage an die Website-Orga</label><textarea id="questionText" name="text" required maxlength="3000" rows="3"></textarea><div class="actions"><button class="primary">Frage senden</button></div><p id="questionStatus" role="status"></p></form></section><section class="card" style="margin-top:24px"><h2>${state.me.orga ? "Posteingang · Fragen an die Website-Orga" : "Deine gesendeten Fragen"}</h2>${questionMessages()}</section>`;
}

function bindQuestions() {
  $("#questionForm").onsubmit = async (e) => {
    e.preventDefault();
    const button = e.target.querySelector("button");
    button.disabled = true;
    try {
      await post({ action: "question", text: $("#questionText").value });
      await load();
      $("#questionStatus").textContent =
        "Deine Frage wurde an die Website-Orga gesendet.";
      toast("Frage gesendet");
    } catch (error) {
      $("#questionStatus").textContent = error.message;
      button.disabled = false;
    }
  };
}
