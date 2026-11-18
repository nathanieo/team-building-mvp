import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module.js";
import { API_CONFIG } from "./config.js";
import type { ApiConfig } from "./config.js";
import { configureApplication } from "./configure-application.js";

async function bootstrap(): Promise<void> {
  const application = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  configureApplication(application);
  application.enableShutdownHooks();

  const config = application.get<ApiConfig>(API_CONFIG);
  await application.listen(config.port, config.host);
  process.stdout.write(`[api] Listening on http://${config.host}:${config.port}/api\n`);
}

await bootstrap();
