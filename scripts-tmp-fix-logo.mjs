import { neon } from "@neondatabase/serverless";
import { del } from "@vercel/blob";
import fs from "node:fs";

const envContent = fs.readFileSync(".env.local", "utf8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].replace(/^"|"$/g, "");
  }
}

const sql = neon(process.env.DATABASE_URL);

const originalLogoUrl =
  "https://dasp1yozpnbpdp6d.public.blob.vercel-storage.com/ChatGPT%20Image%208.%20Aug.%202026%2C%2011_29_09-F4KzorkQm8DOj4AfTtoWSpC1OACizV.png";
const wrongTestUrl =
  "https://dasp1yozpnbpdp6d.public.blob.vercel-storage.com/hero-test-MAdq4ZbWJ1LPOdi9zdbKHSbVcXOHtI.png";

const before = await sql`select logo_url from settings where id = 1`;
console.log("before:", before);

await sql`update settings set logo_url = ${originalLogoUrl}, updated_at = now() where id = 1`;

const after = await sql`select logo_url from settings where id = 1`;
console.log("after:", after);

await del(wrongTestUrl);
console.log("deleted test blob:", wrongTestUrl);
