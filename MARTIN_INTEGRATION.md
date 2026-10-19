# Für Martin: Stand und offene PKC-Integration

Stand: 19. Oktober 2026

## Gestaltung

Das Festival-Design liegt als zusätzliche Datei `public/festival.css` nach den Funktions-/Layout-Styles. Einzige gestalterische Referenz ist https://potsdamerkneipenchor.de/festival. Die dort verwendete Schrift „Bebas Neue“ wird für die großen Plakattitel und den Festival-Kasten selbst gehostet. Inter bleibt die Leseschrift, Manrope strukturiert kleinere Überschriften. Die freie Schriftlizenz liegt jeweils unter `public/fonts`. Keine fremden Fotos, Logos oder Veranstaltungsdaten werden kopiert.

Reduzierte Palette: Apricot, warmes Papier und Rot für Aktionen. Infokarten verwenden eine einheitliche Fläche mit passenden SVG-Icons und einem klaren Pfeil; die früheren wechselnden Grün-/Fliederflächen, der schwarze Kopfbereich und schwarze Titelbalken entfallen. Der Festival-Kasten bleibt apricotfarben mit dunklerem unteren Streifen, der Stern und der Menübutton bleiben rot. Dark Mode und reduzierte Bewegung werden berücksichtigt. Die Übersicht bleibt kompakt. Visuell in Safari bei 393 und 1280 px sowie im dunklen Farbschema geprüft; Icons erhalten im Dark Mode einen helleren Rotton für ausreichenden Kontrast.

Haupt- und Zusatznavigation sind einheitlich linksbündig. Beide Gruppen nutzen dieselben Spalten für Icon, Beschriftung und optionalen Benachrichtigungspunkt sowie dieselbe Schriftgröße und Abstände. Mobil erscheint eine durchgehende Liste; das frühere Mischen aus zweispaltigem Raster und umbrechenden Flex-Einträgen entfällt. Die native `hidden`-Absicherung, Menü-Schließen, Tastaturbedienung, Scrollverhalten und Rollenfilter bleiben bestehen. Auswahllisten behalten mindestens 46 px Höhe einschließlich Safari-Anpassung. Navigation, Speicherlogik und Datenmodell sind von der Gestaltung unabhängig.

## Aufklappbare Unterkunftsangebote

Auf „Unterkunft & Buchung“ sind sämtliche Wiki-Texte vor und nach `[[UNTERKUNFTSANGEBOTE]]` sowie der konfigurierbare Quellenhinweis (`offersIntro`) in „Infos & Hinweise zur Buchung“ zusammengefasst. Jede vollständige Hotelkarte ist ebenfalls einzeln aufklappbar; Name, Preisgrundlage und Abruffrist bleiben geschlossen sichtbar. Frühstück, Buchungswege, Links, PDF, Warnhinweise und Orga-Bearbeitung liegen im geöffneten Angebot. „Zimmer & Bedingungen“ bleibt darin separat aufklappbar. Native `details`/`summary` unterstützen Tastatur und Screenreader; standardmäßig geschlossen. Die Hinweise sind zu fünf kurzen Punkten gekürzt: Eigenbuchung, Fristen, Preisgrundlage, sichere Buchung und Zimmergemeinschaften mit direkten Links. Quellenhinweis: „Quelle: Veranstalterunterlagen · Stand: 13.10.2026.“ Die gekürzten Texte wurden in der privaten redaktionellen Verwaltung gespeichert; sie bleiben dort bearbeitbar. Die Seed-Vorgaben für neue Installationen entsprechen diesem Stand. Bestehende Hotelangebote, Preise, Fristen, PDFs und Teilnehmerdaten werden nicht verändert. Auch die Orga-Vorschau nutzt dieselbe Darstellung.

## Lesestatus von Benachrichtigungen

`public/notifications.js` zeigt „Neu“ bzw. „Gelesen“, eine sichtbare Unterscheidung der Karten und die Zahl ungelesener Einträge. Ab mindestens 60 % Sichtbarkeit für 800 ms wird ein Eintrag bei sichtbarem Browser-Tab automatisch als gelesen gespeichert. Lange Einträge können auch einzeln oder mit „Alle als gelesen markieren“ quittiert werden. Das reine Öffnen der Seite markiert nicht mehr pauschal alle Einträge. Nach erfolgreicher Speicherung werden die lokalen Daten, Karten und Punkte in Navigation und mobilem Menü sofort abgeglichen; Fehler bleiben sichtbar und quittieren nichts lokal. Beim Seitenwechsel werden Beobachter und ausstehende Sichtbarkeitstimer entfernt. Die Mitglieder-Vorschau verändert den Lesestatus nicht.

API `action=seen` unterstützt eine Liste `ids` (maximal 100 je Request), ausschließlich für Benachrichtigungen des eigenen Mitglieds. Währenddessen neu hinzugekommene, nicht übermittelte IDs bleiben ungelesen. Der bisherige Aufruf ohne IDs bleibt für ältere Clients kompatibel. Bei PKC-Integration denselben individuellen Lesestatus und Abgleich übernehmen; keine fremden Einträge oder nicht angezeigte neue Nachrichten mitquittieren.

## Hell-/Dunkelmodus

`public/theme.js` bindet den Schalter per delegiertem Dokument-Ereignis. Damit bleibt er auch nach einem Neuaufbau des Header-Buttons durch React bedienbar. Die Auswahl wird unter `pkc-theme` gespeichert; blockierter Browser-Speicher verhindert das Umschalten nicht. Der Modus wird beim Start und nach dem Rendern mit dem aktuellen Header abgeglichen. Mond/Sonne, Beschriftung und `aria-pressed` zeigen den Zustand bzw. die nächste Aktion. `tests/theme.mjs` prüft Elementaustausch, Neuladen und gesperrten Speicher.

## Usability-Überarbeitung vom 19.10.2026

Grundlage: [Feedback-Auswertung vom 19.10.2026 (Excel)](docs/usability/PKC_Usability_Auswertung_2026-10-19.xlsx). Die Datei hält die Befunde der ersten Testrunde fest; der folgende Abschnitt beschreibt die daraus umgesetzten Änderungen. Ein erneuter Nutzertest des überarbeiteten Stands steht weiterhin aus.

