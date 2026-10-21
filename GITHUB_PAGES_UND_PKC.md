# GitHub Pages und Anschluss an die PKC-App

Stand: 21.10.2026. Dieses Dokument ergänzt MARTIN_INTEGRATION.md.

## Was jetzt online ist

- Teilnehmer-Vorschau: https://IuDdangerdan.github.io/pkc-wuerzburg-2027/
- Öffentliche Orga-Simulation: https://IuDdangerdan.github.io/pkc-wuerzburg-2027/?ansicht=orga#admin
- Inhaltsverwaltung ansehen: https://IuDdangerdan.github.io/pkc-wuerzburg-2027/?ansicht=orga#manage

**GitHub Pages ist die öffentliche, schreibgeschützte Vorschau.** Sie enthält fiktive Personen, keine produktiven Planungen, Fragen oder Datenbankexporte. Die Orga-Ansicht simuliert ausschließlich die Bedienoberfläche. Speichern, Upload und Versand werden vor dem Netzwerkzugriff abgewiesen. Die Original-PDFs sind zur Veröffentlichung freigegeben. Die persönliche WhatsApp-Nummer wird nicht in die Pages-Datensätze übernommen.

Die private Sites-Version und Martins bestehende App werden durch diesen Build nicht verändert. Inhaltliche Änderungen aus deren Live-Datenbanken werden nicht automatisch synchronisiert. Die Vorschau zeigt die initialisierten Inhalte des Repos, einschließlich der Inhaltsmigrationen und der Busfrist 01.11.2026.

## Build und Veröffentlichung

Node >=22.13. Ein separater kleiner Build-Abhängigkeitssatz verhindert die Installation der gesamten Serverumgebung für Pages:

```sh
npm ci --prefix scripts/pages
npm run build:pages
npm run test:pages
```

Ausgabe: `pages-dist/` (nicht versioniert). `scripts/pages/build.mjs` exportiert das vorhandene Frontend, rendert `app/page.tsx` und initialisiert ausschließlich eine leere In-Memory-Datenbank über den bestehenden Testadapter. Es liest keine Live-Daten. Relative Asset-/PDF-Pfade funktionieren unter dem GitHub-Projektpfad und hinter einem Proxy-Unterpfad.

`.github/workflows/pages.yml` baut nach Änderungen an `main`, prüft die Ausgabe und veröffentlicht ausschließlich `pages-dist/`. In Settings → Pages ist die Quelle **GitHub Actions**. Keine persönliche Zugangsdaten oder Deployment-Tokens erforderlich. Fehlgeschlagene Builds ersetzen keine erfolgreiche Veröffentlichung. Frühere Stände lassen sich über Git und einen erneuten Build bereitstellen.

## Gewünschte Zielarchitektur

Daniel entwickelt die Festivaloberfläche in diesem Repo. Ein eigenständiger Festivaldienst hält Festivaldaten und Dateien. Die PKC-App stellt Identität, Mitgliedsverzeichnis, Orga-Berechtigung und den vorhandenen Maildienst bereit. Im Kalender und auf der App-Startseite führt ein Link in diesen Bereich. Kalender, Songs und übrige PKC-Daten erhalten dadurch keine allgemeinen Schreibrechte für das Festivalmodul.

Ein Reverse Proxy kann unter derselben PKC-Adresse zum Beispiel diese beiden Routen bereitstellen:

| Öffentlicher Pfad | Ziel |
| --- | --- |
| `/festival/` | Pages-Oberfläche oder separat gehostete Frontend-Ausgabe |
| `/festival-api/data` | Authentifizierte Festival-API, intern z.B. `/api/data` |

Dies ist ein Routing-Vorschlag, keine bereits eingerichtete Infrastruktur. Die genaue Domain und das Hosting legt Martin fest. Wird Pages als Quelle verwendet, den öffentlichen github.io-Ursprung weiterhin im Demo-Modus belassen; am PKC-Proxy eine eigene `runtime-config.js` ausliefern. Alternativ dieselbe Build-Ausgabe auf einem separaten Hosting mit abweichender Konfigurationsdatei betreiben.

**Ein Proxy ersetzt keine Anmeldung, Berechtigungsprüfung oder Datenkonvertierung.** Martins `tripIndex`/`showTripManage`-Antworten liefern ein anderes JSON-Layout. Sie können nicht unverändert in das hier vorhandene Frontend eingesteckt werden.

## Vorbereiteter Frontend-Anschluss

`runtime-config.js` ist öffentliche Konfiguration ohne Geheimnisse:

```js
window.PKC_FRONTEND_CONFIG = Object.freeze({
  mode: "backend",
  apiPath: "/festival-api/data"
});
```

Diese Konfiguration erst auf der PKC-Adresse aktivieren, nachdem der Serveranschluss geprüft wurde. Ohne Konfiguration ist ausschließlich die Vorschau aktiv. Unbekannte Modi oder fremde API-Ursprünge führen zu einem Fehler statt zu einem unsicheren Fallback. `?ansicht=orga` beeinflusst im Backend-Modus keine Berechtigung; ausschließlich `me` aus der authentifizierten API entscheidet.

