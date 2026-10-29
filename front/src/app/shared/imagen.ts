export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGEN_MB = 5;

// Devuelve el mensaje de error si la imagen no sirve, o null si está bien
export function validarImagen(file: File): string | null {
  if (!TIPOS_IMAGEN.includes(file.type)) {
    return 'La imagen debe ser JPG, PNG, WEBP o GIF.';
  }
  if (file.size > MAX_IMAGEN_MB * 1024 * 1024) {
    return `La imagen no puede pesar más de ${MAX_IMAGEN_MB} MB.`;
  }
  return null;
}