Bei einem tatsächlichen Seitenwechsel wird nach dem Rendern sofort und nochmals im nächsten Layout-Frame ganz nach oben gescrollt. Automatische Scroll-Wiederherstellung der Browser-History ist für die Hash-Navigation abgeschaltet. Das gilt auch beim Zurück-/Vorwärtswechsel; Speichern und andere Aktualisierungen derselben Seite sowie abgebrochene Navigation verändern die Scrollposition nicht.

Umgesetzt ausschließlich in der privaten Hauptversion. Die öffentliche Testversion ist eine getrennte Kopie; Link, Datenbank und bisheriges Feedback bleiben unverändert.

- „Gemeinsam unterwegs“ zeigt zuerst „Gemeinsam anreisen“, danach „Wer wohnt wo?“ (mobil oben/unten, Desktop links/rechts). Beide Unterseiten haben über der Hauptüberschrift einen klaren Button-Link „← Zurück zu Gemeinsam unterwegs“. Die zusätzlichen kleinen Bereichsüberschriften „Unterkunft“ bzw. „Gemeinsam unterwegs“ entfallen, damit der Rückweg nicht mit einer zweiten Überschrift verwechselt wird.
- Vier Hauptbereiche: Übersicht, Meine Planung, Gemeinsam unterwegs, Festivalinfos. Bis 850 px wird die Navigation hinter „Menü“ auf- und zugeklappt. Der aktuelle Seitenname bleibt neben dem Button sichtbar. Nach Seitenwahl ist das Menü wieder geschlossen; Escape schließt es mit Fokus zurück auf den Button. Ein Punkt am Menübutton kennzeichnet ungelesene Benachrichtigungen. Im geöffneten Menü bleiben Symbole und Beschriftungen sichtbar, ohne seitliches Scrollen. Am Desktop bleibt die Seitenleiste geöffnet. Der mobile Zustand wird zusätzlich mit dem nativen hidden-Attribut und direkter Sichtbarkeitssteuerung abgesichert; beim Wechsel der Bildschirmbreite wird er neu abgeglichen. Versionierte Menü-Assets verhindern, dass alte CSS-/JS-Dateien im Browser weiterverwendet werden. Benachrichtigungen und Fragen & Kontakt bleiben direkt erreichbar; Orga-Menüpunkte bleiben rollenabhängig.
- Übersicht ohne Werbeüberschrift, Willkommenstext und doppelte Informationskacheln: Festivaldatum, Programm-Link, eine gemeinsame Kachel „Meine Planung“ für Anreise und Unterkunft sowie zunächst zwei Neuigkeiten. Weitere Einträge lassen sich einblenden; sie werden nicht gelöscht. Beiträge und Buttons bleiben redaktionell bearbeitbar.
- „Fragen & Kontakt“ zeigt das Fragenformular vor den FAQ. Gesendete Fragen und Sichtbarkeit bleiben wie bisher geregelt. „Nachrichten“ heißt in der Oberfläche jetzt „Benachrichtigungen“; es ist kein Chat.
- „Meine Planung“ nutzt einen gemeinsamen Abschluss „Planung speichern“ für Anreise, Unterkunftsstatus und im Dialog übernommene Zimmeränderungen. Zimmerdialog: „Zimmer übernehmen“ stellt einen Entwurf bereit und sendet noch nichts. Außerhalb der Planungsseite, etwa in der Orga-Zimmerverwaltung, speichert der Zimmerdialog weiterhin unmittelbar.
- API `action=planning`: Validierung aller Teile, dann ein atomarer D1-Batch für Plan, Zimmer und Zimmerbenachrichtigungen. Bei Fehlern bleibt der vorherige Stand erhalten. Bestehende `plan`-/`room`-Aktionen einschließlich `section=lodging|travel` bleiben für Kompatibilität verfügbar. Keine Schemaänderung und kein Zurücksetzen vorhandener Daten.
- Unfertige Planung wird beim Bearbeiten in `sessionStorage` je Mitglied und Vorschau-Modus zwischengespeichert. Das ist ein lokaler Entwurf in diesem Browser-Tab, keine bestätigte Server-Speicherung. Rückkehr und Neuladen stellen den Entwurf wieder her; beim Verlassen gibt es eine Warnung. Nach Erfolg wird der Entwurf entfernt und die Speicherbestätigung aus den gespeicherten Daten wieder angezeigt.
- Preisrahmen, Zimmerpartner, freie Zimmerplätze und Zimmernummer sind freiwillige Details. Unterkunft und Zeitraum erscheinen erst bei gebuchter Unterkunft oder vorhandenen Zimmerangaben. Mehrfachauswahl der Zimmerpartner hat einen sichtbaren „Fertig“-Button und Escape zum Schließen.
- Frühere Hero-/Kachel-Einstellungen bleiben für Bestandsschutz in der Datenbank, werden aber nicht mehr auf der Übersicht genutzt oder im Einstellungsformular angeboten. Die Übersicht bezieht ihre sichtbaren Inhalte aus Festivaldaten, einer gemeinsamen Planungskachel, Programmseite und Neuigkeiten. Businteresse wird ausschließlich im Anreiseabschnitt von Meine Planung abgefragt; eine aktuelle Busfrist kann weiterhin als Neuigkeit erscheinen. Hotelangebote und deren Quellenhinweise wurden nicht geändert. Aktivitäten und Packliste wurden nicht ergänzt.

Für die PKC-Integration denselben gemeinsamen Speicherabschluss mit Transaktion, eigener Identität, Zugriffsschutz und Entwurfskennzeichnung übernehmen. Session-Entwürfe müssen nach Kontowechsel isoliert bleiben; `sessionStorage` ist weder Backup noch Orga-Eingang. Zimmerbenachrichtigungen und spätere E-Mails erst nach erfolgreicher Speicherung auslösen. Browser-/Gerätetest ist vor Integration weiterhin erforderlich.

## Fahrgemeinschaften: Gesamtplätze und Mitfahrer (19.10.2026)

