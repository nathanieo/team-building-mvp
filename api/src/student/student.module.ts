import { Module } from "@nestjs/common";
import { StudentController } from "./student.controller.js";
import { StudentGuard } from "./student.guard.js";
import { StudentService } from "./student.service.js";

@Module({
  controllers: [StudentController],
  providers: [StudentService, StudentGuard],
})
export class StudentModule {}
