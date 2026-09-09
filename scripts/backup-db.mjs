/**
 * Sichert den kompletten Inhalt der Datenbank in einen Ordner ausserhalb des Repos.
 *
 * Aufruf:  node scripts/backup-db.mjs [Zielordner]
 *
 * Bewusst ohne pg_dump: Das Projekt hat den Neon-Treiber ohnehin als Abhängigkeit,
 * damit läuft das Backup auf jedem Rechner ohne Zusatzinstallation.
 *
 * Geschrieben wird pro Tabelle eine JSON-Datei plus ein manifest.json mit
 * Zeilenzahlen, Sequenzständen und dem Git-Commit — Letzteres, damit man später
 * weiss, zu welchem Codestand die Daten passen.
 */
import { neon } from "@neondatabase/serverless";
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { config } from "dotenv";

config({ path: ".env.local" });

const DEFAULT_DIR = resolve(process.cwd(), "..", "Backups");

function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}

function gitCommit() {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL fehlt (.env.local).");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  const outRoot = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_DIR;
  const outDir = join(outRoot, `horttia_${timestamp()}`);
  mkdirSync(join(outDir, "data"), { recursive: true });

  const tables = (
    await sql`select table_name from information_schema.tables
              where table_schema = 'public' and table_type = 'BASE TABLE'
              order by table_name`
  ).map((r) => r.table_name);

  const counts = {};
  const sequences = {};

  for (const table of tables) {
    const rows = await sql.query(`select * from "${table}"`);
    counts[table] = rows.length;
    writeFileSync(join(outDir, "data", `${table}.json`), JSON.stringify(rows, null, 2));

    // Sequenzstand mitsichern, sonst kollidieren nach dem Zurückspielen neue IDs.
    const seq = await sql.query(`select pg_get_serial_sequence('"${table}"', 'id') as seq`);
    if (seq[0]?.seq) {
      const val = await sql.query(`select last_value::int as v, is_called from "${seq[0].seq.replace(/^public\./, "")}"`);
      sequences[table] = { name: seq[0].seq, lastValue: val[0].v, isCalled: val[0].is_called };
    }
    console.log(`  ${table.padEnd(28)}${String(rows.length).padStart(6)} Zeilen`);
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    gitCommit: gitCommit(),
    postgres: (await sql`select version()`)[0].version.split(",")[0],
    tables,
    counts,
    sequences,
    totalRows: Object.values(counts).reduce((a, b) => a + b, 0),
  };
  writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(`\n  ${manifest.totalRows} Zeilen gesichert nach:\n  ${outDir}`);
}

main().catch((e) => {
  console.error("Backup fehlgeschlagen:", e.message);
  process.exit(1);
});