Bei „Ich fahre selbst“ zählt die Eingabe **alle Mitfahrerplätze ohne die fahrende Person**, einschließlich bereits belegter Plätze. `plans.car_capacity` speichert diese Gesamtzahl; `car_seats` ist bei bestätigter Gesamtzahl nur noch die berechnete Restzahl. Die bestehende freie-Plätze-Angabe wird nicht automatisch als Gesamtzahl interpretiert: Migration `0009_yielding_whizzer.sql` lässt `car_capacity` für Altbestände leer, und die Oberfläche bittet um erneute Angabe.

Die suchbare Mehrfachauswahl „Wer fährt schon bei dir mit?“ bleibt bis „Planung speichern“ im Entwurf. Ausgewählte Mitglieder erhalten in ihrer eigenen Planung `mode=Auto`, `car_role=Ich möchte mitfahren` und `car_driver=<Fahrer-ID>`. Unterkunftsstatus, Businteresse und Budget bleiben erhalten. Die Zuordnung wird nur einmal über `car_driver` gespeichert; `car_passengers` wird für die eigene Planung bzw. die Orga daraus abgeleitet. Andere vollständige Planungen bleiben für normale Mitglieder privat.

Neue Zuordnungen und das Entfernen von Mitfahrenden erzeugen In-App-Benachrichtigungen. Identisches erneutes Speichern benachrichtigt nicht noch einmal. Wer die Mitfahrt in der eigenen Planung ändert, aktualisiert dadurch auch die Liste/freien Plätze des bisherigen Fahrers und benachrichtigt diesen. Wer nicht mehr selbst fährt, löst bestehende Mitfahrerzuordnungen und benachrichtigt die Betroffenen. Entfernte Mitfahrende behalten Auto/Mitfahrwunsch, aber die Fahrerwahl ist wieder offen.

Die API prüft bekannte Mitglieder, Selbstzuordnung, doppelte Einträge, vorhandene Fahrerzuordnungen und ausreichende Plätze. Eine neue ausdrückliche Zuordnung ersetzt eine bestehende Mitfahrt auch dann, wenn sie von jemand anderem eingetragen wurde. Die bisherige Fahrperson wird benachrichtigt und ihr freier Platz neu berechnet. Auch ein bisher selbst fahrendes Mitglied kann übernommen werden: seine bisherigen, nicht gleichzeitig übernommenen Mitfahrenden werden freigegeben und benachrichtigt. Die Oberfläche weist darauf hin. Beim erneuten Aufrufen von „Meine Planung“ ohne ungespeicherte Änderungen wird der Serverstand nachgeladen; unveränderte Formular-Snapshots dürfen aktualisierte Zuordnungen nicht verdecken. Bei eigener Fahrerwahl muss die ausgewählte Person selbst fahren und eine bestätigte Gesamtplatzzahl haben; fehlende oder widersprüchliche Fahrerangaben werden beim Speichern abgewiesen. Veraltete übermittelte Mitfahrerlisten werden abgewiesen. Planung, Änderungen anderer Personen, Zimmer und Nachrichten werden in einer D1-Transaktion gespeichert; zusätzliche SQL-Trigger in Migration 0009 verhindern Überbelegung auch innerhalb der Transaktion. Diese Trigger bei Übernahme in ein anderes Backend durch gleichwertige Transaktions-/Kapazitätsprüfungen ersetzen. Orga-Ansicht und CSV zeigen Gesamtplätze, Mitfahrende und Restplätze getrennt.

**Für Martin:** Migration und Zuordnung/Synchronisation serverseitig übernehmen. Der bestehende PKC-Maildienst muss später zusätzlich die Mitfahrt-Benachrichtigungen versenden; hier weiterhin nur In-App. Tests: `tests/car-passengers.mjs` und Fahrgemeinschaftsfälle in `tests/access.mjs`.

## Kurzfassung

Das Würzburg-Modul ist eine eigenständige Umsetzung zur Abstimmung von Oberfläche und Abläufen. Es ist **noch kein Bestandteil der PKC-App**. Ohne Zugriff auf den PKC-Quellcode und eine abgestimmte Backend-Schnittstelle können wir die bestehende Anmeldung, Mitgliederverwaltung, Rollen und Benachrichtigungen nicht übernehmen.

Die separate Version hat bereits eine eigene Datenbank und serverseitige Zugriffskontrollen. Diese funktionieren innerhalb der Sites-Umgebung; sie sind kein Nachweis einer Integration mit dem PKC-Backend.

## Zentrales Ziel: Daniel verwaltet die Inhalte ohne Hostingzugriff

Daniel hat keinen Zugriff auf das Hosting oder den Quellcode der übergeordneten PKC-App. Nach der einmaligen technischen Integration durch Martin muss Daniel mit einer passenden Orga-Berechtigung die laufenden Festivalinhalte direkt in der App verwalten können. Für normale inhaltliche Änderungen dürfen weder ein Deployment noch ein Eingriff von Martin erforderlich sein. Hosting und technische Wartung bleiben bei der App-Verantwortung; redaktionelle Verwaltung liegt bei der Website-Orga.

**Die redaktionelle Verwaltung ist jetzt über „Inhalte verwalten“ umgesetzt.** Die Website-Orga kann Wiki-Seiten, Kurzbeschreibungen, Reihenfolge, Hotelangebote, zentrale Fristen, Kontaktangaben, Übersichtstexte und Dateien direkt pflegen. Änderungen liegen in der Datenbank bzw. im Dateispeicher und benötigen kein Deployment. Die Integration von Identität, Rollen, Datenhaltung und Mailversand in die PKC-App bleibt Martins technische Aufgabe.

