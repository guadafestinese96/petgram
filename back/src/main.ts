import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Permite que el front (Angular) consuma la API
  app.enableCors({ origin: process.env.FRONT_URL ?? 'http://localhost:4200' });

  // whitelist: descarta cualquier campo que no esté en el DTO (ej: "perfil" en el registro)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Sirve las imágenes guardadas: http://localhost:3000/uploads/perfiles/xxx.jpg
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
