import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePublicacionDto {
  @Transform(recortar)
  @IsString({ message: 'El título es obligatorio.' })
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @MaxLength(100, { message: 'El título no puede superar los 100 caracteres.' })
  titulo: string;

  @Transform(recortar)
  @IsString({ message: 'El mensaje es obligatorio.' })
  @IsNotEmpty({ message: 'El mensaje es obligatorio.' })
  @MaxLength(500, { message: 'El mensaje no puede superar los 500 caracteres.' })
  mensaje: string;
}
