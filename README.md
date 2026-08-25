# HORTTIA — Digitales Gartenjournal

Leistungsnachweis Wahlmodul «Viben & Coden», CAS AI in Mediaproduction, FHGR.

## Projektbeschreibung & Zielsetzung

HORTTIA ist ein privates, digitales Gartenjournal für meine Familie. Wir bewirtschaften gemeinsam einen Garten mit rund 80 Pflanzen, über 20 «Gartenbewohnern» (Tiere) und einem Dutzend Zonen (Beete, Töpfe, Balkon etc.) — bisher verteilt auf Gedächtnis, Zettel und Fotos auf verschiedenen Handys. Ziel der App: alles an einem Ort, gemeinsam nutzbar, mit Erinnerungen, die sich am echten Wetter orientieren statt an starren Kalendern.

Das ist bewusst kein generisches SaaS-Produkt, sondern ein konkreter, persönlicher Use-Case für einen einzelnen Haushalt — ohne Login/Mehrbenutzer-Trennung, weil es dafür in diesem Kontext keinen Bedarf gibt.

## Links

- **Live-App:** https://veikkosgarten.vercel.app
- **Marketing-Seite:** https://marketing-page-navy.vercel.app
- **Video-Walkthrough:** https://youtu.be/8od_EIsDFX8
- **Marketing-Seite Repository:** https://github.com/MichaelVeikkoSeiler/marketing-page

## Tech-Stack

| Bereich | Technologie |
|---|---|
| Framework | Next.js 16.3 (App Router, Server Actions) |
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Datenbank | Neon Postgres (serverless) via Drizzle ORM |
| Datei-Storage | Vercel Blob (Fotos) |
| KI-Funktionen | OpenAI API (`openai` SDK) — Bilderkennung, Recherche mit Websuche, Diagnose |
| Pflanzenerkennung | PlantNet API (primär), OpenAI Vision (Fallback bzw. für Tiere) |
| Validierung | Zod |
| Hosting | Vercel |

## Funktionsumfang

- **Pflanzen & Tiere:** Anlegen per Foto (automatische Arterkennung) oder manuelle Suche, mehrere Fotos mit manuell korrigierbarem Aufnahmedatum und per Drag-Reorder sortierbar, automatisch recherchierter Steckbrief (Herkunft, Pflege, Besonderheiten)
- **Zonen:** Gartenbereiche mit Lichtverhältnissen, Ausrichtung, Bodenart; Pflanzen/Tiere lassen sich zuordnen
- **Zonen-Konfliktanalyse:** Prüft automatisch, ob sich Pflanzen einer Zone um Licht, Wasser oder Platz konkurrenzieren oder der Boden nicht passt — Treffer erscheinen auf der Startseite
- **Bodencheck:** Geführter Fragebogen pro Zone, deterministisch ausgewertet (Bodenart, pH-Klasse, Drainage)
- **Plant Doc:** Foto-basierte Diagnose bei Pflanzenproblemen unter Einbezug von Wetterdaten und Pflegehistorie
- **Wetter-Integration:** Giess-/Pflegeerinnerungen berücksichtigen echte Niederschlagsdaten (Open-Meteo); 12-Tage-Übersicht mit Detailansicht pro Stunde
- **Notizen:** Für Pflanzen, Tiere und Zonen, zentral auf der Startseite zusammengeführt
- **Spiele:** Quiz (10 gemischte Fragen zu Foto-Erkennung, lateinischen Namen und Zonen-Zugehörigkeit), Pflanzen-Match (zwei Pflanzen im direkten Vergleich) und Detektiv (Multiple-Choice zum eigenen Garten) — alle auf Basis der eigenen Daten
- **Besonderes:** Automatisch zusammengestellte Sammlungen wie «Jetzt blüht's», «Dauerblüher» oder «Trockenheitshelden»
- **Divers:** Sammelbereich für Wetter, «Besonderes» und die Spiele

## Spec-Dokumentation

### Wie die Spezifikation entstanden ist

