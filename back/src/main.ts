import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Permite que el front (Angular) consuma la API
  app.enableCors({ origin: process.env.FRONT_URL ?? 'http://localhost:4200' });

  // whitelist: descarta los campos que no están en el DTO
  // transform: convierte los query params (?limit=5) al tipo del DTO (number) y aplica los @Transform
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Sirve las imágenes guardadas: http://localhost:3000/uploads/publicaciones/xxx.jpg
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  await app.listen(process.env.PORT ?? 3000);
}
// Sin "await": Vercel importa este archivo y espera a que la app escuche (app.listen).
// Con un await arriba de todo, el import nunca termina y la función queda colgada.
void bootstrap();
