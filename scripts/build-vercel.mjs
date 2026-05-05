import { spawnSync } from "node:child_process";

const isVercelBuild = process.env.VERCEL === "1";
const shouldRunMigrations =
  isVercelBuild && process.env.SKIP_VERCEL_MIGRATE !== "true";

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (shouldRunMigrations) {
  run("npx", [
    "prisma",
    "migrate",
    "deploy",
    "--schema",
    "prisma-postgres/schema.prisma",
  ]);
}

run("npx", [
  "prisma",
  "generate",
  "--schema",
  "prisma-postgres/schema.prisma",
]);

run("npx", ["next", "build"]);

if (!isVercelBuild) {
  run("npx", ["prisma", "generate"], {
    ...process.env,
    DATABASE_URL: process.env.LOCAL_DATABASE_URL ?? "file:./dev.db",
  });
}
