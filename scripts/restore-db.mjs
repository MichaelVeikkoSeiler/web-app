/**
 * Spielt ein Backup zurück in die Datenbank.
 *
 *   node scripts/restore-db.mjs <Backup-Ordner>                → Trockenlauf (ändert nichts)
 *   node scripts/restore-db.mjs <Backup-Ordner> --test         → Probelauf in Kopietabellen (ändert nichts an echten Daten)
 *   node scripts/restore-db.mjs <Backup-Ordner> --confirm      → ECHTE Rückspielung (überschreibt alles!)
 *
 * Alles läuft in EINER Transaktion: Entweder das ganze Backup ist zurückgespielt,
 * oder es bleibt exakt beim Zustand davor. Ein Abbruch auf halber Strecke,
 * der halb alte und halb neue Daten hinterlässt, ist damit ausgeschlossen.
 */
import { neon } from "@neondatabase/serverless";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { config } from "dotenv";

config({ path: ".env.local" });

const dir = process.argv[2] ? resolve(process.argv[2]) : null;
const confirm = process.argv.includes("--confirm");
const testMode = process.argv.includes("--test");
const TEST_PREFIX = "zz_restoretest_";

if (!dir || !existsSync(join(dir, "manifest.json"))) {
  console.error("Bitte einen Backup-Ordner mit manifest.json angeben.");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
const sql = neon(process.env.DATABASE_URL);

/** Tabellen so sortieren, dass Eltern vor Kindern eingefügt werden. */
async function insertOrder(tables) {
  const fks = await sql`select tc.table_name as child, ccu.table_name as parent
    from information_schema.table_constraints tc
    join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name
    where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'`;

  const deps = new Map(tables.map((t) => [t, new Set()]));
  for (const { child, parent } of fks) {
    if (child !== parent && deps.has(child)) deps.get(child).add(parent);
  }
  const done = [], seen = new Set();
  while (done.length < tables.length) {
    const next = tables.filter((t) => !seen.has(t) && [...deps.get(t)].every((p) => seen.has(p)));
    if (next.length === 0) throw new Error("Zyklus in den Fremdschlüsseln — Reihenfolge nicht bestimmbar");
    for (const t of next) { done.push(t); seen.add(t); }
  }
  return done;
}

async function columnTypes(table) {
  const rows = await sql.query(
    `select column_name, data_type from information_schema.columns
     where table_schema='public' and table_name=$1`, [table]);
  return Object.fromEntries(rows.map((r) => [r.column_name, r.data_type]));
}

async function main() {
  const order = await insertOrder(manifest.tables);

  console.log(`Backup vom ${new Date(manifest.createdAt).toLocaleString("de-CH")}`);
  console.log(`Commit ${manifest.gitCommit?.slice(0, 7) ?? "unbekannt"} · ${manifest.totalRows} Zeilen\n`);

  if (!confirm && !testMode) {
    console.log("TROCKENLAUF — es wird nichts verändert.\n");
    for (const t of order) console.log(`  ${t.padEnd(28)}${String(manifest.counts[t]).padStart(6)} Zeilen`);
    console.log("\n  --test    Probelauf in Kopietabellen (sicher)");
    console.log("  --confirm ECHTE Rückspielung (überschreibt die Datenbank)");
    return;
  }

  const name = (t) => (testMode ? `${TEST_PREFIX}${t}` : t);
  const statements = [];

  if (testMode) {
    console.log("PROBELAUF — schreibt ausschliesslich in Kopietabellen.\n");
    for (const t of order) {
      statements.push(sql.query(`drop table if exists "${name(t)}"`));
      // Struktur ohne Daten und ohne Fremdschlüssel übernehmen
      statements.push(sql.query(`create table "${name(t)}" (like "${t}" including defaults)`));
    }
  } else {
    console.log("ECHTE RÜCKSPIELUNG — die aktuelle Datenbank wird überschrieben.\n");
    for (const t of [...order].reverse()) statements.push(sql.query(`delete from "${t}"`));
  }

  for (const t of order) {
    const rows = JSON.parse(readFileSync(join(dir, "data", `${t}.json`), "utf8"));
    if (rows.length === 0) continue;
    const types = await columnTypes(t);
    const cols = Object.keys(rows[0]);
    const colList = cols.map((c) => `"${c}"`).join(", ");

    for (const row of rows) {
      const values = cols.map((c) => {
        const v = row[c];
        const isJson = (types[c] || "").includes("json");
        return isJson && v !== null && typeof v === "object" ? JSON.stringify(v) : v;
      });
      const params = cols.map((_, i) => `$${i + 1}`).join(", ");
      statements.push(sql.query(`insert into "${name(t)}" (${colList}) values (${params})`, values));
    }
    console.log(`  ${t.padEnd(28)}${String(rows.length).padStart(6)} Zeilen vorbereitet`);
  }

  if (!testMode) {
    for (const seq of Object.values(manifest.sequences ?? {})) {
      statements.push(sql.query(`select setval($1, $2, $3)`, [seq.name, seq.lastValue, seq.isCalled]));
    }
  }

  console.log(`\n  ${statements.length} Anweisungen in einer Transaktion ...`);
  await sql.transaction(statements);
  console.log("  Transaktion erfolgreich.");

  // Gegenprobe: stimmen die Zeilenzahlen?
  let ok = true;
  for (const t of order) {
    const r = await sql.query(`select count(*)::int as n from "${name(t)}"`);
    if (r[0].n !== manifest.counts[t]) {
      console.error(`  ABWEICHUNG ${t}: ${r[0].n} statt ${manifest.counts[t]}`);
      ok = false;
    }
  }
  console.log(ok ? "  Gegenprobe: alle Zeilenzahlen stimmen." : "  Gegenprobe FEHLGESCHLAGEN.");

  if (testMode) {
    for (const t of order) await sql.query(`drop table if exists "${name(t)}"`);
    console.log("  Kopietabellen wieder entfernt.");
  }
  if (!ok) process.exit(1);
}

main().catch((e) => { console.error("Fehlgeschlagen:", e.message); process.exit(1); });
