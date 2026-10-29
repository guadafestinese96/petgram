import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { guardarImagenPerfil } from '../common/imagenes.js';
import { UsuarioDocument } from '../usuarios/entities/usuario.entity.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';

const VENCIMIENTO_TOKEN_SEG = 15 * 60; // 15 minutos

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly config: ConfigService,
  ) {}

  async registro(dto: RegistroDto, imagen?: Express.Multer.File) {
    if (dto.password !== dto.repetirPassword) {
      throw new BadRequestException('Las contraseñas no coinciden.');
    }

    // 409 si el correo o el usuario ya existen
    await this.usuariosService.validarUnicos(dto.correo, dto.nombreUsuario);

    // Encriptar la contraseña (nunca se guarda en texto plano)
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Guardar la imagen (si vino) y obtener su URL
    const imagenPerfil = imagen ? await guardarImagenPerfil(imagen) : undefined;

    const usuario = await this.usuariosService.crear({
      nombre: dto.nombre,
      apellido: dto.apellido,
      correo: dto.correo,
      nombreUsuario: dto.nombreUsuario,
      password: passwordHash,
      fechaNacimiento: new Date(dto.fechaNacimiento),
      descripcionBreve: dto.descripcionBreve,
      imagenPerfil,
      perfil: 'usuario', // el registro público siempre crea "usuario"
    });

    return {
      token: this.generarToken(usuario),
      usuario: this.usuariosService.sanitizar(usuario),
    };
  }

  async login(dto: LoginDto) {
    const usuario = await this.usuariosService.buscarPorIdentificador(
      dto.identificador,
    );

    // bcrypt.compare encripta la contraseña recibida y la compara con el hash guardado
    const passwordOk = usuario
      ? await bcrypt.compare(dto.password, usuario.password)
      : false;

    // Mismo mensaje para "no existe" y "contraseña mala": no revela qué usuarios existen
    if (!usuario || !passwordOk) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    if (!usuario.activo) {
      throw new ForbiddenException(
        'Tu usuario está deshabilitado. Contactá a un administrador.',
      );
    }

    return {
      token: this.generarToken(usuario),
      usuario: this.usuariosService.sanitizar(usuario),
    };
  }

  // JWT con quién es el usuario y su rol. Vence a los 15 minutos.
  generarToken(usuario: UsuarioDocument): string {
    const secreto = this.config.getOrThrow<string>('JWT_SECRET');

    return jwt.sign(
      {
        sub: usuario._id.toString(),
        nombreUsuario: usuario.nombreUsuario,
        perfil: usuario.perfil,
      },
      secreto,
      { expiresIn: VENCIMIENTO_TOKEN_SEG, issuer: 'RED-SOCIAL' },
    );
  }
}
