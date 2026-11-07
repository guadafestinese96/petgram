import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RangoFechasDto } from '../dto/rango-fechas.dto.js';
import { Comentario } from '../entities/comentario.entity.js';
import { Publicacion } from '../entities/publicacion.entity.js';

// Las fechas que elige el admin son días de Argentina (UTC-3)
const ZONA_HORARIA = '-03:00';
const DIA_MS = 24 * 60 * 60 * 1000;
const MAX_DIAS = 366;

interface Rango {
  desde: string; // AAAA-MM-DD
  hasta: string; // AAAA-MM-DD
  inicio: Date; // desde a las 00:00
  fin: Date; // el día siguiente a "hasta" a las 00:00 (exclusivo)
}

@Injectable()
export class EstadisticasService {
  constructor(
    @InjectModel(Publicacion.name) private publicacionModel: Model<Publicacion>,
    @InjectModel(Comentario.name) private comentarioModel: Model<Comentario>,
  ) {}

  // Cantidad de publicaciones realizadas por cada usuario en el lapso elegido
  async publicacionesPorUsuario(dto: RangoFechasDto) {
    const rango = this.armarRango(dto);

    const datos = await this.publicacionModel.aggregate<{
      usuarioId: string;
      nombreUsuario: string;
      cantidad: number;
    }>([
      { $match: { activa: true, createdAt: { $gte: rango.inicio, $lt: rango.fin } } },
      { $group: { _id: '$usuario', cantidad: { $sum: 1 } } },
      { $lookup: { from: 'Usuarios', localField: '_id', foreignField: '_id', as: 'usuario' } },
      { $unwind: '$usuario' },
      {
        $project: {
          _id: 0,
          usuarioId: '$_id',
          nombreUsuario: '$usuario.nombreUsuario',
          cantidad: 1,
        },
      },
      { $sort: { cantidad: -1, nombreUsuario: 1 } },
    ]);

    return {
      desde: rango.desde,
      hasta: rango.hasta,
      total: datos.reduce((suma, d) => suma + d.cantidad, 0),
      datos,
    };
  }

  // Cantidad de comentarios realizados en el lapso elegido (día por día, con los días en 0)
  async comentariosPorDia(dto: RangoFechasDto) {
    const rango = this.armarRango(dto);

    const porDia = await this.comentarioModel.aggregate<{
      _id: string;
      cantidad: number;
    }>([
      { $match: { activo: true, createdAt: { $gte: rango.inicio, $lt: rango.fin } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: ZONA_HORARIA,
            },
          },
          cantidad: { $sum: 1 },
        },
      },
    ]);

    const cantidades = new Map(porDia.map((d) => [d._id, d.cantidad]));
    const datos = this.diasDelRango(rango).map((fecha) => ({
      fecha,
      cantidad: cantidades.get(fecha) ?? 0,
    }));

    return {
      desde: rango.desde,
      hasta: rango.hasta,
      total: datos.reduce((suma, d) => suma + d.cantidad, 0),
      datos,
    };
  }

  // Cantidad de comentarios que recibió cada publicación en el lapso elegido
  async comentariosPorPublicacion(dto: RangoFechasDto) {
    const rango = this.armarRango(dto);

    const datos = await this.comentarioModel.aggregate<{
      publicacionId: string;
      titulo: string;
      nombreUsuario: string;
      cantidad: number;
    }>([
      { $match: { activo: true, createdAt: { $gte: rango.inicio, $lt: rango.fin } } },
      { $group: { _id: '$publicacion', cantidad: { $sum: 1 } } },
      { $lookup: { from: 'Publicaciones', localField: '_id', foreignField: '_id', as: 'publicacion' } },
      { $unwind: '$publicacion' },
      { $match: { 'publicacion.activa': true } },
      { $lookup: { from: 'Usuarios', localField: 'publicacion.usuario', foreignField: '_id', as: 'autor' } },
      { $unwind: { path: '$autor', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          publicacionId: '$_id',
          titulo: '$publicacion.titulo',
          nombreUsuario: '$autor.nombreUsuario',
          cantidad: 1,
        },
      },
      { $sort: { cantidad: -1, titulo: 1 } },
    ]);

    return {
      desde: rango.desde,
      hasta: rango.hasta,
      total: datos.reduce((suma, d) => suma + d.cantidad, 0),
      datos,
    };
  }

  // Valida el lapso y lo convierte en fechas reales. Por defecto: los últimos 30 días.
  private armarRango(dto: RangoFechasDto): Rango {
    const hoy = this.fechaLocal(new Date());
    const hasta = dto.hasta ?? hoy;
    const desde =
      dto.desde ?? this.fechaLocal(new Date(this.inicioDelDia(hasta).getTime() - 29 * DIA_MS));

    const inicio = this.inicioDelDia(desde);
    const finInclusive = this.inicioDelDia(hasta);

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(finInclusive.getTime())) {
      throw new BadRequestException('Las fechas recibidas no son válidas.');
    }
    if (inicio > finInclusive) {
      throw new BadRequestException(
        'La fecha "desde" no puede ser posterior a la fecha "hasta".',
      );
    }
    if ((finInclusive.getTime() - inicio.getTime()) / DIA_MS >= MAX_DIAS) {
      throw new BadRequestException('El lapso no puede superar un año.');
    }

    return {
      desde,
      hasta,
      inicio,
      fin: new Date(finInclusive.getTime() + DIA_MS),
    };
  }

  private inicioDelDia(fecha: string): Date {
    return new Date(`${fecha}T00:00:00${ZONA_HORARIA}`);
  }

  // Date => 'AAAA-MM-DD' en horario de Argentina
  private fechaLocal(fecha: Date): string {
    const desplazada = new Date(fecha.getTime() - 3 * 60 * 60 * 1000);
    return desplazada.toISOString().slice(0, 10);
  }

  private diasDelRango(rango: Rango): string[] {
    const dias: string[] = [];
    for (let t = rango.inicio.getTime(); t < rango.fin.getTime(); t += DIA_MS) {
      dias.push(this.fechaLocal(new Date(t)));
    }
    return dias;
  }
}
