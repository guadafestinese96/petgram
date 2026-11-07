import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Body del POST (nuevo comentario) y del PUT (editar comentario)
export class ComentarioDto {
  @Transform(recortar)
  @IsString({ message: 'El comentario es obligatorio.' })
  @IsNotEmpty({ message: 'El comentario no puede estar vacío.' })
  @MaxLength(300, { message: 'El comentario no puede superar los 300 caracteres.' })
  mensaje: string;
}

// GET /publicaciones/:id/comentarios?offset=0&limit=5
export class QueryComentariosDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset debe ser un número entero.' })
  @Min(0, { message: 'offset no puede ser negativo.' })
  offset: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un número entero.' })
  @Min(1, { message: 'limit debe ser al menos 1.' })
  @Max(50, { message: 'limit no puede ser mayor a 50.' })
  limit: number = 5;
}
