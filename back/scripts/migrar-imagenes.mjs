// Migra a Cloudinary las imágenes que se guardaron en back/uploads (desarrollo local)
// y actualiza las rutas en MongoDB. Se corre UNA sola vez, desde la carpeta "back":
//
//   node --env-file=.env scripts/migrar-imagenes.mjs --probar   (solo muestra qué haría)
//   node --env-file=.env scripts/migrar-imagenes.mjs            (migra de verdad)
//
// Necesita en back/.env: MONGO_URI, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';

const PROBAR = process.argv.includes('--probar');

const { MONGO_URI, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
  process.env;

const faltantes = Object.entries({
  MONGO_URI,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
})
  .filter(([, valor]) => !valor)
  .map(([nombre]) => nombre);

if (faltantes.length) {
  console.error(`❌ Faltan estas variables en back/.env: ${faltantes.join(', ')}`);
  process.exit(1);
}

// Qué campo de qué colección tiene imágenes
const DESTINOS = [
  { coleccion: 'Usuarios', campo: 'imagenPerfil', carpeta: 'perfiles' },
  { coleccion: 'Publicaciones', campo: 'imagen', carpeta: 'publicaciones' },
];

const TIPOS = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

// Si la misma imagen aparece más de una vez, se sube una sola vez
const yaSubidas = new Map();

async function subirACloudinary(rutaArchivo, carpeta) {
  if (yaSubidas.has(rutaArchivo)) return yaSubidas.get(rutaArchivo);

  const folder = `petgram/${carpeta}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
    .digest('hex');

  const contenido = await readFile(rutaArchivo);
  const tipo = TIPOS[extname(rutaArchivo).toLowerCase()] ?? 'application/octet-stream';

  const formData = new FormData();
  formData.append('file', new Blob([contenido], { type: tipo }), basename(rutaArchivo));
  formData.append('api_key', CLOUDINARY_API_KEY);
  formData.append('timestamp', timestamp);
  formData.append('folder', folder);
  formData.append('signature', signature);

  const respuesta = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData },
  );
  const datos = await respuesta.json();
  if (!respuesta.ok || !datos.secure_url) {
    throw new Error(datos.error?.message ?? `status ${respuesta.status}`);
  }

  yaSubidas.set(rutaArchivo, datos.secure_url);
  return datos.secure_url;
}

async function main() {
  console.log(PROBAR ? '🔎 Modo prueba: no se cambia nada.\n' : '🚀 Migrando imágenes...\n');

  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;

  const resumen = { migradas: 0, sinArchivo: 0, errores: 0 };

  for (const { coleccion, campo, carpeta } of DESTINOS) {
    const documentos = await db
      .collection(coleccion)
      .find({ [campo]: { $regex: '^/uploads/' } })
      .project({ [campo]: 1 })
      .toArray();

    console.log(`📂 ${coleccion}: ${documentos.length} imagen(es) locales`);

    for (const doc of documentos) {
      const rutaRelativa = doc[campo]; // "/uploads/perfiles/xxx.jpg"
      const rutaArchivo = join(process.cwd(), rutaRelativa.replace(/^\//, ''));

      if (!existsSync(rutaArchivo)) {
        console.log(`   ⚠️  No está el archivo ${rutaRelativa} (se deja como está)`);
        resumen.sinArchivo++;
        continue;
      }

      if (PROBAR) {
        console.log(`   • ${rutaRelativa}  →  se subiría a petgram/${carpeta}`);
        continue;
      }

      try {
        const url = await subirACloudinary(rutaArchivo, carpeta);
        await db.collection(coleccion).updateOne({ _id: doc._id }, { $set: { [campo]: url } });
        console.log(`   ✅ ${rutaRelativa}  →  ${url}`);
        resumen.migradas++;
      } catch (error) {
        console.log(`   ❌ ${rutaRelativa}: ${error.message}`);
        resumen.errores++;
      }
    }
    console.log('');
  }

  await mongoose.disconnect();

  if (PROBAR) {
    console.log('Listo. Si la lista está bien, corré el comando sin --probar.');
  } else {
    console.log(
      `Listo: ${resumen.migradas} migradas, ${resumen.sinArchivo} sin archivo, ${resumen.errores} con error.`,
    );
  }
}

main().catch(async (error) => {
  console.error('❌ Error:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
