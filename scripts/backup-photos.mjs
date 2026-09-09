/**
 * Lädt alle in der Datenbank referenzierten Fotos aus dem Vercel-Blob-Speicher.
 *
 * Aufruf:  node scripts/backup-photos.mjs <Backup-Ordner>
 *
 * Die Dateien landen in einem gemeinsamen photos/-Ordner neben den Backups und
 * werden über ihren (eindeutigen) Blob-Dateinamen dedupliziert: Ein zweites
 * Backup lädt nur noch neu hinzugekommene Bilder. Das spart bei ~400 MB
 * Bestand jede Menge Zeit und Speicher.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";

const backupDir = process.argv[2] ? resolve(process.argv[2]) : null;
if (!backupDir || !existsSync(backupDir)) {
  console.error("Bitte den Backup-Ordner angeben, z. B.:\n  node scripts/backup-photos.mjs ../Backups/horttia_2026-09-09_1555");
  process.exit(1);
}

const photoDir = join(dirname(backupDir), "photos");
mkdirSync(photoDir, { recursive: true });

// Alle Blob-URLs aus den gesicherten Tabellen einsammeln
const urls = new Set();
const dataDir = join(backupDir, "data");
for (const file of readdirSync(dataDir)) {
  for (const row of JSON.parse(readFileSync(join(dataDir, file), "utf8"))) {
    for (const value of Object.values(row)) {
      if (typeof value === "string" && value.includes("blob.vercel-storage.com")) urls.add(value);
    }
  }
}

const list = [...urls];
console.log(`  ${list.length} Foto-URLs gefunden`);

let geladen = 0, vorhanden = 0, bytes = 0;
const verwaist = [];   // in der DB referenziert, im Blob-Speicher nicht mehr vorhanden
const fehler = [];     // echte Fehler (Netz, Rechte, ...)
const index = {};

for (const [i, url] of list.entries()) {
  const name = decodeURIComponent(new URL(url).pathname.slice(1));
  const target = join(photoDir, name);
  index[url] = name;

  if (existsSync(target) && statSync(target).size > 0) {
    vorhanden++;
    bytes += statSync(target).size;
    continue;
  }
  try {
    const res = await fetch(url);
    // 404 heisst: Der Eintrag zeigt auf eine Datei, die es nicht mehr gibt.
    // Das ist eine Altlast in den Daten, kein Fehler des Backups.
    if (res.status === 404) { verwaist.push(name); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(target, buf);
    bytes += buf.length;
    geladen++;
  } catch (e) {
    console.error(`  FEHLER bei ${name}: ${e.message}`);
    fehler.push(name);
  }
  if ((i + 1) % 25 === 0) console.log(`  ... ${i + 1}/${list.length}`);
}

// Zuordnung URL -> Datei, damit man beim Zurückspielen weiss, welches Bild wohin gehört
writeFileSync(join(backupDir, "photo-index.json"), JSON.stringify(index, null, 2));

console.log(`\n  neu geladen: ${geladen}   bereits vorhanden: ${vorhanden}`);
console.log(`  Gesamt: ${(bytes / 1024 / 1024).toFixed(0)} MB in ${photoDir}`);

if (verwaist.length > 0) {
  console.log(`\n  Hinweis: ${verwaist.length} Eintrag/Einträge zeigen auf gelöschte Dateien (kein Backup-Fehler):`);
  for (const n of verwaist) console.log(`    ${n}`);
}
if (fehler.length > 0) {
  console.error(`\n  ${fehler.length} Datei(en) konnten nicht geladen werden — Backup unvollständig!`);
  process.exit(1);
}
console.log("\n  Fotosicherung vollständig.");
