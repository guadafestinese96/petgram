import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { opcionesImagen } from '../common/imagenes.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';
import { TokenGuard } from './token.guard.js';
import { UsuarioActual } from './usuario-actual.decorator.js';
import type { UsuarioToken } from './usuario-token.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 201 Created. Recibe multipart/form-data: campos de texto + archivo "imagen" (opcional)
  @Post('registro')
  @UseInterceptors(FileInterceptor('imagen', opcionesImagen))
  registro(
    @Body() dto: RegistroDto,
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    return this.authService.registro(dto, imagen);
  }

  // 200 OK (login no crea nada, por eso no es 201). Credenciales malas => 401
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Header Authorization: Bearer <token>
  // Token válido => 200 con los datos del usuario. Inválido / vencido => 401
  @Post('autorizar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TokenGuard)
  autorizar(@UsuarioActual() usuario: UsuarioToken) {
    return this.authService.autorizar(usuario);
  }

  // Header Authorization: Bearer <token>
  // Token válido => 200 con un token nuevo (misma payload, vence en 15 minutos)
  @Post('refrescar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TokenGuard)
  refrescar(@UsuarioActual() usuario: UsuarioToken) {
    return this.authService.refrescar(usuario);
  }
}
