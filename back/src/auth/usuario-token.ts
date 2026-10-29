import type { Perfil } from '../usuarios/entities/usuario.entity.js';

// Lo que viaja dentro del JWT (ver AuthService.generarToken)
export interface UsuarioToken {
  sub: string; // _id del usuario
  nombreUsuario: string;
  perfil: Perfil;
}
