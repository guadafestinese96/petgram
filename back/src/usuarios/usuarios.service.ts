import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { RegistroDto } from '../auth/dto/registro.dto.js';
import { guardarImagenPerfil } from '../common/imagenes.js';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js';
import { Perfil, Usuario, UsuarioDocument } from './entities/usuario.entity.js';

@Injectable()
export class UsuariosService implements OnModuleInit {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(
    @InjectModel(Usuario.name) private usuarioModel: Model<Usuario>,
    private readonly config: ConfigService,
  ) {}

  // Al iniciar el server: si todavía no existe ningún administrador, crea uno con los
  // datos de ADMIN_USUARIO / ADMIN_CORREO / ADMIN_PASSWORD del .env (si están definidos).
  // Así siempre hay alguien que pueda entrar al dashboard y crear más administradores.
  async onModuleInit() {
    const nombreUsuario = this.config.get<string>('ADMIN_USUARIO');
    const correo = this.config.get<string>('ADMIN_CORREO');
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!nombreUsuario || !correo || !password) return;

    try {
      if (await this.usuarioModel.exists({ perfil: 'administrador' })) return;
      if (await this.usuarioModel.exists({ $or: [{ correo }, { nombreUsuario }] })) {
        this.logger.warn(
          `No se creó el administrador inicial: "${nombreUsuario}" o "${correo}" ya existen.`,
        );
        return;
      }

      await this.crear({
        nombre: 'Administrador',
        apellido: 'Petgram',
        correo,
        nombreUsuario,
        password: await bcrypt.hash(password, 10),
        fechaNacimiento: new Date('2000-01-01'),
        descripcionBreve: 'Cuenta de administración de Petgram.',
        perfil: 'administrador',
      });
      this.logger.log(`Administrador inicial creado: ${nombreUsuario}`);
    } catch (error) {
      this.logger.error('No se pudo crear el administrador inicial', error as Error);
    }
  }

  // Lógica común del registro público (perfil "usuario") y del alta desde el dashboard
  async registrar(
    dto: RegistroDto,
    perfil: Perfil,
    imagen?: Express.Multer.File,
  ): Promise<UsuarioDocument> {
    if (dto.password !== dto.repetirPassword) {
      throw new BadRequestException('Las contraseñas no coinciden.');
    }

    // 409 si el correo o el usuario ya existen
    await this.validarUnicos(dto.correo, dto.nombreUsuario);

    // Encriptar la contraseña (nunca se guarda en texto plano)
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Guardar la imagen (si vino) y obtener su URL
    const imagenPerfil = imagen ? await guardarImagenPerfil(imagen) : undefined;

    return await this.crear({
      nombre: dto.nombre,
      apellido: dto.apellido,
      correo: dto.correo,
      nombreUsuario: dto.nombreUsuario,
      password: passwordHash,
      fechaNacimiento: new Date(dto.fechaNacimiento),
      descripcionBreve: dto.descripcionBreve,
      imagenPerfil,
      perfil,
    });
  }

  // Lanza 409 si el correo o el nombre de usuario ya existen
  async validarUnicos(correo: string, nombreUsuario: string) {
    if (await this.usuarioModel.exists({ correo: correo.toLowerCase() })) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }
    if (await this.usuarioModel.exists({ nombreUsuario })) {
      throw new ConflictException('El nombre de usuario ya está en uso.');
    }
  }

  async crear(datos: Partial<Usuario>): Promise<UsuarioDocument> {
    try {
      return await new this.usuarioModel(datos).save();
    } catch (error) {
      // Red de seguridad ante dos registros simultáneos (índice unique de Mongo)
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException(
          'El correo o el nombre de usuario ya están registrados.',
        );
      }
      throw error;
    }
  }

  // Busca por correo O por nombre de usuario. Incluye el hash para poder comparar.
  async buscarPorIdentificador(identificador: string) {
    return await this.usuarioModel
      .findOne({
        $or: [
          { correo: identificador.toLowerCase() },
          { nombreUsuario: identificador },
        ],
      })
      .select('+password');
  }

  async buscarPorId(id: string) {
    return await this.usuarioModel.findById(id);
  }

  // Listado para el dashboard (el más nuevo primero). password tiene select:false.
  async listar() {
    const usuarios = await this.usuarioModel.find().sort({ createdAt: -1 });
    return usuarios.map((u) => this.sanitizar(u));
  }

  // Baja (activo=false) o alta lógica (activo=true) hecha por un administrador
  async cambiarEstado(id: string, activo: boolean, idAdmin: string) {
    if (!activo && id === idAdmin) {
      throw new BadRequestException('No podés deshabilitar tu propio usuario.');
    }

    const usuario = await this.usuarioModel.findById(id);
    if (!usuario) {
      throw new NotFoundException('El usuario no existe.');
    }
    if (usuario.activo === activo) {
      throw new ConflictException(
        activo
          ? 'El usuario ya estaba habilitado.'
          : 'El usuario ya estaba deshabilitado.',
      );
    }

    usuario.activo = activo;
    await usuario.save();
    return {
      mensaje: activo
        ? `El usuario ${usuario.nombreUsuario} fue habilitado.`
        : `El usuario ${usuario.nombreUsuario} fue deshabilitado.`,
      usuario: this.sanitizar(usuario),
    };
  }

  // "Mi perfil": el usuario logueado edita sus datos y, si quiere, su foto
  async actualizarPerfil(
    id: string,
    dto: ActualizarPerfilDto,
    imagen?: Express.Multer.File,
  ) {
    const usuario = await this.usuarioModel.findById(id);
    if (!usuario) {
      throw new NotFoundException('El usuario no existe.');
    }

    if (dto.nombre !== undefined) usuario.nombre = dto.nombre;
    if (dto.apellido !== undefined) usuario.apellido = dto.apellido;
    if (dto.descripcionBreve !== undefined) {
      usuario.descripcionBreve = dto.descripcionBreve;
    }
    if (imagen) usuario.imagenPerfil = await guardarImagenPerfil(imagen);

    await usuario.save();
    return this.sanitizar(usuario);
  }

  // Devuelve el usuario sin el hash de la contraseña
  sanitizar(usuario: UsuarioDocument) {
    const { password, ...resto } = usuario.toObject();
    return resto;
  }
}
