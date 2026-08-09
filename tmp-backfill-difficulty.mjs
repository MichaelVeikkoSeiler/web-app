import { readFileSync } from "node:fs";
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);
const { enrichPlant } = await import("./lib/enrichment.ts");

const rows = await sql`select id, scientific_name from plants order by id`;
console.log(`Backfilling careDifficulty for ${rows.length} plants...`);

let ok = 0;
let fail = 0;
for (const row of rows) {
  try {
    await enrichPlant(row.id);
    const [check] = await sql`select care_difficulty from plants where id = ${row.id}`;
    if (check.care_difficulty != null) {
      ok++;
      console.log(`OK  #${row.id} ${row.scientific_name} -> difficulty ${check.care_difficulty}`);
    } else {
      fail++;
      console.log(`WARN #${row.id} ${row.scientific_name} -> no difficulty set`);
    }
  } catch (e) {
    fail++;
    console.log(`FAIL #${row.id} ${row.scientific_name}: ${e?.message ?? e}`);
  }
}

console.log(`Done. ok=${ok} fail=${fail} total=${rows.length}`);
