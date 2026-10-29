import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegistroDto {
  @IsString({ message: 'El nombre es obligatorio.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MaxLength(30, { message: 'El nombre no puede superar los 30 caracteres.' })
  nombre: string;

  @IsString({ message: 'El apellido es obligatorio.' })
  @IsNotEmpty({ message: 'El apellido es obligatorio.' })
  @MaxLength(30, { message: 'El apellido no puede superar los 30 caracteres.' })
  apellido: string;

  @IsEmail({}, { message: 'Ingresá un correo electrónico válido.' })
  correo: string;

  @IsString({ message: 'El nombre de usuario es obligatorio.' })
  @MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres.' })
  @MaxLength(20, { message: 'El nombre de usuario no puede superar los 20 caracteres.' })
  @Matches(/^[a-zA-Z0-9_.]+$/, {
    message:
      'El nombre de usuario solo puede tener letras, números, guiones bajos y puntos.',
  })
  nombreUsuario: string;

  @IsString({ message: 'La contraseña es obligatoria.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'La contraseña debe incluir al menos una mayúscula y un número.',
  })
  password: string;

  @IsString({ message: 'Tenés que repetir la contraseña.' })
  @IsNotEmpty({ message: 'Tenés que repetir la contraseña.' })
  repetirPassword: string;

  @IsDateString({}, { message: 'La fecha de nacimiento no es válida.' })
  fechaNacimiento: string;

  @IsString({ message: 'La descripción breve es obligatoria.' })
  @IsNotEmpty({ message: 'La descripción breve es obligatoria.' })
  @MaxLength(150, { message: 'La descripción no puede superar los 150 caracteres.' })
  descripcionBreve: string;
}
