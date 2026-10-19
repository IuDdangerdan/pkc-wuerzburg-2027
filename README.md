# PKC · Würzburg 2027

**GitHub-Übergabekopie:** Bitte zuerst [UEBERGABE.md](UEBERGABE.md) lesen. Diese Kopie ist nicht mit dem bestehenden Sites-Repository oder dessen Veröffentlichung verbunden.

Eigenständiges Festival-Wiki mit Planung, Zimmergemeinschaften und Orga-Verwaltung. Daten liegen zentral in D1, hochgeladene Dateien in R2. Die bestehende PKC-App wird nicht verändert.

**Für Martin:** [Stand, Grenzen und offene PKC-Integration](MARTIN_INTEGRATION.md). Anmeldung, Mitglieder, Rollen und Mailversand müssen später an die PKC-App angebunden werden.

## Feedback und Usability

[Feedback-Auswertung vom 19.10.2026 (Excel)](docs/usability/PKC_Usability_Auswertung_2026-10-19.xlsx) enthält die Auswertung der Website- und WhatsApp-Rückmeldungen aus der ersten Testrunde. Sie dokumentiert die damaligen Befunde; die später umgesetzten Änderungen stehen in `MARTIN_INTEGRATION.md`. Die Auswertung ist kein aktueller Test des überarbeiteten Stands.

## Orientierung im Code

| Datei | Zuständigkeit |
| --- | --- |
| `app/page.tsx`, `app/layout.tsx` | Authentifiziertes Grundgerüst und Ladefolge der Skripte/Styles |
| `public/app.js` | Gemeinsamer Zustand `state`, DOM-Helfer, API-Zugriff und Seitenverteilung |
| `public/bootstrap.js` | Einziger Einstieg: Hash-Wechsel abonnieren und Daten laden |
| `public/planning.js` | Entwurf, gemeinsame Speicherung von Anreise/Unterkunft, Schutz vor versehentlichem Verlassen |
| `public/lodging.js`, `public/travel.js` | Zimmeranzeige/-editor, Anreiseübersicht und Fahrerauswahl |
| `public/wiki.js`, `public/pages.js` | Wiki/Versionsverlauf sowie Übersicht, Festivalinfos und Gemeinsam unterwegs |
| `public/cms.js` | Inhaltsverwaltung, Hotelangebote und Dokumente |
| `public/questions.js`, `public/news.js` | Fragenpostfach bzw. Neuigkeiten mit manueller Benachrichtigungsfreigabe |
| `public/orga.js` | Getrennte Unterkunfts-/Anreiserückmeldungen, CSV sowie vorläufige Konto-/Rollenzuordnung |
| `public/navigation.js` | SVG-Symbole, mobile Navigation und Sichtbarkeit |
| `public/notifications.js`, `public/theme.js` | Individueller Lesestatus und Hell-/Dunkelmodus |
| `app/api/data/route.ts` | Serverzugriffsschutz, Datenvalidierung, Transaktionen, CMS und Dateizugriff |
| `app/chatgpt-auth.ts` | Sites-Anmeldung; später durch PKC-Identität ersetzen |
| `db/schema.ts`, `drizzle/` | Datenbankschema und SQL-Migrationen |
| `app/seed.json`, `app/cms-defaults.json` | Startwerte und historische Inhaltsübernahmen; kein Export des aktuellen Redaktionsstands |
| `tests/`, `scripts/check-app.mjs` | Isolierte Prüfungen ohne Produktionsdaten |

`build/` und `scripts/connector-preview/` gehören zur Sites-/Vorschau-Infrastruktur. Sie sind von der Anwendungslogik getrennt und sollten bei UI-Änderungen nicht angepasst werden. `prototype-v1/` ist eine historische Referenz und wird nicht öffentlich ausgeliefert. Vorhandene ungenutzte Starter-Komponenten sind kein zweiter aktiver Anwendungsablauf.

