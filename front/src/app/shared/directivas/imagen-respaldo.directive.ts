import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

// DIRECTIVA PROPIA #3 (de atributo)
// Si una imagen no se puede cargar (se borró del servidor, URL rota, sin conexión),
// la reemplaza por una imagen de respaldo en lugar de mostrar el ícono de imagen rota.
// Uso:  <img [src]="url" appImagenRespaldo />
//       <img [src]="url" appImagenRespaldo="otra-imagen.png" />
@Directive({ selector: 'img[appImagenRespaldo]' })
export class ImagenRespaldoDirective {
  appImagenRespaldo = input<string>('');

  private img = inject<ElementRef<HTMLImageElement>>(ElementRef).nativeElement;
  private yaReemplazada = false;

  @HostListener('error')
  alFallar() {
    // Evita un bucle infinito si la imagen de respaldo también falla
    if (this.yaReemplazada) return;
    this.yaReemplazada = true;
    this.img.src = this.appImagenRespaldo() || 'LOGO-PETGRAM-REDONDO.png';
    this.img.classList.add('imagen-respaldo');
  }
}
