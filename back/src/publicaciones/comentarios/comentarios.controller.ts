import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TokenGuard } from '../../auth/token.guard.js';
import { UsuarioActual } from '../../auth/usuario-actual.decorator.js';
import type { UsuarioToken } from '../../auth/usuario-token.js';
import { ParseObjectIdPipe } from '../../common/parse-object-id.pipe.js';
import { ComentarioDto, QueryComentariosDto } from '../dto/comentario.dto.js';
import { ComentariosService } from './comentarios.service.js';

// Comentarios de una publicación: /publicaciones/:id/comentarios
@Controller('publicaciones/:id/comentarios')
@UseGuards(TokenGuard)
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  // GET ?offset=0&limit=5 => los más recientes primero
  @Get()
  listar(
    @Param('id', ParseObjectIdPipe) id: string,
    @Query() query: QueryComentariosDto,
  ) {
    return this.comentariosService.listar(id, query);
  }

  // POST { mensaje } => 201 Created
  @Post()
  crear(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: ComentarioDto,
    @UsuarioActual() usuario: UsuarioToken,
  ) {
    return this.comentariosService.crear(id, dto, usuario.sub);
  }

  // PUT { mensaje } => 200 OK. Agrega modificado: true
  @Put(':comentarioId')
  editar(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('comentarioId', ParseObjectIdPipe) comentarioId: string,
    @Body() dto: ComentarioDto,
    @UsuarioActual() usuario: UsuarioToken,
  ) {
    return this.comentariosService.editar(id, comentarioId, dto, usuario.sub);
  }
}
