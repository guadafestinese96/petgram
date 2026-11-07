import { Pipe, PipeTransform } from '@angular/core';

// PIPE PROPIA #4 (extra)
// Escribe la cantidad con la palabra en singular o plural según corresponda.
// Uso:  {{ 1 | plural: 'huellita' }} => "1 huellita"   {{ 3 | plural: 'huellita' }} => "3 huellitas"
//       {{ n | plural: 'comentario' }}                  {{ n | plural: 'día' : 'días' }}
@Pipe({ name: 'plural' })
export class PluralPipe implements PipeTransform {
  transform(cantidad: number | null | undefined, singular: string, plural?: string): string {
    const n = cantidad ?? 0;
    const palabra = n === 1 ? singular : (plural ?? `${singular}s`);
    return `${n} ${palabra}`;
  }
}
