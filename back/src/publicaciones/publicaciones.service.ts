import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { UsuarioToken } from '../auth/usuario-token.js';
import { guardarImagen } from '../common/imagenes.js';
import { CreatePublicacionDto } from './dto/create-publicacion.dto.js';
import { QueryPublicacionesDto } from './dto/query-publicaciones.dto.js';
import { Publicacion } from './entities/publicacion.entity.js';

// Datos del autor que se devuelven junto a cada publicación
const CAMPOS_AUTOR = 'nombre apellido nombreUsuario imagenPerfil';

interface PublicacionPlana {
  _id: Types.ObjectId;
  titulo: string;
  mensaje: string;
  imagen?: string;
  usuario: unknown;
  likes: Types.ObjectId[];
  cantidadLikes: number;
  activa: boolean;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

@Injectable()
export class PublicacionesService {
  constructor(
    @InjectModel(Publicacion.name)
    private publicacionModel: Model<Publicacion>,
  ) {}

  async crear(
    dto: CreatePublicacionDto,
    usuario: UsuarioToken,
    imagen?: Express.Multer.File,
  ) {
    const urlImagen = imagen
      ? await guardarImagen(imagen, 'publicaciones')
      : undefined;

    const creada = await this.publicacionModel.create({
      titulo: dto.titulo,
      mensaje: dto.mensaje,
      imagen: urlImagen,
      usuario: new Types.ObjectId(usuario.sub),
    });

    const poblada = await creada.populate('usuario', CAMPOS_AUTOR);
    return this.formatear(
      poblada.toObject() as unknown as PublicacionPlana,
      usuario.sub,
    );
  }

  async listar(query: QueryPublicacionesDto, usuarioId: string) {
    const filtro = query.usuario
      ? { activa: true, usuario: new Types.ObjectId(query.usuario) }
      : { activa: true };

    const orden: Record<string, 1 | -1> =
      query.orden === 'likes'
        ? { cantidadLikes: -1, createdAt: -1 }
        : { createdAt: -1 };

    const [publicaciones, total] = await Promise.all([
      this.publicacionModel
        .find(filtro)
        .sort(orden)
        .skip(query.offset)
        .limit(query.limit)
        .populate('usuario', CAMPOS_AUTOR)
        .lean(),
      this.publicacionModel.countDocuments(filtro),
    ]);

    return {
      publicaciones: publicaciones.map((p) =>
        this.formatear(p as unknown as PublicacionPlana, usuarioId),
      ),
      total,
      offset: query.offset,
      limit: query.limit,
    };
  }

  // Baja lógica: solo el dueño o un administrador
  async eliminar(id: string, usuario: UsuarioToken) {
    const publicacion = await this.publicacionModel.findOne({
      _id: id,
      activa: true,
    });
    if (!publicacion) {
      throw new NotFoundException('La publicación no existe.');
    }

    const esDueno = publicacion.usuario.toString() === usuario.sub;
    if (!esDueno && usuario.perfil !== 'administrador') {
      throw new ForbiddenException(
        'Solo podés eliminar tus propias publicaciones.',
      );
    }

    publicacion.activa = false;
    await publicacion.save();
    return { mensaje: 'Publicación eliminada correctamente.' };
  }

  // La condición "likes: { $ne: usuario }" hace que el me gusta sea único por usuario
  // y que la operación sea atómica (no hay carrera entre dos clicks simultáneos)
  async darLike(id: string, usuarioId: string) {
    const usuario = new Types.ObjectId(usuarioId);

    const publicacion = await this.publicacionModel.findOneAndUpdate(
      { _id: id, activa: true, likes: { $ne: usuario } },
      { $push: { likes: usuario }, $inc: { cantidadLikes: 1 } },
      { new: true },
    );

    if (!publicacion) {
      await this.validarExiste(id);
      throw new ConflictException('Ya le diste me gusta a esta publicación.');
    }
    return { cantidadLikes: publicacion.cantidadLikes, meGusta: true };
  }

  // Solo si el usuario había dado me gusta antes
  async quitarLike(id: string, usuarioId: string) {
    const usuario = new Types.ObjectId(usuarioId);

    const publicacion = await this.publicacionModel.findOneAndUpdate(
      { _id: id, activa: true, likes: usuario },
      { $pull: { likes: usuario }, $inc: { cantidadLikes: -1 } },
      { new: true },
    );

    if (!publicacion) {
      await this.validarExiste(id);
      throw new ConflictException(
        'No le habías dado me gusta a esta publicación.',
      );
    }
    return { cantidadLikes: publicacion.cantidadLikes, meGusta: false };
  }

  private async validarExiste(id: string) {
    const existe = await this.publicacionModel.exists({ _id: id, activa: true });
    if (!existe) {
      throw new NotFoundException('La publicación no existe.');
    }
  }

  // Oculta el array de likes (privado) y avisa si el usuario que consulta ya dio me gusta
  private formatear(publicacion: PublicacionPlana, usuarioId: string) {
    const { likes, activa, __v, ...resto } = publicacion;
    return {
      ...resto,
      meGusta: likes.some((id) => id.toString() === usuarioId),
    };
  }
}
