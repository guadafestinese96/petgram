import { isDevMode } from '@angular/core';

// URL base del backend.
// - En desarrollo (npm start): el back local.
// - En producción (ng build / Vercel): el back publicado en Vercel.
//   👉 Cuando publiques el back, reemplazá esta dirección por la que te dé Vercel (sin "/" al final).
const URL_PRODUCCION = 'https://CAMBIAR-POR-TU-BACK.vercel.app';

export const API_URL = isDevMode() ? 'http://localhost:3000' : URL_PRODUCCION;
