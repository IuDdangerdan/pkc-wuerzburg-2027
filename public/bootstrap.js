/* Single entry point: all scripts in app/page.tsx must load first.
 * Tests load definitions only, without network requests or page initialization. */
window.addEventListener("hashchange", handleRouteChange);

load().catch((e) => {
  $("#content").innerHTML =
    '<div class="card"><h2>Seite konnte nicht geladen werden</h2><p>' +
    esc(e.message) +
    '</p><button onclick="location.reload()">Erneut versuchen</button></div>';
});