Die Spezifikation für HORTTIA wurde **im Dialog erarbeitet, nicht als separates Dokument abgelegt**: Zu Beginn habe ich meine Projektidee beschrieben und bin anschliessend rund 70 Rückfragen von Claude durchgegangen — zu Zielgruppe, Datenmodell, Funktionsumfang, Abgrenzung und technischen Entscheidungen. Diese strukturierte Befragung hat dieselbe Funktion erfüllt wie ein klassisches PRD: Am Ende stand ein klares, gemeinsames Bild davon, was gebaut wird und was nicht.

Rückblickend war genau dieser Schritt der wertvollste des ganzen Projekts (siehe Abschnitt «Persönliche Reflexion») — aber auch der Punkt, an dem ich heute anders vorgehen würde: Das Ergebnis dieses Dialogs hätte ich als Datei im Repository ablegen sollen, statt es nur im Chatverlauf zu haben.

### Das Ergebnis dieser Spezifikation

Nachträglich zusammengefasst — dies ist die Spezifikation, die aus dem Dialog hervorging und an der sich die Umsetzung orientiert hat:

| | |
|---|---|
| **Produkt in einem Satz** | HORTTIA hilft unserer Familie, den gemeinsamen Garten im Blick zu behalten, indem Pflanzen, Tiere und Zonen an einem Ort erfasst werden und Pflege-Erinnerungen sich am echten Wetter orientieren. |
| **Zielgruppe & Kontext** | Ein einzelner Haushalt (unsere Familie), Nutzung überwiegend am Handy, direkt im Garten. |
| **Kernfeatures** | Pflanzen & Tiere per Foto erfassen (automatische Arterkennung, KI-Steckbrief) · Zonen mit Standorteigenschaften · wetterabhängige Giess-/Pflegeerinnerungen · Plant Doc (Foto-Diagnose bei Problemen) · Notizen |
| **Out of Scope** | Kein Login/Mehrbenutzer-System · keine native App (läuft im Browser) · kein «Tier Doc» als Gegenstück zu Plant Doc · keine Pflegeplanung für Tiere |
| **Design-Richtung** | Ruhig und natürlich statt technisch: warme Erd- und Grüntöne, abgerundete Kacheln, grosse Fotos, Mobile-First. |
| **Technische Vorgaben** | Next.js + TypeScript auf Vercel, Postgres für Daten, Blob-Storage für Fotos, KI nur für Erkennung/Recherche/Diagnose — nicht für Pflegeentscheide. |

### Wie es danach weiterging

Ab dem ersten Prototyp wurde jede weitere Funktion in einer eigenen, meist sehr präzisen Nachricht spezifiziert statt in einem starren Gesamt-Lastenheft. Das hat sich als robuster erwiesen, weil sich Anforderungen beim Bauen weiterentwickelt haben (z.B. wurde der Bereich «Divers» erst nachträglich eingeführt, um «Wetter», «Besonderes» und die Spiele sinnvoll zusammenzufassen).

### Repräsentativer, effektiv genutzter Prompt

Der folgende Prompt hat direkt zu einer vollständigen, korrekt in die bestehende Architektur eingepassten neuen Funktion («Tiere») geführt, ohne Rückfragen zur technischen Umsetzung nötig zu machen:

> Tiere als Reiter-Icon zwischen Pflanzen und Zonen
> Layout wie Zonen, unter der Kachel steht der Tiername
> +-Button, damit man neue Tiere hinzufügen kann.
> Das Hinzufügen von Tieren soll von der Methodik gleich laufen wie bei den Pflanzen
> Tiere sollen auch den Zonen zugeordnet werden können.
> Ein Tier Doc wird es nicht geben, das kann hier ignoriert werden
> Tier-Asset: Mit einem Beschrieb wie bei den Pflanzen
> Pflege weglassen
> Mehrere Fotos sollen hinzugefügt werden können.
> Hochlade-Datum integrieren wie bei den Pflanzen
> Notizen integrieren

Warum das funktioniert hat: Jede Zeile verweist auf ein bereits bestehendes, bekanntes Muster in der App («wie bei den Pflanzen», «wie Zonen») statt es neu zu beschreiben, und grenzt den Umfang explizit ab (kein Tier Doc, keine Pflege). Das liess sich direkt in bestehende, bewährte Architektur-Entscheidungen übersetzen, statt eine neue zu erfinden.

## Entwicklungsprozess

### Aha-Moment

