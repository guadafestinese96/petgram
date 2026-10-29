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

export type CarpetaImagenes = 'perfiles' | 'publicaciones';

// La imagen llega en memoria y recién se escribe en disco cuando el resto de
// las validaciones pasaron (así no quedan archivos huérfanos si algo falla).
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
        new BadRequestException('La imagen debe ser JPG, PNG, WEBP o GIF.'),
        false,
      );
    }
    cb(null, true);
  },
};

// Guarda la imagen en uploads/<carpeta> y devuelve la URL relativa que se persiste en la DB
export async function guardarImagen(
  file: Express.Multer.File,
  carpeta: CarpetaImagenes,
): Promise<string> {
  const directorio = join(process.cwd(), 'uploads', carpeta);
  await mkdir(directorio, { recursive: true });
  const nombre = `${randomUUID()}${EXTENSIONES[file.mimetype]}`;
  await writeFile(join(directorio, nombre), file.buffer);
  return `/uploads/${carpeta}/${nombre}`;
}

// Se mantiene para el módulo de autenticación (Sprint 1)
export const guardarImagenPerfil = (file: Express.Multer.File) =>
  guardarImagen(file, 'perfiles');
