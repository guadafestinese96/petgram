import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';

// timestamps: createdAt es "la fecha" del comentario
@Schema({ collection: 'Comentarios', timestamps: true })
export class Comentario {
  @Prop({ type: Types.ObjectId, ref: 'Publicacion', required: true })
  publicacion: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  usuario: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  mensaje: string;

  // true cuando el autor editó el comentario (PUT)
  @Prop({ type: Boolean, default: false })
  modificado: boolean;

  // Baja lógica: cuando se da de baja la publicación, sus comentarios dejan de estar disponibles
  @Prop({ type: Boolean, default: true })
  activo: boolean;
}

export type ComentarioDocument = HydratedDocument<Comentario>;
export const ComentarioSchema = SchemaFactory.createForClass(Comentario);

// Listado de comentarios de una publicación, los más recientes primero
ComentarioSchema.index({ publicacion: 1, activo: 1, createdAt: -1 });
// Estadísticas por rango de fechas
ComentarioSchema.index({ activo: 1, createdAt: 1 });
