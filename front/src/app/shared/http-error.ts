import { HttpErrorResponse } from '@angular/common/http';

// Convierte cualquier error HTTP en un texto legible para mostrar en un modal
export function obtenerMensajeError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor. Intentá de nuevo en unos minutos.';
    }
    const mensaje = err.error?.message;
    // Nest devuelve un array cuando fallan varias validaciones a la vez
    if (Array.isArray(mensaje)) return mensaje.join('\n');
    if (typeof mensaje === 'string') return mensaje;
  }
  return 'Ocurrió un error inesperado. Intentá nuevamente.';
}
