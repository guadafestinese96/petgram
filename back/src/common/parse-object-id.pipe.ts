import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

// Valida que un parámetro de la URL sea un ObjectId de Mongo (24 caracteres hexadecimales)
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!/^[a-f\d]{24}$/i.test(value)) {
      throw new BadRequestException('El id recibido no es válido.');
    }
    return value;
  }
}
