import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { opcionesImagen } from '../common/imagenes.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';

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
}
