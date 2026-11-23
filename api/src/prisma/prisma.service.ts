import { Inject, Injectable } from "@nestjs/common";
import type { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { API_CONFIG } from "../config.js";
import type { ApiConfig } from "../config.js";

/** One shared Prisma client for the whole API. */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(API_CONFIG) config: ApiConfig) {
    super({
      adapter: new PrismaPg({
        connectionString: config.databaseUrl,
        max: 10,
        connectionTimeoutMillis: 5_000,
      }),
      log: [],
    });
  }

  /** Fails startup early with a clear message instead of on the first request. */
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      await this.$queryRaw`SELECT 1 FROM "facilitators" LIMIT 1`;
    } catch (caught) {
      await this.$disconnect();
      // The driver's reason (no credentials in it) says whether it's the connection or missing tables.
      const reason = caught instanceof Error ? caught.message.split("\n").at(-1) : String(caught);
      throw new Error(
        `Database initialization failed (${reason}). Start PostgreSQL (npm run db:up) and run npm run db:migrate.`,
        { cause: caught },
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