| Inhalt / Aufgabe | Aktueller Stand | Erforderlich für selbstständige Verwaltung |
| --- | --- | --- |
| Wiki-Seiten anlegen, Titel/Text ändern, Links setzen, Version wiederherstellen | Orga-Oberfläche vorhanden | Mit PKC-Identität und dauerhafter Datenhaltung verbinden; kein Deployment beim Speichern |
| Neuigkeiten, Überschriften und Buttons bearbeiten, entfernen/wiederherstellen | Orga-Oberfläche vorhanden | Funktionen und serverseitige Rechte übernehmen |
| Benachrichtigungen zu Neuigkeiten bewusst freigeben | In-App-Freigabe vorhanden | Bestehenden Maildienst an dieselbe Freigabe koppeln; kein Versand bei bloßem Speichern |
| Hotelangebote: Preise, Fristen, Kontaktdaten, Bedingungen, Buchungslinks, Angebot hinzufügen/entfernen | Orga-Formular; Speicherung in `hotel_offers` | Strukturierte, über Orga-Formulare bearbeitbare Daten; Wiki-Karten und Unterkunftsauswahl aus derselben Quelle erzeugen |
| Busfrist und andere zentrale Festivaldaten | Orga-Einstellungen; Speicherung in `content_settings` | Bearbeitbare Veranstaltungseinstellungen; Frist an allen Stellen aus derselben Quelle lesen |
| Übersicht: Festivaldaten, Aufgaben und Neuigkeiten | Festivaldaten redaktionell, Aufgaben aus gespeicherter Planung, Beiträge mit Buttons | Dieselben Datenquellen und Rollenrechte übernehmen |
| Kontakt / WhatsApp-Link | Orga-Einstellungen; Speicherung in `content_settings` | Über Orga-Einstellungen änderbar |
| PDFs und weitere Anlagen hinzufügen, ersetzen, entfernen | Geschützter Upload für PDF/PNG/JPEG/WebP bis 10 MB; Ersetzen mit stabilem Link und Versionsverlauf | Orga-Dateiverwaltung mit geschütztem Upload und stabilen Links; bei Ersatz bestehende Verweise berücksichtigen |
| Fragen lesen, Zimmer pflegen, Unterkunft/Anreise filtern und exportieren | Orga-Oberfläche vorhanden | Mit PKC-Daten und Rollen verbinden; Zugriff auch ohne technische Betreiberrechte |
| Wiki-Seiten ausblenden oder archivieren | Orga-Funktion mit Wiederherstellung; Übersicht bleibt erhalten | Redaktionelle Funktion mit Wiederherstellung und Umgang mit bestehenden Verlinkungen |

**Rollenabgrenzung:** Die zukünftige Website-Orga-Berechtigung soll sämtliche redaktionellen Aktionen erlauben, ohne Daniel zum technischen App-Administrator zu machen. Die Vergabe dieser Berechtigung läuft über Martin bzw. die übergeordnete PKC-App. Der aktuelle E-Mail-basierte Betreiber-Sonderfall und die lokale Kontenzuordnung sind Übergangslösungen.

**Abnahme vor Übergabe:** Mit Daniels normalem PKC-Konto und zugewiesener Orga-Berechtigung prüfen, dass Wiki-Text, Hotelpreis, Busfrist, PDF und Kontaktlink in der Oberfläche geändert werden können und nach erneutem Laden erhalten bleiben – ohne Quellcodezugriff, Hostingzugriff oder Deployment. Zusätzlich eine Neuigkeit mehrfach ohne Versand speichern und erst anschließend ausdrücklich benachrichtigen. Daten dürfen bei einem späteren App-Deployment nicht durch Startinhalte überschrieben werden. Martin stellt eine kurze Bedienanleitung und einen technischen Kontakt für Fehler bereit; laufende Inhaltsänderungen erledigt Daniel selbst.

## Was bereits umgesetzt ist

- Bearbeitbares Festival-Wiki, Suche, Updates und Versionsverlauf.
- Eigene Angaben zu Unterkunftsstatus, Anreise und unverbindlichem Businteresse.
- Zimmergemeinschaften mit suchbarer Mehrfachauswahl aus einer vorbereiteten Chorliste.
- Automatische Übersicht nach Unterkunft und freiwillige Angebote freier Zimmerplätze.
- Optionale Zimmernummer; bearbeitbar durch Zimmerbewohner und Orga.
- In-App-Nachrichten bei Zuordnung zu einer Zimmergemeinschaft und Änderungen daran; keine Bestätigung notwendig.
- Neuigkeiten erzeugen nur nach ausdrücklicher Orga-Freigabe eine In-App-Benachrichtigung für alle Mitglieder der vorbereiteten Liste, mit kurzem Hinweis und Link zur Übersicht. Neue Fragen benachrichtigen alle mit Orga-Rolle.
- Orga-Ansicht mit Filtern, CSV-Export und Konten-/Rollenverwaltung.
- Serverseitige Trennung zwischen eigenen Angaben, gemeinsam sichtbaren Zimmerdaten und Orga-Daten.

Hotelbuchungen werden nicht koordiniert oder ausgeführt. Jede Person bucht selbst.

## Was ohne Martins Unterstützung noch nicht möglich ist

| Bereich | Aktueller Ersatz | Für die PKC-Integration erforderlich |
| --- | --- | --- |
| Anmeldung | Sites-/ChatGPT-Anmeldung | Bestehende PKC-Sitzung bzw. serverseitig verifizierbare Benutzeridentität übernehmen |
| Mitgliederauswahl | Manuell aus der App übernommene Liste; Zuordnung angemeldeter Konten durch den Betreiber | Berechtigte Mitgliederabfrage mit stabilen PKC-Mitglieds-IDs; Änderungen und Austritte berücksichtigen |
| Orga-Rolle | Eigene Datenbankrolle; Betreiber über festgelegte E-Mail erkannt | PKC-Rollen oder veranstaltungsbezogene Berechtigung serverseitig prüfen; Betreiber-Sonderfall ersetzen |
| Datenhaltung | Separate Cloudflare-D1-Datenbank | Entscheiden, ob Daten ins PKC-Backend wandern oder ein separat abgesichertes Modul angebunden wird |
| Teilnahme | Link auf Festivaltermin 452; keine Synchronisierung | Lesender Zugriff auf Zusagen, Absagen und offene Rückmeldungen, sofern für dieses Modul gewünscht |
| Benachrichtigungen | Nachrichten ausschließlich innerhalb dieser separaten Seite | Den laut Daniel bereits vorhandenen Mailversanddienst der PKC-App anbinden: persönliche Nachrichten und Festival-Updates zusätzlich per E-Mail versenden. Der separate Prototyp versendet noch keine E-Mails. |
| Navigation | Eigene Seite unter eigener Domain | Einstieg im Festivaltermin oder Integration in die bestehende Navigation und mobile Darstellung |
| Veröffentlichung | Private Sites-Veröffentlichung nur für den Betreiber | Hosting, Testumgebung, Freigabe und Deployment für die PKC-App abstimmen |

