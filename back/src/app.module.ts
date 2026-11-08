import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { PublicacionesModule } from './publicaciones/publicaciones.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri:
          config.get<string>('MONGO_URI') ??
          'mongodb://localhost:27017/red-social',
        // Si no puede conectarse a Mongo, falla rápido y deja el motivo en los logs
        // (en lugar de quedarse reintentando varios minutos sin responder).
        serverSelectionTimeoutMS: 8000,
        retryAttempts: 2,
        retryDelay: 1000,
      }),
    }),
    UsuariosModule,
    AuthModule,
    PublicacionesModule,
  ],
})
export class AppModule {}