`scripts/pages/runtime-adapter.js` übernimmt GET, JSON-POST und Multipart-Upload. Cookies werden nur an denselben Ursprung gesendet. 401/403 sowie HTML statt JSON erhalten verständliche Fehlermeldungen. Er lädt vor `bootstrap.js`, nachdem die gemeinsamen Frontend-Definitionen verfügbar sind. So bleiben Hauptversion und Pages beim selben Frontend; keine zweite Kopie der Fachlogik pflegen.

## Was Martin serverseitig anschließen muss

1. **Identität:** Bestehende PKC-Sitzung serverseitig verifizieren und in eine stabile Mitglieds-ID übersetzen. ChatGPT-Anmeldung und Betreiber-Sonderfall aus `app/chatgpt-auth.ts`/der Referenz-API ersetzen. Keine Passwörter, Sitzungscookies oder Tokens in URLs, statische Konfiguration oder Repository schreiben. Vom Browser gesetzte Identitäts-Header niemals ungeprüft vertrauen.
2. **Rollen:** Orga-Berechtigung pro Veranstaltung aus der PKC-App ableiten. Jede API-Aktion sowie Dateiabrufe serverseitig prüfen. Die Mitgliedervorschau muss Daten tatsächlich mit Mitgliedsrechten filtern, nicht nur Menüpunkte verstecken.
3. **API-Vertrag:** GET liefert die Struktur aus `app/api/data/route.ts` (u.a. `me`, `members`, `pages`, `hotels`, `documents`, `updates`, `rooms`, eigene/Orga-`plans`, `privateStays`, `questions`, `notifications`, `settings`). `?preview=member` filtert Daten zusätzlich. Authentifizierungspflichtige Antworten nicht öffentlich cachen. Dateilinks aus der API müssen auf den geschützten Festival-Dateidienst zeigen.
4. **Schreibaktionen:** POST übernimmt die im Referenz-Controller implementierten Aktionen, insbesondere `planning`, `room`, `roomNumber`, `question`, `seen`, `wiki`, `update`, `notifyUpdate`, Archivierung und `cms*`. Multipart-Uploads verwenden denselben API-Pfad. Request-/Response-Formate aus den jeweiligen Frontend-Aufrufen und Referenztests übernehmen, nicht aus Martins anderem Trip-Layout ableiten.
5. **Datenhaltung:** Referenzschema/Migrationen oder gleichwertiges Modell übernehmen, einschließlich atomarer Planungsspeicherung, Kapazitätsprüfung und genau einer Unterkunft pro Mitglied. Keine zweite unabhängige Planungsdatenbank parallel zu den bereits in Martins Trip-Modul erfassten Angaben betreiben: vor Umstellung eine Quelle bestimmen und ggf. Daten bewusst migrieren. D1/R2 ist die vorhandene Referenz, keine Pflicht für Martins Zielhosting.
6. **Benachrichtigungen:** Vorhandenen PKC-Maildienst über eine begrenzte serverseitige Verbindung verwenden. Neuigkeiten nur nach ausdrücklicher Freigabe senden; wiederholtes Speichern, Vorschau und Entwürfe versenden nichts. Persönliche Zuordnungsnachrichten, Empfänger, Lesestatus und Vermeidung doppelter Mails nach MARTIN_INTEGRATION.md übernehmen. Diese Pages-Ergänzung verschickt keine E-Mails und implementiert keinen neuen Versanddienst.
7. **Proxy & Betrieb:** Sitzung/CSRF/Origin-Prüfung für den gewählten Pfad abstimmen, Backendzugriff absichern, Datei- und API-Antworten nicht als öffentliche statische Assets cachen. Backups, Wiederherstellung und Fehlerprotokollierung für Festivaldaten vorsehen. Unverwandte PKC-Endpunkte nicht pauschal an das Frontend freigeben.

## Abnahme vor echten Rückmeldungen

Mit mindestens zwei normalen Testkonten und einem Orga-Testkonto prüfen: eigene/fremde Planungen und Zimmernummern, gemeinsame Speicherung samt Rollback, belegtes Auto, Fahrerwechsel von beiden Seiten, doppelte Zimmerzuordnung, private Unterkunft, neue Fragen/Antworten, Mailfreigabe, Lesestatus, archivierte Neuigkeiten und stabile geschützte PDF-Links. Keine echten Chormitglieder mit Testmails anschreiben. Die Tests im Repo beschreiben die Referenzregeln; sie beweisen nicht deren Umsetzung im PKC-Backend.

Die öffentliche Vorschau ist bereits zur Abstimmung nutzbar. **Produktive PKC-Anmeldung, echte Speicherung und Mailversand sind mit dieser Veröffentlichung noch nicht verbunden.**