Die Namensabfrage entfällt bereits für zugeordnete Konten. **Ein PKC-Benutzer wird aber noch nicht automatisch erkannt.** Die vorbereiteten IDs wie `pkc-37` sind interne Platzhalter dieser Umsetzung und dürfen nicht als echte PKC-Mitglieds-IDs behandelt werden.

## Rollen: aktuelle Übergangslösung und spätere PKC-Anbindung

**Aktuell in dieser eigenständigen Version:** Die Anmeldung erfolgt über ChatGPT/Sites. Angemeldete Konten werden einem Eintrag der vorbereiteten Mitgliederliste zugeordnet. Die lokale Rolle steht in `members.role` (`member` oder `orga`). Der Betreiber wird zusätzlich über eine fest im Servercode hinterlegte E-Mail-Adresse erkannt und erhält Orga-Rechte. Nur der Betreiber sieht „Konten & Rollen“ in der Orga-Übersicht und kann Konten zuordnen oder Orga-Rollen vergeben. Andere Orga-Mitglieder können diese Rollenverwaltung nicht nutzen.

**Bei der Integration durch Martin:** Anmeldung, Mitgliedsidentität und Berechtigungen sollen aus der übergeordneten PKC-App kommen. Martin muss klären, welche vorhandene Rolle oder veranstaltungsbezogene Berechtigung der Website-Orga entspricht. Es ist noch nicht bestätigt, dass das bestehende Rollenmodell genau dazu passt. Diese Berechtigung muss im PKC-Backend geprüft werden – auch für Fragenposteingang, persönliche Rückmeldungen, Wiki und Neuigkeiten.

Die lokale Kontenzuordnung, die eigene Rollenvergabe und der Betreiber-Sonderfall sind **keine Vorgabe für die fertige PKC-App**. Nach erfolgreicher Anbindung sollen sie ersetzt werden; „Konten & Rollen“ kann dann aus diesem Modul entfallen. Keine zweite, unabhängige Rollenverwaltung neben der PKC-App beibehalten. Bis zur Integration bleibt die aktuelle Übergangslösung in dieser Version aktiv.

## Technischer Anschluss

Die bestehende App wurde im Browser untersucht. Die ausgelieferten Dateien zeigen React, React Bootstrap, Redux und React Router. Datenanfragen gehen an ein getrenntes Backend unter `backend.potsdamerkneipenchor.de`, unter anderem an `/api/events`, `/api/groups` und `/api/index`.

Das sind Beobachtungen, **keine dokumentierte oder freigegebene Integrationsschnittstelle**. Authentifizierung, Datenformate und Schreibberechtigungen sind daraus nicht vollständig bekannt. Bestehende Endpunkte werden von diesem Modul nicht angesprochen.

Die separate Umsetzung nutzt Vinext/React für die Serverumgebung, eine JavaScript-Bedienoberfläche und D1. Eine direkte Übernahme als fertige React-Komponente in die PKC-App ist noch nicht vorbereitet. Gestaltung und Abläufe können übernommen werden; Frontend-Einbindung und Datenzugriff müssen an Martins Projekt angepasst werden.

## Vorgesehene Berechtigungen

| Daten / Aktion | Mitglied | Orga |
| --- | --- | --- |
| Vollständige persönliche Planung inkl. Busbudget | Nur eigene Angaben | Alle Angaben |
| Hotel, Zimmerbewohner, Zeitraum, angebotene Plätze | Zugeordnete angemeldete Chormitglieder | Ja |
| Zimmernummer | Nur eigene Zimmergemeinschaft | Alle Zimmer |
| Zimmerdaten bearbeiten | Eigene Zimmergemeinschaft | Alle Zimmer |
| Wiki und Updates bearbeiten | Nein | Ja |
| Fragen über das Formular lesen | Nur eigene Fragen | Alle Fragen |
| Konten zuordnen / Orga-Rollen vergeben | Nein | Derzeit ausschließlich Betreiber |

Die Regeln müssen im Zielbackend durchgesetzt werden. Menüpunkte auszublenden reicht nicht. Die aktuelle Site bleibt privat; die implementierte Mitgliederlogik gibt niemandem automatisch Zugang zur Site.

## Mailversand über die bestehende PKC-App

**In der PKC-App gibt es bereits einen Mailversanddienst (Angabe von Daniel). Martin soll diesen bei der Integration anbinden; ein neuer Maildienst ist nicht vorgesehen.**

Gewünschtes Verhalten:

- Persönliche Zimmerbenachrichtigungen erscheinen weiterhin auf der Seite und werden zusätzlich per E-Mail an die betroffenen Mitglieder gesendet: neue Zimmerzuordnung, Entfernung aus einer Zimmergemeinschaft und Änderungen an deren Angaben. Eine Bestätigung ist weiterhin nicht erforderlich.
- Generelle Neuigkeiten und veröffentlichte Änderungen an Festivalinformationen werden auf der Seite und zusätzlich per E-Mail an die Teilnehmenden gemeldet. Bei Beiträgen unter „Neuigkeiten“ erfolgt der Versand ausschließlich nach ausdrücklicher Orga-Freigabe (siehe Abschnitt zur manuellen Freigabe), niemals bei jedem Speichern. Das gewünschte Zielverhalten umfasst außerdem Änderungen an bestehenden Wiki-Seiten, beispielsweise Programm, Kosten, Fristen, Unterkunftskonditionen und Anreise. Es muss nicht erst ein zusätzlicher Neuigkeiten-Beitrag geschrieben werden, damit eine veröffentlichte Wiki-Änderung eine Benachrichtigung auslöst.
- Bei Änderungen enthält die Benachrichtigung eine kurze Zusammenfassung, was sich geändert hat, und einen direkten Link zur betroffenen Seite. Entwürfe und nicht gespeicherte Bearbeitungen werden nicht gemeldet.
- Die E-Mail enthält einen kurzen Hinweis und einen direkten Link zur betreffenden Seite. Private Reiseangaben, Busbudgets und Kreditkartendaten gehören nicht in diese Nachrichten.

Von Martin zu klären bzw. umzusetzen:

