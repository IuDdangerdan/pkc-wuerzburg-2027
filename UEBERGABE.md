# Übergabe an Martin

Stand: 19.10.2026 · Quellstand `01b5d3ce1ac753c9f060e323bc4b50a5437907a9`.

Diese eigenständige Kopie ist für ein neues **privates GitHub-Repository** vorbereitet. Sie enthält den aktuellen Quellcode, Paket-Lockdatei, SQL-Migrationen, Hotel-PDFs und Dokumentation. Die Kopie wird als eigenständiges Git-Repository geführt; die ursprüngliche Sites-Git-Historie wurde nicht übernommen. Der ursprüngliche Sites-Projektordner wurde nicht verändert.

## Einstieg

1. `README.md`: Dateien, Ladefolge, Entwicklung und Prüfungen.
2. `MARTIN_INTEGRATION.md`: bestehende Funktionen, vorläufige Anmeldung/Rollen und erforderliche PKC-Anbindung.

Nicht enthalten sind `.git` und dessen Verlauf/Remotes, installierte Pakete, Build-Ausgaben, lokale Laufzeitkonfigurationen, Zugangsdaten sowie lokale oder produktive Datenbanken. **Planungen, Fragen, Testfeedback, hochgeladene Dateien und der aktuelle Redaktionsstand der Live-Datenbank wurden nicht exportiert.** Die mitgelieferten JSON-Dateien sind Startwerte. Die drei ursprünglichen Hotel-PDFs liegen unter `public/documents/`.

Die Sites-Projekt-ID wurde aus `.openai/hosting.json` entfernt. Die nicht geheimen Bindungsnamen `DB` und `BUCKET` bleiben erhalten, weil die lokale Vite-Konfiguration sie verwendet. Diese Kopie kann nicht versehentlich unter der ursprünglichen Projekt-ID veröffentlicht werden.

Im Quellcode bleiben die vorbereitete Chorliste, Kontaktangaben und der dokumentierte Betreiber-Sonderfall für die eigenständige Version enthalten. Das sind keine Zugangsdaten. Martin ersetzt diese Übergangslösung bei der Integration durch PKC-Identität und Berechtigungen. Beispielwerte wie `user:password@example.org` in Tests sind absichtlich ungültige Testdaten.

## GitHub vorbereiten

Diesen Ordner in VS Code öffnen, unter Quellcodeverwaltung ein Repository initialisieren, Dateien prüfen und den ersten Commit erstellen. Anschließend ein **privates** GitHub-Repository veröffentlichen. Erst danach Martin gezielt einladen. Die `.gitignore` schützt übliche lokale Dateien; neue Dateien vor jedem Commit weiterhin prüfen.

## Technisch weiterarbeiten

Für eine neue lokale Installation gelten Node >=22.13 und die Befehle aus der README. `node_modules` wird erst durch die Installation erzeugt. Anmeldung, Rollen, Datenhaltung und Mailversand sind noch nicht an die PKC-App angebunden. Vor produktiver Übernahme mit echten PKC-Konten testen. Eine gegebenenfalls gewünschte Übernahme aktueller Live-Inhalte ist separat zu planen.
