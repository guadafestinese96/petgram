import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import type { UsuarioToken } from './usuario-token.js';

// Protege las rutas: exige el header  Authorization: Bearer <token>
// Si el token falta, es inválido o está vencido => 401 Unauthorized
@Injectable()
export class TokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<Request & { usuario?: UsuarioToken }>();

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Falta el token de autenticación.');
    }

    try {
      const payload = jwt.verify(
        authHeader.slice(7),
        this.config.getOrThrow<string>('JWT_SECRET'),
        { issuer: 'RED-SOCIAL' },
      ) as jwt.JwtPayload;

      // Deja al usuario disponible para el controller (ver @UsuarioActual)
      req.usuario = {
        sub: String(payload.sub),
        nombreUsuario: payload['nombreUsuario'],
        perfil: payload['perfil'],
      };
      return true;
    } catch {
      throw new UnauthorizedException('El token es inválido o está vencido.');
    }
  }
}
