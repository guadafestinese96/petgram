import { IsIn } from 'class-validator';
import { RegistroDto } from '../../auth/dto/registro.dto.js';
import type { Perfil } from '../entities/usuario.entity.js';

// Alta de usuario desde el dashboard: mismos datos que el registro + el perfil elegido
export class CrearUsuarioDto extends RegistroDto {
  @IsIn(['usuario', 'administrador'], {
    message: 'El perfil debe ser "usuario" o "administrador".',
  })
  perfil: Perfil;
}
