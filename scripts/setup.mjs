#!/usr/bin/env node
/**
 * One-time local setup.
 *
 * Creates the private root .env (Postgres container credentials) and api/.env
 * (DATABASE_URL and API settings) when they are missing. Existing files are
 * never overwritten and secrets are never printed.
 */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const log = (message) => process.stdout.write(`[setup] ${message}\n`);

function requireVersion(name, actual, major) {
  const actualMajor = Number(actual.replace(/^v/, "").split(".")[0]);
  if (actualMajor !== major) {
    throw new Error(`${name} ${major}.x is required; found ${actual}. Run: nvm install && nvm use`);
  }
}

requireVersion("Node.js", process.version, 24);

const rootEnvPath = join(root, ".env");
if (!existsSync(rootEnvPath)) {
  writeFileSync(
    rootEnvPath,
    [
      "POSTGRES_USER=team_building",
      `POSTGRES_PASSWORD=${randomBytes(18).toString("hex")}`,
      "POSTGRES_DB=team_building_mvp",
      "POSTGRES_PORT=5434",
      "",
    ].join("\n"),
    { mode: 0o600 },
  );
  log("Created .env with generated database credentials.");
} else {
  log("Kept existing .env.");
}

const rootEnv = Object.fromEntries(
  readFileSync(rootEnvPath, "utf8")
    .split("\n")
    .filter((line) => line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
);

const apiEnvPath = join(root, "api", ".env");
if (!existsSync(apiEnvPath)) {
  const url = `postgresql://${rootEnv.POSTGRES_USER}:${rootEnv.POSTGRES_PASSWORD}@127.0.0.1:${rootEnv.POSTGRES_PORT ?? 5434}/${rootEnv.POSTGRES_DB}`;
  const example = readFileSync(join(root, "api", ".env.example"), "utf8");
  writeFileSync(apiEnvPath, example.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${url}`), {
    mode: 0o600,
  });
  log("Created api/.env.");
} else {
  log("Kept existing api/.env.");
}

const run = (command) => {
  log(command);
  execSync(command, { cwd: root, stdio: "inherit" });
};

run("npm ci");
run("npm run db:up");
run("npm run build --workspace=@team-building-mvp/contracts");
run("npm run db:migrate");
log("Setup completed successfully. Start the API with `npm run dev:api` and the frontend with `npm run dev:frontend`.");
