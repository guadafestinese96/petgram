import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../../auth/admin.guard.js';
import { TokenGuard } from '../../auth/token.guard.js';
import { RangoFechasDto } from '../dto/rango-fechas.dto.js';
import { EstadisticasService } from './estadisticas.service.js';

// Todas las rutas: token válido + perfil administrador
// Todas reciben ?desde=AAAA-MM-DD&hasta=AAAA-MM-DD (opcionales: por defecto últimos 30 días)
@Controller('estadisticas')
@UseGuards(TokenGuard, AdminGuard)
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  // Gráfico de barras: publicaciones de cada usuario
  @Get('publicaciones-por-usuario')
  publicacionesPorUsuario(@Query() rango: RangoFechasDto) {
    return this.estadisticasService.publicacionesPorUsuario(rango);
  }

  // Gráfico de líneas: comentarios realizados por día
  @Get('comentarios')
  comentarios(@Query() rango: RangoFechasDto) {
    return this.estadisticasService.comentariosPorDia(rango);
  }

  // Gráfico de torta: comentarios de cada publicación
  @Get('comentarios-por-publicacion')
  comentariosPorPublicacion(@Query() rango: RangoFechasDto) {
    return this.estadisticasService.comentariosPorPublicacion(rango);
  }
}
