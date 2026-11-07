import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ComentarioDto, QueryComentariosDto } from '../dto/comentario.dto.js';
import { Comentario } from '../entities/comentario.entity.js';
import { Publicacion } from '../entities/publicacion.entity.js';

// Datos del autor que viajan con cada comentario
const CAMPOS_AUTOR = 'nombre apellido nombreUsuario imagenPerfil';

@Injectable()
export class ComentariosService {
  constructor(
    @InjectModel(Comentario.name) private comentarioModel: Model<Comentario>,
    @InjectModel(Publicacion.name) private publicacionModel: Model<Publicacion>,
  ) {}

  // Los más recientes primero, paginados con offset / limit
  async listar(publicacionId: string, query: QueryComentariosDto) {
    await this.validarPublicacion(publicacionId);

    const filtro = {
      publicacion: new Types.ObjectId(publicacionId),
      activo: true,
    };

    const [comentarios, total] = await Promise.all([
      this.comentarioModel
        .find(filtro)
        .sort({ createdAt: -1, _id: -1 })
        .skip(query.offset)
        .limit(query.limit)
        .populate('usuario', CAMPOS_AUTOR)
        .select('-activo -__v')
        .lean(),
      this.comentarioModel.countDocuments(filtro),
    ]);

    return { comentarios, total, offset: query.offset, limit: query.limit };
  }

  // 201 Created. Guarda el comentario con su autor y la fecha (createdAt)
  async crear(publicacionId: string, dto: ComentarioDto, usuarioId: string) {
    await this.validarPublicacion(publicacionId);

    const creado = await this.comentarioModel.create({
      publicacion: new Types.ObjectId(publicacionId),
      usuario: new Types.ObjectId(usuarioId),
      mensaje: dto.mensaje,
    });

    // Contador para mostrar "N comentarios" sin tener que contarlos cada vez
    await this.publicacionModel.updateOne(
      { _id: publicacionId },
      { $inc: { cantidadComentarios: 1 } },
    );

    return this.formatear(await creado.populate('usuario', CAMPOS_AUTOR));
  }

  // Solo el autor puede editar. Marca modificado: true
  async editar(
    publicacionId: string,
    comentarioId: string,
    dto: ComentarioDto,
    usuarioId: string,
  ) {
    await this.validarPublicacion(publicacionId);

    const comentario = await this.comentarioModel.findOne({
      _id: comentarioId,
      publicacion: new Types.ObjectId(publicacionId),
      activo: true,
    });
    if (!comentario) {
      throw new NotFoundException('El comentario no existe.');
    }
    if (comentario.usuario.toString() !== usuarioId) {
      throw new ForbiddenException('Solo podés editar tus propios comentarios.');
    }

    comentario.mensaje = dto.mensaje;
    comentario.modificado = true;
    await comentario.save();

    return this.formatear(await comentario.populate('usuario', CAMPOS_AUTOR));
  }

  // Si la publicación no existe o fue dada de baja, sus comentarios tampoco están disponibles
  private async validarPublicacion(id: string) {
    const existe = await this.publicacionModel.exists({ _id: id, activa: true });
    if (!existe) {
      throw new NotFoundException('La publicación no existe.');
    }
  }

  private formatear(comentario: { toObject: () => object }) {
    const { activo, __v, ...resto } = comentario.toObject() as Record<
      string,
      unknown
    >;
    return resto;
  }
}