## Ladefolge und gemeinsame Daten

Die Oberfläche verwendet klassische `defer`-Skripte mit einem gemeinsamen globalen Namensraum, keine ES-Module. `app/page.tsx` ist die maßgebliche Ladefolge: Definitionen zuerst, `bootstrap.js` zuletzt. Neue Top-Level-Namen dürfen sich nicht überschneiden. `tests/content-ui.mjs` lädt dieselbe Liste ohne den Netzwerkstart und prüft die Darstellung und Menübedienung.

`GET /api/data` liefert den Zustand der aktuellen Identität. `load()` aktualisiert `state` und rendert die aktuelle Hash-Seite. `post()` sendet Aktionen an dieselbe API. Hotelkarten, Fristen und Unterkunftsauswahl lesen gemeinsam `state.hotels`; es gibt keine zweite Hotelkopie im Browser.

Persistente Inhalte kommen aus D1. Orga-Änderungen werden über die Oberfläche gespeichert und benötigen kein Deployment. Änderungen an Start-JSON-Dateien ändern bereits gespeicherte redaktionelle Inhalte grundsätzlich nicht; historische, mit Markern geschützte Inhaltsübernahmen sind in der API ausdrücklich erkennbar. Diese nicht ohne Prüfung bestehender Daten entfernen.

Der Planungsentwurf liegt zusätzlich pro Mitglied und Vorschau getrennt in `sessionStorage`. Er ist weder ein Backup noch eine Rückmeldung an die Orga. Erst die gemeinsame Aktion `planning` speichert Planung, Zimmeränderungen und Partnerbenachrichtigungen atomar. Der Server prüft alle Angaben vor dem Schreiben. Die ältere Aktion `plan` bleibt für getrennte Formulare kompatibel und nutzt denselben Validator.

Fahrgemeinschaften: Fahrer geben die Gesamtzahl der Mitfahrerplätze einschließlich belegter Plätze an (`car_capacity`). Ausgewählte Mitfahrende werden beim gemeinsamen Speichern automatisch über `car_driver` zugeordnet und benachrichtigt. Freie Plätze werden daraus berechnet. Korrekturen durch Fahrer oder Mitfahrende ersetzen die bisherige Autozuordnung; bisherige Fahrer und betroffene Mitglieder werden benachrichtigt. Bereits gespeicherte Angaben kommen beim erneuten Öffnen aus der Datenbank. Migration 0009 erhält alte freie-Plätze-Werte und ergänzt Kapazitätsprüfungen. Details und PKC-Anbindung stehen in `MARTIN_INTEGRATION.md`.

Neuigkeiten speichern und Mitglieder benachrichtigen sind getrennte Aktionen. Archivieren entfernt bereits zugestellte Nachrichten nicht. Gelesen-Zustände gehören jeweils zum eigenen Mitglied. Aktuell gibt es nur In-App-Nachrichten; der PKC-Maildienst ist noch nicht angebunden.

## Styles bearbeiten

Die feste Reihenfolge ist `style.css` → `usability.css` → `festival.css`:

- `style.css`: Grundlayout, Formulare und gemeinsame Komponenten.
- `usability.css`: Planungsablauf, responsive Navigation und Bedienung.
- `festival.css`: aktuelle Typografie, Farben und gestalterische Varianten einschließlich Dark Mode.

Responsive und gestalterische Überschreibungen sind teilweise absichtlich vorhanden. Nicht blind nach identischen Selektoren zusammenfassen: Spezifität und Media Queries beeinflussen das Ergebnis. Die zusätzliche `hidden`-/`display`-Absicherung des mobilen Menüs verhindert bekannte Sichtbarkeitsprobleme. Nach Asset-Änderungen die Versionsparameter in `page.tsx` bzw. `layout.tsx` anpassen.

## Entwicklung und Prüfungen

