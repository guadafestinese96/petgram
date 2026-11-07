import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { UsuarioToken } from './usuario-token.js';

// Se usa SIEMPRE después del TokenGuard:  @UseGuards(TokenGuard, AdminGuard)
// El TokenGuard ya validó el JWT y dejó el usuario en req.usuario.
// Si el perfil del token no es "administrador" => 403 Forbidden
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<{ usuario?: UsuarioToken }>();

    if (req.usuario?.perfil !== 'administrador') {
      throw new ForbiddenException(
        'Solo un administrador puede realizar esta acción.',
      );
    }
    return true;
  }
}
