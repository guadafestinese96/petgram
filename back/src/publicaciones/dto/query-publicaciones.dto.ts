import { Type } from 'class-transformer';
import { IsIn, IsInt, IsMongoId, IsOptional, Max, Min } from 'class-validator';

export class QueryPublicacionesDto {
  // Ordenamiento: por fecha (default) o por cantidad de me gusta
  @IsOptional()
  @IsIn(['fecha', 'likes'], { message: 'El orden debe ser "fecha" o "likes".' })
  orden: 'fecha' | 'likes' = 'fecha';

  // Filtra las publicaciones de un usuario particular
  @IsOptional()
  @IsMongoId({ message: 'El id de usuario no es válido.' })
  usuario?: string;

  // Paginación: cuántas saltear y cuántas traer
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
  limit: number = 10;
}
