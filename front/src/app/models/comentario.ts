import { AutorPublicacion } from './publicacion';

export interface Comentario {
  _id: string;
  publicacion: string;
  usuario: AutorPublicacion;
  mensaje: string;
  modificado: boolean; // true si el autor lo editó
  createdAt: string;
  updatedAt: string;
}

export interface ListadoComentarios {
  comentarios: Comentario[];
  total: number;
  offset: number;
  limit: number;
}
