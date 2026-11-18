import type { NestExpressApplication } from "@nestjs/platform-express";
import { ApiExceptionFilter } from "./http/api-exception.filter.js";

export const API_GLOBAL_PREFIX = "api";

/** Shared by production startup and HTTP tests so both run the same setup. */
export function configureApplication(application: NestExpressApplication): void {
  application.useBodyParser("json", { limit: "64kb" });
  application.useGlobalFilters(new ApiExceptionFilter());
  application.setGlobalPrefix(API_GLOBAL_PREFIX);
  application.disable("x-powered-by");
}
