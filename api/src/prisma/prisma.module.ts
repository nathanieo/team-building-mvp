import { Global, Module } from "@nestjs/common";
import { API_CONFIG, readApiConfig } from "../config.js";
import { PrismaService } from "./prisma.service.js";

/** Provides configuration and the database client to every feature module. */
@Global()
@Module({
  providers: [
    { provide: API_CONFIG, useFactory: () => readApiConfig(process.env) },
    PrismaService,
  ],
  exports: [API_CONFIG, PrismaService],
})
export class PrismaModule {}
