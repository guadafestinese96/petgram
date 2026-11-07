import { Pipe, PipeTransform } from '@angular/core';
import { API_URL } from '../../config/api';

// PIPE PROPIA #3
// El back guarda las imágenes como ruta relativa ("/uploads/perfiles/xxx.jpg").
// Esta pipe le antepone la URL del servidor. Si no hay imagen devuelve null.
// Uso:  <img [src]="usuario.imagenPerfil | urlImagen" />
@Pipe({ name: 'urlImagen' })
export class UrlImagenPipe implements PipeTransform {
  transform(ruta: string | null | undefined): string | null {
    if (!ruta) return null;
    // Ya es una URL completa o una vista previa local (data:/blob:)
    if (/^(https?:|data:|blob:)/.test(ruta)) return ruta;
    return API_URL + ruta;
  }
}
