import { Module } from "@nestjs/common";
import { JoinController } from "./join.controller.js";
import { JoinService } from "./join.service.js";

@Module({
  controllers: [JoinController],
  providers: [JoinService],
})
export class JoinModule {}
