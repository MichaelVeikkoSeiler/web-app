import { neon } from "@neondatabase/serverless";
import fs from "node:fs";

const envContent = fs.readFileSync(".env.local", "utf8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].replace(/^"|"$/g, "");
  }
}

const sql = neon(process.env.DATABASE_URL);

const candidates = [
  "https://dasp1yozpnbpdp6d.public.blob.vercel-storage.com/ChatGPT%20Image%208.%20Aug.%202026%2C%2011_29_09-F4KzorkQm8DOj4AfTtoWSpC1OACizV.png",
];

for (const url of candidates) {
  const plantPhoto = await sql`select id, plant_id from plant_photos where blob_url = ${url}`;
  const zone = await sql`select id from zones where image_url = ${url}`;
  const heroImg = await sql`select id from hero_images where blob_url = ${url}`;
  console.log(url);
  console.log("  plant_photos:", plantPhoto);
  console.log("  zones:", zone);
  console.log("  hero_images:", heroImg);
}

const settingsRow = await sql`select * from settings limit 1`;
console.log("settings:", settingsRow);
