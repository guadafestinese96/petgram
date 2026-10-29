import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UsuarioToken } from './usuario-token.js';

// Uso:  crear(@UsuarioActual() usuario: UsuarioToken) { ... }
export const UsuarioActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioToken =>
    ctx.switchToHttp().getRequest<{ usuario: UsuarioToken }>().usuario,
);
