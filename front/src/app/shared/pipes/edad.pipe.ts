import { Pipe, PipeTransform } from '@angular/core';

// PIPE PROPIA #2
// Calcula la edad a partir de la fecha de nacimiento.
// Uso:  {{ usuario.fechaNacimiento | edad }}  =>  "24 años"
@Pipe({ name: 'edad' })
export class EdadPipe implements PipeTransform {
  transform(fechaNacimiento: string | Date | null | undefined): string {
    if (!fechaNacimiento) return '';
    const nacimiento = new Date(fechaNacimiento);
    if (Number.isNaN(nacimiento.getTime())) return '';

    // Se usa UTC porque la fecha se guarda como medianoche UTC (evita correrse un día)
    const hoy = new Date();
    let edad = hoy.getUTCFullYear() - nacimiento.getUTCFullYear();
    const yaCumplio =
      hoy.getUTCMonth() > nacimiento.getUTCMonth() ||
      (hoy.getUTCMonth() === nacimiento.getUTCMonth() &&
        hoy.getUTCDate() >= nacimiento.getUTCDate());
    if (!yaCumplio) edad--;

    if (edad < 0) return '';
    return edad === 1 ? '1 año' : `${edad} años`;
  }
}
