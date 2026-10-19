/* Lesestatus nach bestätigter Speicherung aktualisieren, nur für konkrete Einträge. */
let notificationObserver = null;
const notificationReadTimers = new Map(),
  pendingNotificationReads = new Set();
function stopNotificationReading() {
  notificationObserver?.disconnect();
  notificationObserver = null;
  for (const timer of notificationReadTimers.values()) clearTimeout(timer);
  notificationReadTimers.clear();
}
function updateNotificationIndicators() {
  const unread = state.notifications.some((n) => !n.seen);
  const dot = document.querySelector(
    '#nav a[href="#notifications"] .unread-dot',
  );
  if (dot) dot.hidden = !unread;
  const mobile = document.querySelector("#mobileUnread");
  if (mobile) mobile.hidden = !unread;
}
function refreshNotificationReadUI() {
  updateNotificationIndicators();
  if ((location.hash || "#wiki/start") !== "#notifications") return;
  const unread = state.notifications.filter((n) => !n.seen).length;
  const count = document.querySelector("#notificationCount");
  if (count)
    count.textContent = unread ? `${unread} ungelesen` : "Alle gelesen";
  const all = document.querySelector("#readAllNotifications");
  if (all) all.hidden = !unread;
  document.querySelectorAll("[data-notification-id]").forEach((card) => {
    const n = state.notifications.find(
      (n) => n.id === card.dataset.notificationId,
    );
    if (!n) return;
    card.classList.toggle("notification-unread", !n.seen);
    const badge = card.querySelector(".notification-read-label");
    if (badge) badge.textContent = n.seen ? "Gelesen" : "Neu";
    const button = card.querySelector("[data-read-notification]");
    if (button) button.hidden = !!n.seen;
    if (n.seen) notificationObserver?.unobserve(card);
  });
}
async function markNotificationsRead(ids) {
  if (state.me.preview) return;
  const memberId = state.me.id;
  const selected = [...new Set(ids)].filter(
    (id) =>
      state.notifications.some((n) => n.id === id && !n.seen) &&
      !pendingNotificationReads.has(id),
  );
  if (!selected.length) return;
  selected.forEach((id) => pendingNotificationReads.add(id));
  try {
    for (let at = 0; at < selected.length; at += 100) {
      const batch = selected.slice(at, at + 100);
      await post({ action: "seen", ids: batch });
      if (state.me.id !== memberId || state.me.preview) return;
      for (const n of state.notifications) if (batch.includes(n.id)) n.seen = 1;
      refreshNotificationReadUI();
    }
    const status = document.querySelector("#notificationReadStatus");
    if (status) status.textContent = "Lesestatus gespeichert.";
  } catch (error) {
    if (state.me.id === memberId) {
      const status = document.querySelector("#notificationReadStatus");
      if (status)
        status.textContent =
          "Lesestatus konnte nicht gespeichert werden. Bitte erneut versuchen.";
    }
  } finally {
    selected.forEach((id) => pendingNotificationReads.delete(id));
  }
}
function watchVisibleNotifications() {
  if (state.me.preview || typeof IntersectionObserver !== "function") return;
  notificationObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = entry.target.dataset.notificationId;
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.6;
        if (!visible) {
          clearTimeout(notificationReadTimers.get(id));
          notificationReadTimers.delete(id);
          continue;
        }
        if (notificationReadTimers.has(id)) continue;
        const timer = setTimeout(() => {
          notificationReadTimers.delete(id);
          if (
            document.visibilityState !== "hidden" &&
            location.hash === "#notifications"
          )
            markNotificationsRead([id]);
        }, 800);
        notificationReadTimers.set(id, timer);
      }
    },
    { threshold: [0, 0.6] },
  );
  document.querySelectorAll("[data-notification-id]").forEach((card) => {
    if (
      state.notifications.some(
        (n) => n.id === card.dataset.notificationId && !n.seen,
      )
    )
      notificationObserver.observe(card);
  });
}
function renderNotifications() {
  stopNotificationReading();
  const target = (n) =>
    n.message.startsWith("Neue Neuigkeit:")
      ? ["#wiki/start", "Zu den Neuigkeiten →"]
      : n.message.includes("Frage zum Festival")
        ? ["#admin", "Zum Fragen-Posteingang →"]
        : ["#plan", "Meine Planung →"];
  const unread = state.notifications.filter((n) => !n.seen).length;
  $("#content").innerHTML =
    title(
      "DEINE BENACHRICHTIGUNGEN",
      "Benachrichtigungen",
      "Hinweise zu Neuigkeiten und Änderungen an deiner Zimmergemeinschaft.",
    ) +
    (state.notifications.length
      ? `<div class="notification-toolbar"><p id="notificationCount">${unread ? unread + " ungelesen" : "Alle gelesen"}</p>${!state.me.preview ? `<button id="readAllNotifications" type="button" ${unread ? "" : "hidden"}>Alle als gelesen markieren</button>` : ""}</div><p class="form-note">${state.me.preview ? "In der Mitglieder-Vorschau bleibt der Lesestatus unverändert." : "Sichtbare Einträge werden als gelesen markiert. Du kannst den Status auch über die Buttons setzen."}</p><p id="notificationReadStatus" class="form-note" role="status"></p>` +
        state.notifications
          .map((n) => {
            const [url, label] = target(n);
            return `<section class="card update notification-card ${n.seen ? "" : "notification-unread"}" data-notification-id="${esc(n.id)}"><div class="notification-heading"><small>${esc(fmt(n.created))}</small><span class="notification-read-label">${n.seen ? "Gelesen" : "Neu"}</span></div><p>${esc(n.message)}</p><div class="notification-actions"><a href="${url}">${label}</a>${!state.me.preview ? `<button type="button" data-read-notification="${esc(n.id)}" ${n.seen ? "hidden" : ""}>Als gelesen markieren</button>` : ""}</div></section>`;
          })
          .join("")
      : '<div class="empty">Noch keine Benachrichtigungen. Neuigkeiten und Änderungen an deiner Zimmergemeinschaft erscheinen hier.</div>');
  const all = document.querySelector("#readAllNotifications");
  if (all)
    all.onclick = () =>
      markNotificationsRead(
        state.notifications.filter((n) => !n.seen).map((n) => n.id),
      );
  document
    .querySelectorAll("[data-read-notification]")
    .forEach(
      (button) =>
        (button.onclick = () =>
          markNotificationsRead([button.dataset.readNotification])),
    );
  watchVisibleNotifications();
}