Der grösste Aha-Moment war zu sehen, wie sauber Claude mit Testdaten umgeht: Für neue Funktionen (z.B. beim Bereich «Tiere») hat Claude eigene Testfotos hochgeladen, die Funktion damit tatsächlich getestet — und die Testdaten danach wieder vollständig entfernt, um den Ursprungszustand herzustellen. Es wird also nicht einfach behauptet, dass etwas funktioniert, sondern mit echten (Test-)Daten verifiziert, ohne dabei die echten Familiendaten zu verschmutzen. Das hat mein Vertrauen in den Prozess deutlich gestärkt.

### Learnings / Prompting-Strategien

- **Anfangsphase mit vielen Rückfragen:** Beim Erfassen der ursprünglichen Anforderungen (PRD) kamen rund 70 Rückfragen von Claude. Diese habe ich grösstenteils per Screenshot festgehalten und bei Unsicherheit nochmals bei Claude nachgefragt, um sicherzugehen, wozu ich Ja oder Nein sage.
- **Sofortiges, sichtbares Testen:** Sowohl bei neuen Funktionen als auch bei Anpassungen testet Claude direkt im Browser und macht sichtbar, was gemacht wurde und ob es erfolgreich war — nicht erst auf Nachfrage.
- **Transparente Fehlerkommunikation:** Bugs werden offen benannt statt versteckt, zum Beispiel: *«Ich habe einen kleinen Bug gefunden: das Dropdown wählt keine Zone vor, wenn sich die verfügbaren Zonen nach einer Entfernung ändern. Ich behebe das.»* Das hat mein Vertrauen zusätzlich gestärkt, weil Probleme aktiv kommuniziert statt verschwiegen werden.
- **Kleine Details zählen:** Auch ein scheinbar simpler Wunsch wie eine neue Schriftart von Google Fonts wurde sauber und ohne Aufwand umgesetzt.
- **Konkret statt abstrakt:** Prompts, die den gewünschten Endzustand exemplarisch beschreiben («Layout wie Zonen, Text zentriert, 2-zeilig möglich») führen zu deutlich präziseren Ergebnissen als allgemeine Wünsche.
- **Bestehende Muster explizit referenzieren:** Formulierungen wie «gleiche Methodik wie bei X» sorgen dafür, dass neue Funktionen die Architektur bestehender Funktionen übernehmen, statt eine parallele, inkonsistente Lösung zu erzeugen.
- **Mein Workflow:** Ich prompte in Claude Code, Claude setzt um, ich beobachte den Prozess laufend mit. Danach committe und pushe ich selbst auf GitHub und kontrolliere die publizierte Seite. Dieser Ablauf hat sich für mich als sehr angenehm und nachvollziehbar erwiesen.
- **Marketing-Texte gegen den echten Code gegenprüfen:** Bei Formulierungen auf der Marketing-Seite, die mir zu konkret oder zu gut vorkamen (z.B. «Plant Doc vergleicht die Symptome mit dem Wetter der letzten Tage», «Ein Foto vom Untergrund genügt» beim Bodencheck), habe ich gezielt nachgefragt, ob das wirklich stimmt, statt es unhinterfragt stehen zu lassen. Claude hat das jeweils direkt im Quellcode verifiziert — einmal bestätigt (Wetterhistorie ist real implementiert), einmal widerlegt (Bodencheck ist kein Foto-, sondern ein geführter haptischer Test) und den Marketingtext entsprechend korrigiert. Diese Gegenprüfung würde ich für jedes Vibe-Coding-Projekt empfehlen, bevor Marketing-Texte online gehen.

**Ergänzende technische Erkenntnisse aus dem Entwicklungsprozess:**

- **Caching-Verwirrung:** Nach einem Datenbank-Skript-Update fehlten Änderungen auf der Live-Seite — der Verdacht fiel zunächst auf zwei getrennte Datenbanken. Tatsächlich war es dieselbe Datenbank; Next.js/Vercel hatten die Route nur serverseitig zwischengespeichert, und diese Zwischenspeicherung wird ausschliesslich durch echte Server Actions (`revalidatePath`) geleert, nicht durch direkte Datenbank-Skripte.
- **Touch-Geste vs. natives Scrollen:** Ein Umsortieren-per-Long-Press auf Kacheln kollidierte auf dem Handy mit dem normalen Scrollen. Die Lösung lag in einer einzigen CSS-Eigenschaft (`touch-action`), die von Anfang der Geste an gesetzt sein muss, damit der Browser sie nicht vorzeitig als Scrollen interpretiert.
- **Pixel-Verschiebung zwischen Bereichen:** Zwei Seiten sahen optisch leicht verschoben aus, obwohl der Code identisch war — Ursache war eine fehlende/vorhandene Scrollbar je nach Seitenlänge, behoben mit einer einzigen CSS-Zeile (`scrollbar-gutter: stable`).

