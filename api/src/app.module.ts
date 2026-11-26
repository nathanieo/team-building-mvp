import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module.js";
import { CohortsModule } from "./cohorts/cohorts.module.js";
import { HealthController } from "./health/health.controller.js";
import { JoinModule } from "./join/join.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";

/** Root module. Next MVP steps (student join, questionnaires, teams) add feature modules here. */
@Module({
  imports: [PrismaModule, AuthModule, CohortsModule, JoinModule],
  controllers: [HealthController],
})
export class AppModule {}
