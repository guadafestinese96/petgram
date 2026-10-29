import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type Perfil = 'usuario' | 'administrador';

@Schema({ collection: 'Usuarios', timestamps: true })
export class Usuario {
  @Prop({ type: String, required: true, trim: true })
  nombre: string;

  @Prop({ type: String, required: true, trim: true })
  apellido: string;

  @Prop({ type: String, required: true, unique: true, lowercase: true, trim: true })
  correo: string;

  @Prop({ type: String, required: true, unique: true, trim: true })
  nombreUsuario: string;

  // select:false => nunca viaja en las consultas salvo que se pida explícitamente (login)
  @Prop({ type: String, required: true, select: false })
  password: string;

  @Prop({ type: Date, required: true })
  fechaNacimiento: Date;

  @Prop({ type: String, required: true })
  descripcionBreve: string;

  @Prop({ type: String })
  imagenPerfil?: string;

  @Prop({ type: String, enum: ['usuario', 'administrador'], default: 'usuario' })
  perfil: Perfil;

  // Baja lógica (se usa en el Sprint #4)
  @Prop({ type: Boolean, default: true })
  activo: boolean;
}

export type UsuarioDocument = HydratedDocument<Usuario>;
export const UsuarioSchema = SchemaFactory.createForClass(Usuario);