1. Vorhandene serverseitige Versandfunktion und die hinterlegten PKC-Mailadressen verwenden. Keine Zugangsdaten im Browsercode hinterlegen.
2. Empfänger für persönliche Nachrichten anhand der stabilen PKC-Mitglieds-IDs ermitteln. Den Verteiler für generelle Neuigkeiten und Änderungen aus der Teilnahmeverwaltung ableiten und festlegen, ob auch noch unentschlossene Mitglieder dazugehören.
3. Versand erst nach erfolgreichem Speichern und bei Neuigkeiten ausschließlich nach ausdrücklicher Orga-Freigabe auslösen. Entwürfe, Vorschauen und bloße Speicher-/Bearbeitungsschritte lösen keine E-Mail aus.
4. Doppelte E-Mails bei wiederholten Anfragen verhindern; Versandfehler erfassen und einen erneuten Versand ermöglichen, ohne bereits gespeicherte Änderungen rückgängig zu machen.
5. Absender, Antwortadresse und gegebenenfalls bestehende Benachrichtigungseinstellungen der PKC-App übernehmen bzw. abstimmen.

**Noch nicht umgesetzt:** Der eigenständige Prototyp erzeugt weiterhin nur In-App-Nachrichten. Der vorhandene Maildienst und die PKC-Mailadressen sind von hier aus noch nicht angebunden. Push-Benachrichtigungen sind nicht Teil dieses Wunsches.

## Was wir als Nächstes von Martin brauchen

1. Entscheidung: Einbau in die PKC-App oder separates verlinktes Modul?
2. Bestehende Benutzer-ID, Sitzungsprüfung und Rollenmodell; keine Passwörter oder Sitzungstokens über Chat weitergeben.
3. Datenmodell bzw. dokumentierte Schnittstelle für Mitglieder und optional Festivalteilnahme.
4. Gewünschter Speicherort für Wiki, Reiseangaben, Zimmer und Nachrichten.
5. Entwicklungs-/Testumgebung und Ablauf für Review und Veröffentlichung.
6. Anbindung des bestehenden PKC-Mailversands für Zimmerbenachrichtigungen sowie generelle Neuigkeiten und veröffentlichte Änderungen an Wiki- und Festivalinformationen (siehe Abschnitt oben).

## Wichtige Dateien

- `app/api/data/route.ts`: Identität, Zugriffsprüfung, vorbereitete Mitgliederliste, Datenoperationen und Nachrichten.
- `public/app.js`: gemeinsamer Zustand, API-Zugriff, DOM-Helfer und Seitenverteilung.
- `public/planning.js`, `lodging.js`, `travel.js`: Planungsentwurf, Zimmer und Anreise.
- `public/wiki.js`, `pages.js`, `questions.js`, `news.js`: Wiki, Einstiegsseiten, Kontakt und Neuigkeiten.
- `public/orga.js`, `navigation.js`, `notifications.js`, `theme.js`: Orga-Rückmeldungen, Menü, Lesestatus und Darstellungsmodus.
- `public/bootstrap.js`: einziger Startpunkt, nach allen anderen Skripten geladen. Die klassischen Skripte teilen noch einen globalen Namensraum; Ladefolge und Zuständigkeiten stehen in der README.
- `public/cms.js`: redaktionelle Inhaltsverwaltung, Hotel- und Datei-Editoren, Konfigurationsanzeige.
- `app/cms-defaults.json`: einmalige Startwerte; bereits gespeicherte redaktionelle Änderungen werden nicht überschrieben.
- `app/page.tsx`, `app/layout.tsx`: Grundgerüst und feste Asset-Reihenfolge.
- `public/style.css`, `public/usability.css`, `public/festival.css`: Basis, Bedienabläufe und Festival-Gestaltung; Reihenfolge ist relevant.
- `app/seed.json`: initiale Wiki-Inhalte; gespeicherte Wiki-Änderungen liegen anschließend in der Datenbank.
- `db/schema.ts`, `drizzle/`: Datenbankschema und Migrationen.
- `tests/access.mjs`: isolierte Prüfungen für Zugriffsschutz und Datenoperationen.
- `README.md`: Entwicklung und allgemeiner Überblick.

## Grenzen der aktuellen Version

- Keine Synchronisierung mit der PKC-App, keine echte PKC-Anmeldung und keine Live-Mitgliederliste.
- Benachrichtigungen werden auf der Seite gelesen; kein externer Versand und kein Push.
- Keine automatische Übernahme der lokal gespeicherten Daten aus Version 1.
- Datei-Uploads sind vorhanden. Bei der PKC-Integration muss Martin den geschützten Dateispeicher anbinden; bestehende Downloadlinks und Versionen erhalten.
- Die Orga-Aufgabe zum Strombedarf ist ein Hinweis, noch kein Aufgabenmanagement mit Erledigungsstatus.
- Geprüft wurden Build, Typen, serverseitige Berechtigungen und zentrale Bedienabläufe mit lokalen Testdaten. Ein Test mit echten PKC-Konten steht aus.


## Fragen an Daniel & Auto-Anreise
- FAQ enthält ein Fragenformular an die Website-Orga: Speicherung in `questions`, sichtbar für Absender und alle mit Orga-Rolle. Alle Orga-Mitglieder erhalten eine Benachrichtigung. Gemeinsamer Posteingang in der Orga-Übersicht und unter Fragen & Antworten. Normale Mitglieder sehen nur eigene Fragen. Keine automatische Veröffentlichung als FAQ.
- Bei PKC-Integration Absender aus angemeldetem Mitglied ableiten und Empfänger anhand der Website-Orga-Rolle ermitteln; bestehenden Maildienst auch für eingehende Fragen an die Orga verwenden. Aktuell wird keine E-Mail verschickt.
- WhatsApp-Direktlink ist hinterlegt. Nicht ungefragt in die öffentliche Demo übernehmen.
- Auto-Anreise verlangt `car_role` (selbst fahren / mitfahren); Fahrer müssen `car_seats` (freie Plätze ohne Fahrer, auch 0) angeben. Nur eigene Planung und Orga sehen diese Angaben, inklusive CSV. Beim Wechsel der Reiseart werden alte Autoangaben gelöscht.

- Mitfahrer können optional unter `car_driver` die Mitglieds-ID ihres bereits abgesprochenen Fahrers angeben (durchsuchbare Einzelauswahl; eigene Person ausgeschlossen). Keine automatische Platzreservierung oder Bestätigung. Angabe ist in Orga-Übersicht und CSV enthalten; beim Wechsel auf andere Reiseart oder Selbstfahren wird sie gelöscht. Für PKC das Mitgliederverzeichnis anbinden.

