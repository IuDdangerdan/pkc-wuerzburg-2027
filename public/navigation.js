/* Navigationssymbole und responsives Menü. hidden und display sichern die Sichtbarkeit auch gegen geerbte CSS-Regeln. */
function navIcon(name) {
  const shapes = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-8h6v8"/>',
    plan: '<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 3h6v4H9zM9 12h6M9 16h4"/>',
    rooms:
      '<path d="M3 18v3m18-3v3M3 11v7h18v-7M3 14h18"/><path d="M5 11V5h14v6M7 11V8h4v3m2 0V8h4v3"/>',
    travel:
      '<rect x="5" y="3" width="14" height="17" rx="3"/><path d="M5 11h14M9 3v8m6-8v8M8 16h.01M16 16h.01M7 20v2m10-2v2"/>',
    notifications:
      '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    admin:
      '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    book: '<path d="M4 3h6a3 3 0 0 1 2 1 3 3 0 0 1 2-1h6v17h-6a3 3 0 0 0-2 1 3 3 0 0 0-2-1H4Z"/><path d="M12 4v17"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    question:
      '<path d="M5 19 3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2Z"/><path d="M9.5 8a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 3h.01"/>',
    edit: '<path d="m14 5 5 5M4 20l5-1L20 8a3.5 3.5 0 0 0-5-5L4 14Z"/>',
    people:
      '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6m1 5a5 5 0 0 1 3 5"/>',
    calendar:
      '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2m-8 3h2"/>',
    cost: '<circle cx="12" cy="12" r="9"/><path d="M16 7a5 5 0 1 0 0 10M6 10h8M6 14h7"/>',
    music:
      '<path d="M9 18V5l12-2v13M9 8l12-2"/><ellipse cx="6" cy="18" rx="3" ry="3"/><ellipse cx="18" cy="16" rx="3" ry="3"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  };
  return (
    '<svg class="nav-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    (shapes[name] || shapes.book) +
    "</svg>"
  );
}
const mobileNavigationMedia = window.matchMedia("(max-width:850px)");

function syncMobileMenu() {
  const nav = document.querySelector("#nav");
  if (!nav) return;
  const closed =
    mobileNavigationMedia.matches &&
    nav.getAttribute("data-mobile-open") !== "true";
  nav.hidden = closed;
  nav.style.display = closed ? "none" : "";
}

mobileNavigationMedia.addEventListener("change", syncMobileMenu);

function renderNavigation(route) {
  const current =
    route === "rooms" || route === "travel"
      ? "together"
      : (route.startsWith("wiki/") && route !== "wiki/start") ||
          route === "festival"
        ? "festival"
        : route;
  const link = (r, label, icon) =>
    `<a href="#${r}" ${current === r ? 'class="active" aria-current="page"' : ""}>${navIcon(icon)}<span>${esc(label)}</span></a>`;
  $("#nav").innerHTML = `<div class="main-navigation">${[
    ["wiki/start", "Übersicht", "home"],
    ["plan", "Meine Planung", "plan"],
    ["together", "Gemeinsam unterwegs", "people"],
    ["festival", "Festivalinfos", "info"],
  ]
    .map((x) => link(...x))
    .join(
      "",
    )}</div><div class="utility-navigation">${link("notifications", "Benachrichtigungen", "notifications")}${link("wiki/faq", "Fragen & Kontakt", "question")}${state.me.orga ? link("admin", "Orga-Übersicht", "admin") + link("manage", "Inhalte verwalten", "edit") : ""}</div>`;
  if (state.notifications.some((n) => !n.seen))
    $('#nav a[href="#notifications"]').innerHTML +=
      '<span class="unread-dot" aria-label="Ungelesene Benachrichtigungen"></span>';
  const labels = {
    "wiki/start": "Übersicht",
    plan: "Meine Planung",
    together: "Gemeinsam unterwegs",
    rooms: "Wer wohnt wo?",
    travel: "Gemeinsam anreisen",
    festival: "Festivalinfos",
    notifications: "Benachrichtigungen",
    "wiki/faq": "Fragen & Kontakt",
    admin: "Orga-Übersicht",
    manage: "Inhalte verwalten",
  };
  $("#mobileCurrentPage").textContent =
    labels[route] ||
    (route.startsWith("edit/")
      ? "Seite bearbeiten"
      : route.startsWith("manage/")
        ? "Inhalte verwalten"
        : state.pages.find((p) => "wiki/" + p.id === route)?.title) ||
    "Festivalinfos";
  let open = false;
  const button = $("#mobileMenuToggle"),
    nav = $("#nav");
  const toggle = (show) => {
    open = show;
    button.setAttribute("aria-expanded", String(show));
    nav.setAttribute("data-mobile-open", String(show));
    syncMobileMenu();
    $("#mobileMenuAction").textContent = show ? "Schließen" : "Menü";
  };
  toggle(false);
  button.onclick = () => toggle(!open);
  $("#mobileUnread").hidden = !state.notifications.some((n) => !n.seen);
  const closeOnEscape = (e) => {
    if (e.key === "Escape" && open) {
      e.preventDefault();
      toggle(false);
      button.focus();
    }
  };
  nav.onkeydown = closeOnEscape;
  button.onkeydown = closeOnEscape;
  nav.onclick = (e) => {
    const link = e.target.closest("a[href]");
    if (
      link &&
      link.getAttribute("href") === (location.hash || "#wiki/start")
    ) {
      toggle(false);
      button.focus();
    }
  };
}