## Security-Checkliste

Basierend auf der FHGR-Security-Checkliste für vibe-coded Apps (Stack: Claude Code, GitHub, Vercel, Neon).

**Erfüllt:**
- [x] Keine Secrets im Code oder in der Git-Historie (`git log` geprüft, `.env*` seit Beginn in `.gitignore`)
- [x] Keine `NEXT_PUBLIC_`-Variable enthält ein Geheimnis (es existiert keine)
- [x] API-Keys liegen ausschliesslich in den Vercel Environment Variables
- [x] Kein `dangerouslySetInnerHTML` im Code
- [x] Lockfile committed, `npm audit` ohne High/Critical (Stand Abgabe: 4 × «moderate», alle über `drizzle-kit` → `esbuild`; betrifft ausschliesslich den lokalen Entwicklungsserver, nicht die publizierte App)
- [x] Geheimnisse gelangen nicht ins Client-Bundle — nach `npm run build` alle 16 Werte aus `.env.local` gegen `.next/static/` geprüft, kein einziger Treffer
- [x] Foto-Upload-Endpunkt begrenzt: nur Bildformate (JPEG/PNG/WebP/HEIC), max. 30 MB, zufälliger Dateiname, Ablage im Blob-Storage statt im Public-Ordner
- [x] Alle Abhängigkeiten sind reale, etablierte Pakete (kein Slopsquatting-Verdacht)
- [x] GitHub Secret Scanning und Push Protection aktiviert — verhindert das versehentliche Pushen eines Schlüssels, statt ihn erst hinterher zu finden
- [x] Dependabot Alerts und Security Updates aktiviert (inkl. Dependency Graph als Voraussetzung)
- [x] Next.js auf aktueller Version (16.3), keine Middleware-basierte Auth-Logik (CVE-2025-29927 nicht relevant)
- [x] Security-Headers gesetzt (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security`) — in **beiden** Projekten, an den Live-URLs mit `curl -I` gegengeprüft
- [x] Publizierte URL im Inkognito-Fenster geprüft
- [x] Hartes Ausgabenlimit (50$/Monat) plus Spend-Alerts bei 80%/100% auf OpenAI gesetzt

**Bewusst nicht anwendbar (Begründung):**
- Login/Auth, Session-Cookies, Row-Level-Security, Autorisierung pro Route: Die App hat kein Mehrbenutzer-/Login-System — sie ist für den privaten, gemeinsamen Gebrauch innerhalb der Familie über einen einzigen geteilten Link gedacht, nicht öffentlich beworben. Es gibt daher keine Nutzerkonten, zwischen denen Daten getrennt werden müssten.
- Vercel Spend Management: Auf dem Hobby-Plan nicht verfügbar (Pro-Feature). Stattdessen greifen Vercels automatische Fair-Use-Grenzen mit automatischer Benachrichtigung.

**Offen / bewusst zurückgestellt:**
- Keine vollständige Content-Security-Policy — Risiko, damit unter Zeitdruck etwas an der laufenden App zu beschädigen, wurde höher eingeschätzt als der Sicherheitsgewinn in diesem Rahmen.
- Kein serverseitiges Rate-Limiting auf den KI-Aufrufen — durch das harte Ausgabenlimit bei OpenAI abgefedert.
- Der Foto-Upload-Endpunkt ist ohne Login erreichbar. Das ist die direkte Folge der bewussten Entscheidung gegen ein Benutzerkonto-System: Ohne Sessions gibt es nichts zu prüfen. Begrenzt wird das Risiko über Dateityp, Grössenlimit und die Tatsache, dass die URL nirgends beworben wird. Bei einer öffentlichen App wäre das der erste Punkt, den ich nachrüsten würde.

## GEO-Checkliste (Marketing-Seite)

Basierend auf der FHGR-GEO-Checkliste. Umgesetzt auf https://marketing-page-navy.vercel.app:

- [x] 3 echte Unterseiten (`/`, `/features`, `/faq`) statt Anker-Links auf einer Seite
- [x] Genau eine H1 pro Seite, eigene Meta-Title/-Description pro Seite
- [x] Schema.org JSON-LD: `WebApplication` auf der Startseite, `FAQPage` auf `/faq` (validiert)
- [x] Semantisches HTML (`header`, `nav`, `main`, `section`, `footer`)
- [x] robots.txt erlaubt alle Crawler explizit, inkl. KI-Crawler (GPTBot, PerplexityBot etc.)
- [x] Produktname überall identisch («HORTTIA by Veikko», vorher fälschlich noch «Seilers GartenApp» an mehreren Stellen)
- [x] Keine unbelegten Behauptungen (Testimonials klar als Konzept-Beispiel gekennzeichnet, falsche Aussage zu geplanten Store-Apps entfernt)

### Erkenntnis aus dem Praxistest

Der von der Checkliste empfohlene KI-Test («Frag ChatGPT: Was ist [deine URL]?») lieferte zunächst ein besonders lehrreiches Ergebnis: ChatGPT beantwortete die Frage im ersten Versuch mit erfundenen Detailinhalten (u.a. einer falschen E-Mail-Adresse) und widerrief das auf Nachfrage selbst als unzuverlässig — es hatte die Seite gar nicht wirklich geladen.

Um zu klären, ob das an unserer Seite lag, habe ich einen direkten HTTP-Request mit einem GPTBot-User-Agent gegen die Live-URL abgesetzt. Ergebnis: sauberes `HTTP 200`, keine Sperre, keine Weiterleitung — die Seite ist technisch uneingeschränkt erreichbar. Die Ursache liegt also nicht bei uns, sondern vermutlich daran, dass generische `*.vercel.app`-Subdomains (statt einer eigenen Domain) von KI-Such-Tools zurückhaltender behandelt bzw. noch nicht indexiert werden. Das deckt sich mit dem Hinweis der Checkliste selbst, dass KI-Antworten nicht deterministisch sind und mehrfach/mit unterschiedlichen Tools getestet werden sollten.

**Learning:** Ein KI-Tool, das eine plausible, aber falsche Antwort gibt, ist nicht dasselbe wie ein technisches Problem — bevor man an der eigenen Seite herumschraubt, lohnt sich ein direkter, tool-unabhängiger Test (z.B. `curl` mit dem passenden User-Agent).

Zur Bestätigung derselbe Test mit einem zweiten, unabhängigen Tool (Gemini): Diesmal keine erfundenen Fakten, aber auch kein echter Seiteninhalt — Gemini erkannte korrekt nur das URL-Muster («typische Vercel-Deployment-Adresse, vermutlich ein Landingpage-Template») und äusserte sich explizit unsicher, statt wie ChatGPT konkrete (falsche) Details zu erfinden. Zwei unterschiedliche Tools, zwei unterschiedliche Umgangsformen mit fehlendem Wissen — aber in beiden Fällen wurde der tatsächliche Seiteninhalt nicht gelesen. Das erhärtet den Befund: Eine frische, generische `*.vercel.app`-Subdomain ist aktuell noch nicht in den Wissensstand dieser Tools vorgedrungen, unabhängig von der technischen Korrektheit der Seite selbst.

### Follow-up-Test: gleiche Frage, einige Tage später

Derselbe Test («Was ist [URL]? Was bietet dieses Produkt?»), erneut mit ChatGPT und Gemini, in separaten, frischen Chats: Diesmal lasen **beide** Tools die Seite tatsächlich und fassten das Produkt inhaltlich korrekt zusammen (Zonen, Giesserinnerungen nach Wetter, Plant Doc, Foto-Journal). Das bestätigt die ursprüngliche These — die anfängliche Zurückhaltung lag an der frischen, generischen Subdomain, nicht an einem technischen Problem der Seite.

Interessanter als die reine Lesbarkeit war aber die inhaltliche Gewichtung: Beide Tools beschrieben HORTTIA primär als «Giess-/Pflege-Erinnerungs-App» und erwähnten Kernfunktionen wie die Zonen-Konfliktanalyse, die Tier-Erfassung oder das Quiz kaum bis gar nicht. ChatGPT benannte das sogar explizit selbst: *„Die Seite vermittelt HORTTIA stärker als Pflege-/Giessmanagement-App, als das Produkt tatsächlich angelegt ist.“*

**Learning:** GEO ist nicht nur «wird die Seite gelesen», sondern auch «kommt beim Lesen die richtige Gewichtung an». Die Startseiten-Auswahl (3 Feature-Teaser) und die Hero-Beschreibung haben bisher unbeabsichtigt nur einen Teil der App abgebildet (v.a. Giessen) und die eigentliche Differenzierung (Diagnose, Zonenkonflikte, Tiere) an den Rand gedrängt. Darauf hin wurden Hero-Text, Feature-Teaser-Auswahl und die vollständige Funktionsliste überarbeitet, um die Breite der App bereits im ersten Eindruck sichtbar zu machen.

## Persönliche Reflexion

Zu Beginn des Projekts faszinierte mich vor allem, dass ich mit Vibe Coding eine Web-App entwickeln kann, obwohl ich selbst kein Webentwickler bin. Im Verlauf der Arbeit wurde mir jedoch klar, dass die eigentliche Herausforderung nicht das Erzeugen von Code ist, sondern die KI richtig zu führen und ihre Ergebnisse beurteilen zu können.

Ein erster Aha-Moment entstand bereits beim Erstellen der PRD. Dabei erhielt ich rund 70 Rückfragen. Bei einigen technischen Entscheidungen konnte ich die Konsequenzen zunächst nicht einschätzen und holte deshalb zusätzliche Erklärungen ein. Mir wurde dabei bewusst, dass ich Entscheidungen nicht einfach bestätigen sollte, nur weil mir die KI eine plausible Lösung vorschlägt. Eine gute Spezifikation, genügend Kontext und klare Anforderungen sind entscheidend.

Beeindruckt hat mich, wie selbstständig Claude bei der Entwicklung vorging: Änderungen wurden umgesetzt und getestet, Fehler teilweise eigenständig erkannt und behoben. Gleichzeitig bemerkte ich eine interessante Veränderung bei mir selbst: **Je mehr Zeit ich bereits in die App investiert hatte, desto vorsichtiger wurde ich.** Bei grösseren Änderungen schrieb ich teilweise ausdrücklich: «Mach noch nichts – sag mir zuerst, ob dies risikofrei umsetzbar ist.» Aus anfänglichem Ausprobieren wurde zunehmend ein kontrollierter Entwicklungsprozess.

Auch mein Prompting wurde differenzierter. Ich lernte beispielsweise, Anforderungen für Mobile und Desktop teilweise getrennt zu formulieren. Zudem wurde mir bewusst, wie wichtig logisch aufgebaute und verständlich bezeichnete Commits sind. Dadurch lassen sich Änderungen später besser nachvollziehen und bei Problemen rekonstruieren.

Die Geschwindigkeit von Vibe Coding sehe ich gleichzeitig als Chance und Risiko. Funktionen können sehr schnell ergänzt werden, genauso können aber Inkonsistenzen und ein «Vibe Code Hangover» entstehen. Die KI nimmt mir zwar einen grossen Teil des Programmierens ab, **nicht aber das Denken, Kontrollieren und die Verantwortung für das Ergebnis.**

Nach der intensiven Arbeit würde mich deshalb besonders interessieren, wie ich ein zweites Projekt heute von Grund auf anders aufbauen würde: von Spezifikation und Architektur über eine saubere Entwicklungsstrategie bis zur definitiven Publikation unter einer eigenen Domain sowie der anschliessenden Vermarktung mit SEO und GEO. Genau darin sehe ich für mich den nächsten Lernschritt.

## Quellen

- GEO-Checkliste: Selbst-Audit deiner Marketing-Seiten (FHGR, Wahlmodul «Viben & Coden»)
- Security-Checkliste für vibe-coded Apps (FHGR, Wahlmodul «Viben & Coden»)
- [Next.js Dokumentation](https://nextjs.org/docs)
- [Drizzle ORM Dokumentation](https://orm.drizzle.team)
- [Vercel Dokumentation](https://vercel.com/docs)
