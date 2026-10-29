import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';

@Schema({ collection: 'Publicaciones', timestamps: true })
export class Publicacion {
  @Prop({ type: String, required: true, trim: true })
  titulo: string;

  @Prop({ type: String, required: true, trim: true })
  mensaje: string;

  // URL relativa de la imagen (opcional)
  @Prop({ type: String })
  imagen?: string;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true, index: true })
  usuario: Types.ObjectId;

  // Usuarios que dieron "me gusta". Un usuario solo puede estar una vez.
  @Prop({ type: [Types.ObjectId], ref: 'Usuario', default: [] })
  likes: Types.ObjectId[];

  // Se mantiene sincronizado con likes.length: permite ordenar por me gusta sin recalcular
  @Prop({ type: Number, default: 0 })
  cantidadLikes: number;

  // Baja lógica: false = eliminada (no se borra de la base)
  @Prop({ type: Boolean, default: true })
  activa: boolean;
}

export type PublicacionDocument = HydratedDocument<Publicacion>;
export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);

// Índices para los dos ordenamientos del listado
PublicacionSchema.index({ activa: 1, createdAt: -1 });
PublicacionSchema.index({ activa: 1, cantidadLikes: -1, createdAt: -1 });
