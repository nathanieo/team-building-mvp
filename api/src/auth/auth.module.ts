import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { FacilitatorGuard } from "./facilitator.guard.js";

@Module({
  controllers: [AuthController],
  providers: [AuthService, FacilitatorGuard],
  exports: [AuthService, FacilitatorGuard],
})
export class AuthModule {}
