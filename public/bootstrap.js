/* Einziger Einstieg: Alle Skripte in app/page.tsx müssen vorher geladen sein.
 * Tests laden nur Definitionen und starten weder Netzwerk noch Seiteninitialisierung. */
window.addEventListener("hashchange", handleRouteChange);

load().catch((e) => {
  $("#content").innerHTML =
    '<div class="card"><h2>Seite konnte nicht geladen werden</h2><p>' +
    esc(e.message) +
    '</p><button onclick="location.reload()">Erneut versuchen</button></div>';
});
