import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Edición de "Mi perfil": todos los campos son opcionales (se cambia solo lo que llega)
export class ActualizarPerfilDto {
  @IsOptional()
  @Transform(recortar)
  @IsString({ message: 'El nombre no es válido.' })
  @IsNotEmpty({ message: 'El nombre no puede quedar vacío.' })
  @MaxLength(30, { message: 'El nombre no puede superar los 30 caracteres.' })
  nombre?: string;

  @IsOptional()
  @Transform(recortar)
  @IsString({ message: 'El apellido no es válido.' })
  @IsNotEmpty({ message: 'El apellido no puede quedar vacío.' })
  @MaxLength(30, { message: 'El apellido no puede superar los 30 caracteres.' })
  apellido?: string;

  @IsOptional()
  @Transform(recortar)
  @IsString({ message: 'La descripción no es válida.' })
  @IsNotEmpty({ message: 'La descripción no puede quedar vacía.' })
  @MaxLength(150, { message: 'La descripción no puede superar los 150 caracteres.' })
  descripcionBreve?: string;
}
