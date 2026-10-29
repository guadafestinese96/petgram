import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TokenGuard } from '../auth/token.guard.js';
import { UsuarioActual } from '../auth/usuario-actual.decorator.js';
import type { UsuarioToken } from '../auth/usuario-token.js';
import { opcionesImagen } from '../common/imagenes.js';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe.js';
import { CreatePublicacionDto } from './dto/create-publicacion.dto.js';
import { QueryPublicacionesDto } from './dto/query-publicaciones.dto.js';
import { PublicacionesService } from './publicaciones.service.js';

// Todas las rutas exigen estar logueado (JWT)
@Controller('publicaciones')
@UseGuards(TokenGuard)
export class PublicacionesController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  // 201 Created. multipart/form-data: titulo, mensaje + archivo "imagen" (opcional)
  @Post()
  @UseInterceptors(FileInterceptor('imagen', opcionesImagen))
  crear(
    @Body() dto: CreatePublicacionDto,
    @UsuarioActual() usuario: UsuarioToken,
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    return this.publicacionesService.crear(dto, usuario, imagen);
  }

  // GET /publicaciones?orden=fecha|likes&usuario=<id>&offset=0&limit=10
  @Get()
  listar(
    @Query() query: QueryPublicacionesDto,
    @UsuarioActual() usuario: UsuarioToken,
  ) {
    return this.publicacionesService.listar(query, usuario.sub);
  }

  // Baja lógica (dueño o administrador)
  @Delete(':id')
  eliminar(
    @Param('id', ParseObjectIdPipe) id: string,
    @UsuarioActual() usuario: UsuarioToken,
  ) {
    return this.publicacionesService.eliminar(id, usuario);
  }

  // 201 Created. 409 si ya había dado me gusta
  @Post(':id/like')
  darLike(
    @Param('id', ParseObjectIdPipe) id: string,
    @UsuarioActual() usuario: UsuarioToken,
  ) {
    return this.publicacionesService.darLike(id, usuario.sub);
  }

  // 409 si no había dado me gusta
  @Delete(':id/like')
  quitarLike(
    @Param('id', ParseObjectIdPipe) id: string,
    @UsuarioActual() usuario: UsuarioToken,
  ) {
    return this.publicacionesService.quitarLike(id, usuario.sub);
  }
}
