import { defineConfig } from "prisma/config";

// Scripts load api/.env explicitly; generating a client does not need a database.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
