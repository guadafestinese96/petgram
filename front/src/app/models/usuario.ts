export type PerfilUsuario = 'usuario' | 'administrador';

export interface Usuario {
  _id: string;
  nombre: string;
  apellido: string;
  correo: string;
  nombreUsuario: string;
  fechaNacimiento: string;
  descripcionBreve: string;
  imagenPerfil?: string; // URL relativa: se le antepone API_URL
  perfil: PerfilUsuario;
  activo: boolean;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

export interface LoginRequest {
  identificador: string;
  password: string;
}
