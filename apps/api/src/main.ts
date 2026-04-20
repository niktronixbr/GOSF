import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ValidationPipe, Logger } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false })
  );

  app.setGlobalPrefix("api/v1");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  app.enableCors({
    origin: process.env.WEB_URL ?? "http://localhost:3000",
    credentials: true,
  });

  const port = process.env.API_PORT ?? 3001;
  await app.listen(port, "0.0.0.0");
  logger.log(`GOSF API running on http://localhost:${port}/api/v1`);
}

bootstrap();
