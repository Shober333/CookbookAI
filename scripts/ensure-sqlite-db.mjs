import { mkdirSync, existsSync, closeSync, openSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

if (!databaseUrl.startsWith("file:")) {
  process.exit(0);
}

const rawPath = databaseUrl.slice("file:".length);
const schemaDir = resolve("prisma");
const dbPath = rawPath.startsWith("/")
  ? rawPath
  : resolve(schemaDir, rawPath);

mkdirSync(dirname(dbPath), { recursive: true });

if (!existsSync(dbPath)) {
  closeSync(openSync(dbPath, "w"));
}
