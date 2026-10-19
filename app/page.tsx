import { requireChatGPTUser } from "./chatgpt-auth";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requireChatGPTUser("/");
  return (
    <>
      <header>
        <a href="#wiki/start" className="brand">
          PK<span>C</span> <small>Zusammen unterwegs.</small>
        </a>
        <div>
          <span id="identity" />
          <button id="viewMode" hidden type="button" />{" "}
          <button
            id="theme"
            type="button"
            aria-label="Dunkelmodus einschalten"
            aria-pressed="false"
          >
            ◐
          </button>
        </div>
      </header>
      <div className="shell">
        <aside>
          <div className="festival">
            UNSER FESTIVAL-WIKI
            <strong>
              Würzburg
              <br />
              2027<span>↗</span>
            </strong>
            <p>04.–06. Juni · Posthalle</p>
          </div>
          <div className="mobile-navigation-bar">
            <button
              id="mobileMenuToggle"
              type="button"
              aria-expanded="false"
              aria-controls="nav"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span id="mobileMenuAction">Menü</span>
              <span
                id="mobileUnread"
                className="unread-dot"
                aria-label="Neue Benachrichtigungen"
                hidden
              />
            </button>
            <span id="mobileCurrentPage" aria-live="polite">
              Übersicht
            </span>
          </div>
          <nav id="nav" aria-label="Hauptnavigation" />
          <div className="aside-bottom">
            Potsdamer Kneipenchor
            <br />
            <small>Ein Wochenende. Viele gute Stimmen.</small>
          </div>
        </aside>
        <main>
          <div id="previewNotice" role="status" hidden />
          <div className="notice">
            Eigenständige Festival-Seite · Anmeldung über ChatGPT · Keine
            Synchronisation mit der PKC-App.
          </div>
          <div id="content">Festival-Wiki wird geladen …</div>
        </main>
      </div>
      <div id="toast" role="status" />
      <dialog id="modal" />
      <script src="/theme.js?v=structure-1" defer />
      <script src="/app.js?v=structure-1" defer />
      <script src="/wiki.js?v=structure-1" defer />
      <script src="/cms.js?v=structure-1" defer />
      <script src="/lodging.js?v=structure-1" defer />
      <script src="/travel.js?v=structure-1" defer />
      <script src="/questions.js?v=structure-1" defer />
      <script src="/news.js?v=structure-1" defer />
      <script src="/orga.js?v=structure-1" defer />
      <script src="/planning.js?v=structure-1" defer />
      <script src="/navigation.js?v=structure-1" defer />
      <script src="/pages.js?v=structure-1" defer />
      <script src="/notifications.js?v=structure-1" defer />
      <script src="/bootstrap.js?v=structure-1" defer />
    </>
  );
}