- Rückmeldefrist für das unverbindliche Businteresse: **01.11.2026**. Die Inhaltsmigration `0010_bus_deadline_20261101.sql` ändert den bisherigen CMS-Wert und aktuelle Bus-Neuigkeiten auf die neue Frist, ohne Benachrichtigungen auszulösen. Andere Einstellungen bleiben erhalten. Sichtbar im Planungsformular, unter Gemeinsam anreisen sowie Anreise & Bus und Kosten & Fristen. Die Frist ist ein Rückmeldehinweis; spätere Eingaben werden nicht automatisch gesperrt.

## Neuigkeiten verwalten
Jedes Thema hat einen eigenen Eintrag. Orga kann Neuigkeiten entfernen und unter „Entfernte Neuigkeiten“ wiederherstellen. Technisch wird `updates.archived` gesetzt, damit Einträge bei erneutem Laden nicht wieder erscheinen. Normale Mitglieder sehen weder entfernte Einträge noch Verwaltungsaktionen; Berechtigung wird serverseitig geprüft.

- Orga kann beim Schreiben einer Neuigkeit bis zu 8 Buttons hinzufügen (Beschriftung + interne Seite oder externe Webadresse), vor dem Veröffentlichen auch entfernen. Speicherung als JSON in `updates.buttons`; serverseitige Linkprüfung. Externe Links öffnen in einem neuen Tab. Bei der Mail-Anbindung diese Buttons ebenfalls als Links übernehmen.

- Neuigkeiten zeigen Text und Linkbuttons direkt. Orga kann über „Bearbeiten“ vorhandene Texte und Buttons ändern, hinzufügen oder entfernen. Veröffentlichungsdatum bleibt beim Bearbeiten erhalten; Berechtigung und Linkziele werden serverseitig geprüft.

- Neuigkeiten haben optional eine bearbeitbare Überschrift (`updates.title`). Neuigkeiten stehen unter der gemeinsamen Planungskachel. Zunächst sind zwei Einträge einschließlich Texten und Buttons sichtbar; weitere lassen sich einblenden. Orga-Aktionen „Bearbeiten“ und „Entfernen“ stehen direkt am Eintrag.

## Getrennte Orga-Rückmeldungen
Unterkunft und Anreise sind getrennte Bereiche mit eigenen Filtern und CSV-Exporten (jeweils aktuelle Filterauswahl). Unterkunft zeigt Status, Hotel, Zimmergemeinschaft, Zeitraum und Zimmernummer; Zimmer können im aufklappbaren Bereich bearbeitet werden. Anreise zeigt Reiseart, Businteresse, Preisrahmen sowie Fahrer/Mitfahrer, freie Plätze und ausgewählten Fahrer. Die Rechte bleiben auf die Website-Orga beschränkt.

## Benachrichtigungen bei Neuigkeiten: manuelle Orga-Freigabe
Speichern und Bearbeiten verschicken standardmäßig **keine Benachrichtigung**. Der Beitrag ist nach dem Speichern trotzdem für berechtigte Besucher sichtbar; es handelt sich nicht um einen privaten Entwurf. Im Formular kann die Orga „Mitglieder jetzt benachrichtigen“ aktivieren (standardmäßig aus). Alternativ gibt es direkt am Beitrag „Mitglieder benachrichtigen“. Eine separate Bestätigung erklärt den Empfängerkreis; bei erneutem Versand wird darauf hingewiesen. `updates.notified_at` zeigt der Orga den letzten Benachrichtigungszeitpunkt.

Nur explizite Freigabe erzeugt Nachrichten. Beitrag und ggf. angeforderte Benachrichtigungen werden gemeinsam gespeichert. Alle Mitglieder der lokalen Liste erhalten eine Nachricht einschließlich Verfasser. Noch nicht zugeordnete Konten sehen sie nach Zuordnung. Entfernen und Wiederherstellen verschicken keine Nachricht. Neue Fragen und Zimmerbenachrichtigungen bleiben davon unabhängig.

**Für Martin:** Diese manuelle Freigabe muss auch den späteren E-Mail-Versand steuern. Keine automatische Mail bei jedem Speichern, Editieren oder Veröffentlichen einer Neuigkeit. Empfängerkreis aus Festival-Teilnahme bzw. berechtigten Mitgliedern ableiten. Aktuell kein Mailversand. Wiki-Änderungen lösen hier weiterhin keine automatische Nachricht aus; das gewünschte Zielverhalten für Wiki-Änderungen ist separat oben beschrieben.

## Bedienung: Inhalte ohne Hostingzugriff pflegen
1. Mit Orga-Rolle anmelden und **Inhalte verwalten** öffnen.
2. **Texte & Einstellungen:** Festivaldaten, zentrale Busfrist, Kontakt/WhatsApp, Datum und Kontakt der Übersicht, Anreise- und sonstige Hinweise ändern. Speichern; frühere Einstellungen lassen sich wiederherstellen.
3. **Hotelangebote:** Unterkünfte hinzufügen, Preise/Fristen/Frühstück/Buchungswege und Linkbuttons bearbeiten, Originaldokument wählen und Zimmerbedingungen ändern. Ausblenden ist reversibel und entfernt keine bereits eingetragenen Zimmer. Beim Umbenennen werden bestehende Zimmer zugeordnet gehalten. Hotelkarten, Unterkunftsauswahl und dynamische Fristenliste nutzen dieselbe Quelle. Historische Neuigkeiten werden nicht automatisch umgeschrieben.
4. **Dateien:** PDF, PNG, JPEG oder WebP bis 10 MB hochladen; Link kopieren und im Wiki oder als Button verwenden. „Datei ersetzen“ behält die Downloadadresse bei. Frühere Dateiversionen können wiederhergestellt werden. Ausblenden sperrt den Download für Mitglieder; bestehende Links vorher anpassen.
5. **Wiki-Seiten:** anlegen, Titel/Text/Kurzbeschreibung/Reihenfolge bearbeiten, ausblenden und wiederherstellen. Übersicht ist als Einstieg nicht ausblendbar. Marker `[[UNTERKUNFTSANGEBOTE]]`, `[[UNTERKUNFTSDOKUMENTE]]` und `[[BUCHUNGSFRISTEN]]` zeigen verwaltete Angebote, Dateien und aktuelle Hotel-Fristen.
6. Inhalte sind nach dem Speichern direkt sichtbar. Eine Benachrichtigung wird dadurch nicht automatisch ausgelöst; gezielt eine Neuigkeit schreiben und den Versand freigeben.

