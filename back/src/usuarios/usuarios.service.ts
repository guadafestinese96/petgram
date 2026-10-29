import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from './entities/usuario.entity.js';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name) private usuarioModel: Model<Usuario>,
  ) {}

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

  // Devuelve el usuario sin el hash de la contraseña
  sanitizar(usuario: UsuarioDocument) {
    const { password, ...resto } = usuario.toObject();
    return resto;
  }
}
