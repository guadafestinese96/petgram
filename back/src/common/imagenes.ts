import { BadRequestException } from '@nestjs/common';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const EXTENSIONES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export const DIR_PERFILES = join(process.cwd(), 'uploads', 'perfiles');

// La imagen llega en memoria y recién se escribe en disco cuando el resto de
// las validaciones pasaron (así no quedan archivos huérfanos si el registro falla).
export const opcionesImagen = {
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, aceptar: boolean) => void,
  ) => {
    if (!EXTENSIONES[file.mimetype]) {
      return cb(
        new BadRequestException(
          'La imagen de perfil debe ser JPG, PNG, WEBP o GIF.',
        ),
        false,
      );
    }
    cb(null, true);
  },
};

// Guarda la imagen y devuelve la URL relativa que se persiste en la DB
export async function guardarImagenPerfil(
  file: Express.Multer.File,
): Promise<string> {
  await mkdir(DIR_PERFILES, { recursive: true });
  const nombre = `${randomUUID()}${EXTENSIONES[file.mimetype]}`;
  await writeFile(join(DIR_PERFILES, nombre), file.buffer);
  return `/uploads/perfiles/${nombre}`;
}
