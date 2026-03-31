/* global console, process, require */
/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require("node:child_process");
const { config: dotenvConfig } = require("dotenv");

dotenvConfig({ path: ".env.local", quiet: true });
dotenvConfig({ path: ".env", quiet: true });

const command = process.argv.slice(2).join(" ").trim();

if (!command) {
  console.error("Nenhum comando foi informado para executar com DIRECT_URL.");
  process.exit(1);
}

const directUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!directUrl) {
  console.error("DIRECT_URL ou DATABASE_URL precisam estar definidos.");
  process.exit(1);
}

execSync(command, {
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: directUrl,
  },
});
