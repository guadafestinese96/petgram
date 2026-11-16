import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePublicacionDto {
  @Transform(recortar)
  @IsString({ message: 'El título es obligatorio.' })
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @MaxLength(50, { message: 'El título no puede superar los 50 caracteres.' })
  titulo: string;

  @Transform(recortar)
  @IsString({ message: 'La descripción es obligatoria.' })
  @IsNotEmpty({ message: 'La descripción es obligatoria.' })
  @MaxLength(500, { message: 'La descripción no puede superar los 500 caracteres.' })
  mensaje: string;
}
