import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UsuarioDocument } from '../usuarios/entities/usuario.entity.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';
import type { UsuarioToken } from './usuario-token.js';

const VENCIMIENTO_TOKEN_SEG = 15 * 60; // 15 minutos

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly config: ConfigService,
  ) {}

  // El registro público siempre crea perfil "usuario"
  async registro(dto: RegistroDto, imagen?: Express.Multer.File) {
    const usuario = await this.usuariosService.registrar(
      dto,
      'usuario',
      imagen,
    );

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

    // Usuario dado de baja por un administrador (Sprint #4)
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

  // El TokenGuard ya validó firma y vencimiento. Acá se confirma que el usuario
  // siga existiendo y habilitado, y se devuelven sus datos actualizados.
  async autorizar(datosToken: UsuarioToken) {
    const usuario = await this.buscarUsuarioHabilitado(datosToken.sub);
    return { usuario: this.usuariosService.sanitizar(usuario) };
  }

  // Nuevo token con la misma payload y otros 15 minutos de vida
  async refrescar(datosToken: UsuarioToken) {
    const usuario = await this.buscarUsuarioHabilitado(datosToken.sub);
    return {
      token: this.generarToken(usuario),
      usuario: this.usuariosService.sanitizar(usuario),
    };
  }

  // Cualquier problema con el dueño del token => 401 (lo pide el enunciado)
  private async buscarUsuarioHabilitado(id: string) {
    const usuario = await this.usuariosService.buscarPorId(id);
    if (!usuario) {
      throw new UnauthorizedException('El usuario del token ya no existe.');
    }
    if (!usuario.activo) {
      throw new UnauthorizedException(
        'Tu usuario está deshabilitado. Contactá a un administrador.',
      );
    }
    return usuario;
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
