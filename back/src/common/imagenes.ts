import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import multer from 'multer';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const EXTENSIONES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export type CarpetaImagenes = 'perfiles' | 'publicaciones';

const logger = new Logger('Imagenes');

// La imagen llega en memoria y recién se guarda cuando el resto de
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

// Guarda la imagen y devuelve la URL que se persiste en la base de datos.
// - Con las variables CLOUDINARY_* definidas (producción en Vercel): la sube a Cloudinary
//   y devuelve la URL completa (https://res.cloudinary.com/...).
// - Sin esas variables (desarrollo local): la guarda en uploads/<carpeta> como antes.
export async function guardarImagen(
  file: Express.Multer.File,
  carpeta: CarpetaImagenes,
): Promise<string> {
  if (cloudinaryConfigurado()) {
    return await subirACloudinary(file, carpeta);
  }
  return await guardarEnDisco(file, carpeta);
}

// Se mantiene para el módulo de autenticación (Sprint 1)
export const guardarImagenPerfil = (file: Express.Multer.File) =>
  guardarImagen(file, 'perfiles');

// ---------- Cloudinary ----------

function cloudinaryConfigurado(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

// Subida firmada con la API de Cloudinary (sin librerías extra: usa fetch de Node).
// La firma es un SHA-1 de los parámetros ordenados + el API Secret: así Cloudinary
// sabe que la petición viene de nuestro server, sin mandar el secreto.
async function subirACloudinary(
  file: Express.Multer.File,
  carpeta: CarpetaImagenes,
): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  const folder = `petgram/${carpeta}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  const formData = new FormData();
  formData.append(
    'file',
    new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }),
    file.originalname || `imagen${EXTENSIONES[file.mimetype]}`,
  );
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('folder', folder);
  formData.append('signature', signature);

  try {
    const respuesta = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData },
    );
    const datos = (await respuesta.json()) as {
      secure_url?: string;
      error?: { message?: string };
    };

    if (!respuesta.ok || !datos.secure_url) {
      throw new Error(datos.error?.message ?? `status ${respuesta.status}`);
    }
    return datos.secure_url;
  } catch (error) {
    logger.error(`No se pudo subir la imagen a Cloudinary: ${(error as Error).message}`);
    throw new InternalServerErrorException(
      'No se pudo guardar la imagen. Intentá de nuevo en unos minutos.',
    );
  }
}

// ---------- Disco local (desarrollo) ----------

async function guardarEnDisco(
  file: Express.Multer.File,
  carpeta: CarpetaImagenes,
): Promise<string> {
  const directorio = join(process.cwd(), 'uploads', carpeta);
  await mkdir(directorio, { recursive: true });
  const nombre = `${randomUUID()}${EXTENSIONES[file.mimetype]}`;
  await writeFile(join(directorio, nombre), file.buffer);
  return `/uploads/${carpeta}/${nombre}`;
}