### Technischer Anschluss der Inhaltsverwaltung für Martin
- Neue Tabellen: `content_settings` (einschließlich bis zu 30 vorherigen Einstellungen), `hotel_offers`, `documents` (Metadaten und bis zu 30 Dateiversionen); Wiki enthält zusätzlich `summary`, `position`, `archived`. Migrationen append-only übernehmen.
- R2-Bindung **BUCKET** in der eigenständigen Site. Dateiinhalt liegt außerhalb der Datenbank; Metadaten zeigen auf den aktuellen Objektschlüssel. Beim Ersetzen bleiben alte Objekte für Wiederherstellung erhalten. Das Modul benötigt in der PKC-App entsprechende Backend- und Dateispeicherfunktionen, keine Upload-Zugangsdaten im Browser.
- `/api/data?file=ID` prüft Anmeldung und Mitgliedszuordnung; ausgeblendete Dateien können nur Orga lesen. Upload und alle Inhaltsänderungen erfordern serverseitig Orga-Rechte und eine gültige Origin. PDF-/Bildsignatur wird geprüft; aktive HTML-/SVG-Dateien sind nicht als Upload erlaubt.
- Die drei bisherigen Original-PDFs sind als verwaltete Dokumente mit statischer Ausgangsdatei registriert. Nach Ersetzen wird über dieselbe Dokument-ID die neue Datei ausgeliefert; die alte statische Datei bleibt als frühere Version erhalten. Beim Übertragen in die PKC-App die Originaldateien und alle gespeicherten Versionen mitnehmen.
- `cms-defaults.json` dient ausschließlich als Erstbefüllung. Spätere Deployments dürfen Datenbankinhalte und hochgeladene Dateien nicht zurücksetzen. Alle fachlichen Inhalte sind im Modul pflegbar; Layout-/Funktionsänderungen, Hosting, Backups und PKC-Rollenadministration bleiben technische Aufgaben.
- Validiert: Zugriffsschutz, Speicherung, Wiederherstellung, Upload/Ersetzen, stabile Dateilinks, Ausblenden und HTML-Erzeugung. Eine echte Browserprüfung war in dieser Sitzung mangels verfügbarer Browsersteuerung nicht möglich; vor Übergabe mit Daniels PKC-Konto die Bedienabläufe testen.

## Mitgliederansicht für die Website-Orga
Im Kopfbereich kann die Orga mit „Mitgliederansicht“ zur Vorschau ohne Orga-Menüs und Verwaltungsbuttons wechseln. „Zur Orga-Ansicht“ beendet die Vorschau. Sie nutzt das eigene Mitgliedskonto, nicht die Daten eines anderen Mitglieds. Der Server liefert für `GET /api/data?preview=member` nur die normale Mitgliedssicht (eigene Planung/Fragen, freigegebene Zimmerdaten, keine Konten/Rollen, entfernten Inhalte oder Einstellungshistorie). Die tatsächliche Rolle bleibt unverändert. Der Umschalter ist nur für tatsächlich berechtigte Orga sichtbar. Der Modus wird pro Browsertab gehalten; Änderungen sind in der Vorschau gesperrt.

Martin soll diesen Vorschaumodus bei der PKC-Integration erhalten. Ein Ausblenden der Menüs allein wäre dafür nicht ausreichend; auch die Daten müssen mit Mitgliedsrechten gelesen werden. Rollenvergabe bleibt in der übergeordneten App.

## Planung & mobile Bedienung
„Meine Planung“ zeigt zuerst Anreise, darunter Unterkunft (Status und Zimmer), ohne Nummerierung. Der Unterkunftsabschnitt verweist vor der Statusauswahl mit einem kurzen Hinweis und „Unterkünfte ansehen“ direkt auf `#wiki/unterkunft` (Hotels, Preise und Buchungsinfos); der Link ist bei jedem Unterkunftsstatus sichtbar. Seit 19.10.2026 werden beide Bereiche und übernommene Zimmeränderungen gemeinsam gespeichert. Der Speicherstatus bleibt sichtbar; weitere Eingaben werden als ungespeichert markiert. Details zur Transaktion und lokalen Entwürfen stehen oben.

Orga-Rückmeldungen erscheinen auf schmalen Bildschirmen als beschriftete Karten statt breiter Tabellen; Desktop bleibt tabellarisch. CSV nutzt weiterhin dieselben gefilterten Daten. Formulare und Dialoge haben größere Eingabefelder, umgebrochene Aktionen und gut erreichbare Speicherbuttons. Browser-/Gerätetest ist vor PKC-Übergabe weiterhin erforderlich.

Das Entfernen einer Neuigkeit archiviert ausschließlich den Beitrag. Bereits versendete persönliche Nachrichten bleiben davon unabhängig gespeichert und sichtbar. Es gibt keine automatische Bereinigung beim Entfernen; der Nachrichtenabruf ist nicht mehr auf die letzten 100 Einträge beschränkt.

## Inhaltsverwaltung: vier getrennte Arbeitsbereiche
„Inhalte verwalten“ startet mit vier Kacheln: **Texte & Kontakt**, **Fristen & Anreise**, **Unterkünfte**, **Dateien & Wiki**. Jede Kachel öffnet nur die passenden Formulare; eine Bereichsnavigation und „Alle Inhaltsbereiche“ ermöglichen den Wechsel. Texte und Anreise-Einstellungen haben je einen eigenen Speicherbutton. Es werden nur die Felder des geöffneten Bereichs gespeichert; die übrigen Einstellungen bleiben unverändert. Auch das Wiederherstellen früherer Einstellungen ist auf den geöffneten Bereich begrenzt. Unterkünfte, Dateien und Wiki-Seiten behalten ihre eigenen objektbezogenen Speicheraktionen. Rechte und Mitglieder-Vorschau bleiben erhalten.
