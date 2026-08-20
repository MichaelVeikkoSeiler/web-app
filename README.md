# HORTTIA — Digitales Gartenjournal

Leistungsnachweis Wahlmodul «Viben & Coden», CAS AI in Mediaproduction, FHGR.

## Projektbeschreibung & Zielsetzung

HORTTIA ist ein privates, digitales Gartenjournal für meine Familie. Wir bewirtschaften gemeinsam einen Garten mit rund 80 Pflanzen, über 20 «Gartenbewohnern» (Tiere) und einem Dutzend Zonen (Beete, Töpfe, Balkon etc.) — bisher verteilt auf Gedächtnis, Zettel und Fotos auf verschiedenen Handys. Ziel der App: alles an einem Ort, gemeinsam nutzbar, mit Erinnerungen, die sich am echten Wetter orientieren statt an starren Kalendern.

Das ist bewusst kein generisches SaaS-Produkt, sondern ein konkreter, persönlicher Use-Case für einen einzelnen Haushalt — ohne Login/Mehrbenutzer-Trennung, weil es dafür in diesem Kontext keinen Bedarf gibt.

## Links

- **Live-App:** https://veikkosgarten.vercel.app
- **Marketing-Seite:** https://marketing-page-navy.vercel.app
- **Video-Walkthrough:** _[wird ergänzt]_
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
- **Bodencheck:** Geführter Fragebogen pro Zone, deterministisch ausgewertet (Bodenart, pH-Klasse, Drainage)
- **Plant Doc:** Foto-basierte Diagnose bei Pflanzenproblemen unter Einbezug von Wetterdaten und Pflegehistorie
- **Wetter-Integration:** Giess-/Pflegeerinnerungen berücksichtigen echte Niederschlagsdaten (Open-Meteo)
- **Notizen:** Für Pflanzen, Tiere und Zonen, zentral auf der Startseite zusammengeführt
- **Quiz:** Kleines Lernspiel mit den eigenen Pflanzenfotos
- **Divers:** Sammelbereich für Wetter, Besonderheiten-Auswertungen und das Quiz

## "Spec"-Dokumentation

Es gab keine einzelne, vorab fixierte Spezifikationsdatei. Stattdessen wurde jede Funktion in einer eigenen, meist sehr präzisen Nachricht spezifiziert — das hat sich in der Praxis als robusterer Ansatz erwiesen als ein starres Lastenheft, weil sich Anforderungen beim Bauen weiterentwickelt haben (z.B. wurde der Bereich «Divers» erst nachträglich eingeführt, um «Wetter» und «Speziell» sinnvoll zusammenzufassen).

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
- [x] Lockfile committed, `npm audit` — 0 Vulnerabilities
- [x] Alle Abhängigkeiten sind reale, etablierte Pakete (kein Slopsquatting-Verdacht)
- [x] Next.js auf aktueller Version (16.3), keine Middleware-basierte Auth-Logik (CVE-2025-29927 nicht relevant)
- [x] Security-Headers gesetzt (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security`)
- [x] Publizierte URL im Inkognito-Fenster geprüft
- [x] Hartes Ausgabenlimit (50$/Monat) plus Spend-Alerts bei 80%/100% auf OpenAI gesetzt

**Bewusst nicht anwendbar (Begründung):**
- Login/Auth, Session-Cookies, Row-Level-Security, Autorisierung pro Route: Die App hat kein Mehrbenutzer-/Login-System — sie ist für den privaten, gemeinsamen Gebrauch innerhalb der Familie über einen einzigen geteilten Link gedacht, nicht öffentlich beworben. Es gibt daher keine Nutzerkonten, zwischen denen Daten getrennt werden müssten.
- Vercel Spend Management: Auf dem Hobby-Plan nicht verfügbar (Pro-Feature). Stattdessen greifen Vercels automatische Fair-Use-Grenzen mit automatischer Benachrichtigung.

**Offen / bewusst zurückgestellt:**
- Keine vollständige Content-Security-Policy — Risiko, damit unter Zeitdruck etwas an der laufenden App zu beschädigen, wurde höher eingeschätzt als der Sicherheitsgewinn in diesem Rahmen.
- Kein serverseitiges Rate-Limiting auf den KI-Aufrufen — durch das harte Ausgabenlimit bei OpenAI abgefedert.

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

## Persönliche Reflexion

_[In eigenen Worten ergänzen — z.B.: Was hat überrascht? Was würdest du beim nächsten Projekt anders machen? Wie hat sich dein Vertrauen ins Vibe-Coding über das Projekt hinweg verändert?]_

## Quellen

- GEO-Checkliste: Selbst-Audit deiner Marketing-Seiten (FHGR, Wahlmodul «Viben & Coden»)
- Security-Checkliste für vibe-coded Apps (FHGR, Wahlmodul «Viben & Coden»)
- [Next.js Dokumentation](https://nextjs.org/docs)
- [Drizzle ORM Dokumentation](https://orm.drizzle.team)
- [Vercel Dokumentation](https://vercel.com/docs)
