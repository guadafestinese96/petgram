import { Pipe, PipeTransform } from '@angular/core';

// PIPE PROPIA #1
// Muestra una fecha como texto relativo, al estilo de las redes sociales.
// Uso:  {{ publicacion.createdAt | tiempoRelativo }}  =>  "hace 5 min", "hace 2 días", "03/10/2026"
@Pipe({ name: 'tiempoRelativo' })
export class TiempoRelativoPipe implements PipeTransform {
  transform(valor: string | Date | null | undefined): string {
    if (!valor) return '';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '';

    const segundos = Math.floor((Date.now() - fecha.getTime()) / 1000);
    if (segundos < 60) return 'recién';

    const minutos = Math.floor(segundos / 60);
    if (minutos < 60) return `hace ${minutos} min`;

    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `hace ${horas} h`;

    const dias = Math.floor(horas / 24);
    if (dias === 1) return 'ayer';
    if (dias < 7) return `hace ${dias} días`;

    // Más de una semana: fecha completa
    const dd = String(fecha.getDate()).padStart(2, '0');
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${fecha.getFullYear()}`;
  }
}