Node >=22.13 verwenden. Für eine neue lokale Arbeitskopie `npm ci`, danach `npm run dev`. `npm run db:generate` erzeugt Migrationen nur bei Schemaänderungen. Vorhandene SQL-Migrationen gemäß Sites-Vinext-Workflow auf die jeweilige Datenbank anwenden.

```sh
node scripts/check-app.mjs
npm run build
```

Die Prüfungen decken UI-Erzeugung/Ladefolge, mobiles Menü, Entwurf/Scrollverhalten, Theme, Lesestatus sowie serverseitige Rechte, private Fragen, CMS, Dateien und atomare Speicherung ab. Der Zugriffstest verwendet eine isolierte SQLite-Datenbank. Ein echter Browser-/Gerätetest ergänzt diese Prüfungen.

Die Anwendungsdateien sind mit Prettier 3.6.2 formatiert. Ohne zusätzliche Projektabhängigkeit erneut formatieren:

```sh
npm exec --yes --package=prettier@3.6.2 -- prettier --write 'public/*.js' 'public/*.css' app/page.tsx app/layout.tsx app/api/data/route.ts 'tests/*.mjs' scripts/check-app.mjs
```

## Vergleich mit dem GitHub-Stand

Private Website und GitHub verwenden denselben Anwendungscode einschließlich Tests, Datenbankschema, Migrationen und Assets. Die GitHub-Kopie hat keine Sites-Projekt-ID und enthält zusätzlich die Übergabehinweise und Excel-Auswertung. Die bekannten Dokumentationsunterschiede sind im Vergleichsskript ausdrücklich begrenzt; andere Abweichungen führen zu einem Fehler.

```sh
node scripts/compare-versions.mjs /pfad/zur/privaten-kopie /pfad/zur/github-kopie
```

Dieser Vergleich prüft Dateien, nicht die Live-Datenbank: gespeicherte Planungen, Fragen, redaktionelle Änderungen und hochgeladene Dateien sind kein Bestandteil des GitHub-Exports. Historische Referenzdateien in `prototype-v1/` und SQL-Kompatibilitätsaktionen sind absichtlich erhalten. Die aktuelle Anwendung lädt ausschließlich die Skripte aus `app/page.tsx`.

## Anmeldung, Datenschutz und verbleibende Grenzen

Die private Site nutzt die Sites-ChatGPT-Anmeldung. Die Chorliste ist eine vorbereitete Kopie ohne laufende Synchronisation. Neue Konten benötigen die serverseitige Zuordnung zu einem Mitglied. Der Betreiber ist vorläufig über seine E-Mail im Servercode festgelegt; er kann Rollen zuweisen. Die spätere PKC-Integration ersetzt diesen Adapter durch die übergeordnete App.

- Eigene vollständige Planung: Mitglied selbst und Orga.
- Unterkunft, Bewohner, Zeitraum und freie Plätze: zugeordnete Mitglieder.
- Zimmernummer: Zimmerbewohner und Orga.
- Fragen: Absender und Orga; kein öffentliches FAQ.
- Mitglieder-Vorschau: reduzierte Serverantwort und gesperrte Änderungen, keine Rollenänderung.

Jede Person bucht selbst. Die Seite nimmt keine Hotelbuchungen vor. Zusätzliche Besucher der privaten Site müssen separat über Sites freigegeben werden.

Die Aufgaben sind getrennt, die Browserdateien jedoch weiterhin über globale Namen gekoppelt. Die API ist noch ein großer, teilweise mit `any` typisierter Handler; längere HTML-Vorlagen bleiben in den rendernden Funktionen. Explizite ES-Module und typisierte Fachmodelle sind sinnvolle nächste Schritte bei der PKC-Integration. Eine vollständige Umstellung ist mit dieser Bereinigung nicht erfolgt. Links, Rollenmodell und Datenspeicherung wurden dabei beibehalten; die öffentliche Testversion wird separat verwaltet.
