import { config as dotenvConfig } from "dotenv";
import { defineConfig } from "prisma/config";

dotenvConfig({ path: ".env.local", quiet: true });
dotenvConfig({ path: ".env", quiet: true });

process.env.DATABASE_URL ??=
  "postgresql://postgres:postgres@localhost:5432/maquinateam?schema=public";
process.env.DIRECT_URL ??= process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
