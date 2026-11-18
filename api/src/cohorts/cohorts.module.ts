import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { CohortsController } from "./cohorts.controller.js";
import { CohortsService } from "./cohorts.service.js";

@Module({
  imports: [AuthModule],
  controllers: [CohortsController],
  providers: [CohortsService],
})
export class CohortsModule {}
