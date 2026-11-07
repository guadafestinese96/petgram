import { Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

// DIRECTIVA PROPIA #2 (de atributo)
// Pone el foco en el input / textarea apenas aparece en pantalla y, opcionalmente,
// deja el cursor al final del texto (útil al editar un comentario).
// Uso:  <textarea appAutofocus></textarea>   <input appAutofocus [cursorAlFinal]="true" />
@Directive({ selector: '[appAutofocus]' })
export class AutofocusDirective {
  cursorAlFinal = input(false);

  constructor() {
    const elemento = inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef);

    afterNextRender(() => {
      const campo = elemento.nativeElement;
      campo.focus();
      if (this.cursorAlFinal() && typeof campo.setSelectionRange === 'function') {
        const largo = campo.value.length;
        campo.setSelectionRange(largo, largo);
      }
    });
  }
}
