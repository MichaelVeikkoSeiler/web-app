import { list } from "@vercel/blob";
import fs from "node:fs";

const envContent = fs.readFileSync(".env.local", "utf8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].replace(/^"|"$/g, "");
  }
}

let cursor;
const all = [];
do {
  const res = await list({ cursor, limit: 1000 });
  all.push(...res.blobs);
  cursor = res.cursor;
} while (cursor);

all.sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));

console.log(`Total blobs: ${all.length}`);
console.log("--- earliest 15 ---");
for (const b of all.slice(0, 15)) {
  console.log(b.uploadedAt, b.size, b.pathname, b.url);
}
