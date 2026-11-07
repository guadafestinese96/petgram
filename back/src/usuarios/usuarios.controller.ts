import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from '../auth/admin.guard.js';
import { TokenGuard } from '../auth/token.guard.js';
import { UsuarioActual } from '../auth/usuario-actual.decorator.js';
import type { UsuarioToken } from '../auth/usuario-token.js';
import { opcionesImagen } from '../common/imagenes.js';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe.js';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js';
import { CrearUsuarioDto } from './dto/crear-usuario.dto.js';
import { UsuariosService } from './usuarios.service.js';

// Todas las rutas exigen token. Las de administración además exigen perfil administrador.
@Controller('usuarios')
@UseGuards(TokenGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // ---------- Mi perfil (cualquier usuario logueado) ----------

  // PATCH /usuarios/mi-perfil  multipart/form-data: nombre, apellido, descripcionBreve, imagen
  @Patch('mi-perfil')
  @UseInterceptors(FileInterceptor('imagen', opcionesImagen))
  actualizarMiPerfil(
    @Body() dto: ActualizarPerfilDto,
    @UsuarioActual() usuario: UsuarioToken,
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    return this.usuariosService.actualizarPerfil(usuario.sub, dto, imagen);
  }

  // ---------- Administración (solo administradores) ----------

  // GET /usuarios => listado de todos los usuarios
  @Get()
  @UseGuards(AdminGuard)
  listar() {
    return this.usuariosService.listar();
  }

  // POST /usuarios => 201 Created. Mismos datos que el registro + perfil
  @Post()
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('imagen', opcionesImagen))
  async crear(
    @Body() dto: CrearUsuarioDto,
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    const usuario = await this.usuariosService.registrar(
      dto,
      dto.perfil,
      imagen,
    );
    return this.usuariosService.sanitizar(usuario);
  }

  // DELETE /usuarios/:id => baja lógica (deshabilita). No podrá volver a ingresar.
  @Delete(':id')
  @UseGuards(AdminGuard)
  deshabilitar(
    @Param('id', ParseObjectIdPipe) id: string,
    @UsuarioActual() admin: UsuarioToken,
  ) {
    return this.usuariosService.cambiarEstado(id, false, admin.sub);
  }

  // POST /usuarios/:id/habilitar => alta lógica (200: no se crea nada nuevo)
  @Post(':id/habilitar')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  habilitar(
    @Param('id', ParseObjectIdPipe) id: string,
    @UsuarioActual() admin: UsuarioToken,
  ) {
    return this.usuariosService.cambiarEstado(id, true, admin.sub);
  }
}
