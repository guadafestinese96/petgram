import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  // Puede ser el correo o el nombre de usuario
  @IsString({ message: 'Ingresá tu correo o nombre de usuario.' })
  @IsNotEmpty({ message: 'Ingresá tu correo o nombre de usuario.' })
  identificador: string;

  @IsString({ message: 'Ingresá tu contraseña.' })
  @IsNotEmpty({ message: 'Ingresá tu contraseña.' })
  password: string;
}
