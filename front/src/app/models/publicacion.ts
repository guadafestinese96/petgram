export type OrdenPublicaciones = 'fecha' | 'likes';

export interface AutorPublicacion {
  _id: string;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  imagenPerfil?: string;
}

export interface Publicacion {
  _id: string;
  titulo: string;
  mensaje: string;
  imagen?: string; // URL relativa: se le antepone API_URL
  usuario: AutorPublicacion;
  cantidadLikes: number;
  meGusta: boolean; // true si el usuario logueado ya dio me gusta
  createdAt: string;
}

export interface ListadoPublicaciones {
  publicaciones: Publicacion[];
  total: number;
  offset: number;
  limit: number;
}

export interface OpcionesListado {
  orden?: OrdenPublicaciones;
  usuario?: string;
  offset?: number;
  limit?: number;
}

export interface ResultadoLike {
  cantidadLikes: number;
  meGusta: boolean;
}
