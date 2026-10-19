# Übergabe an Martin

Stand: 19.10.2026. Den jeweiligen Quellstand zeigt die Git-Commit-Historie; ein früherer einzelner Commit ist kein verlässlicher Verweis auf den aktuellen Stand.

Dieses private Repository enthält den Integrationsstand der privaten Würzburg-Website. Anwendungscode, Tests, Schema, Migrationen und Assets werden mit der privaten Arbeitskopie abgeglichen. Die ursprüngliche Sites-Git-Historie und die Sites-Projekt-ID wurden nicht übernommen.

## Einstieg

1. [README.md](README.md): Dateien, Ladefolge, Entwicklung, Prüfungen und Versionsvergleich.
2. [MARTIN_INTEGRATION.md](MARTIN_INTEGRATION.md): Funktionen, Rollen, Datenschutz, Planungs-/Mitfahrerregeln und erforderliche PKC-Anbindung. Für einen Integrationsprompt diese Anforderungen ausdrücklich mitgeben.
3. [Feedback-Auswertung (Excel)](docs/usability/PKC_Usability_Auswertung_2026-10-19.xlsx): Befunde der ersten Testrunde. Kein erneuter Nutzertest des aktuellen Stands.

## Was enthalten ist

Quellcode, Paket-Lockdatei, Datenbankschema und SQL-Migrationen, ursprüngliche Hotel-PDFs, Schriftlizenzen, Prüfungen und Dokumentation. Die drei Hotel-PDFs liegen in `public/documents/`. Startwerte stehen in `app/seed.json` und `app/cms-defaults.json`.

Nicht enthalten sind installierte Pakete, Build-Ausgaben, Compiler-Caches, Zugangsdaten, ursprüngliche Sites-Git-Metadaten sowie lokale oder produktive Datenbanken. **Planungen, Fragen, rohe Testfeedback-Exporte, später hochgeladene Dateien und der aktuelle Redaktionsstand der Live-Datenbank wurden nicht exportiert.** Eine gewünschte Datenübernahme ist separat zu planen.

Die vorbereitete Chorliste, Kontaktangaben und der Betreiber-Sonderfall bleiben als dokumentierte Übergangslösung im Quellcode. Sie sind keine Zugangsdaten und müssen durch PKC-Identität und Berechtigungen ersetzt werden.

## GitHub und Hosting

Das Repository ist bereits privat veröffentlicht: [IuDdangerdan/pkc-wuerzburg-2027](https://github.com/IuDdangerdan/pkc-wuerzburg-2027). Es muss nicht erneut initialisiert oder angelegt werden. Martin benötigt eine gezielte GitHub-Einladung. Änderungen vor dem Commit prüfen; die `.gitignore` schließt übliche lokale Daten aus.

Die GitHub-Kopie hat in `.openai/hosting.json` nur die lokalen Bindungsnamen `DB` und `BUCKET`. Damit verweist sie nicht auf Daniels bestehendes Sites-Projekt. GitHub-Upload und Website-Veröffentlichung sind getrennte Vorgänge. Die öffentliche Testversion ist veraltet und wird nicht automatisch mitgeändert.

## Technisch weiterarbeiten

Node >=22.13 und die Befehle aus der README verwenden. Alle erforderlichen Migrationen anwenden: insbesondere 0009 für Gesamtplätze/Kapazitätsprüfungen 0010 für die Busfrist **01.11.2026** und 0011 für genau eine Unterkunft pro Person sowie „Privat organisiert“ mit freiwilliger Ortsangabe. Anmeldung, Rollen, Datenhaltung und Mailversand sind noch nicht an die PKC-App angebunden.

Nach der Integration soll Daniel mit Orga-Rechten Wiki, Neuigkeiten, Angebote, Fristen und Dateien direkt verwalten können. Technische Betreiberrechte dürfen dafür nicht nötig sein. Vor produktiver Übernahme die Abläufe mit echten PKC-Konten testen.
