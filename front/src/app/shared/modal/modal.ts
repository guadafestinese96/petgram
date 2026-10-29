import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCircleCheck,
  faCircleInfo,
  faCircleXmark,
} from '@fortawesome/free-solid-svg-icons';

export type TipoModal = 'exito' | 'error' | 'info';

@Component({
  selector: 'app-modal',
  imports: [FontAwesomeModule],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class Modal {
  @Input() visible = false;
  @Input() tipo: TipoModal = 'info';
  @Input() titulo = '';
  @Input() mensaje = '';
  @Input() textoBoton = 'Aceptar';

  // Modo confirmación: si se pasa textoCancelar aparece un segundo botón
  @Input() textoCancelar = '';
  // Pinta el botón principal de rojo (acciones destructivas como eliminar)
  @Input() peligro = false;

  // Botón principal (y fondo oscuro cuando NO hay botón de cancelar)
  @Output() cerrar = new EventEmitter<void>();
  // Botón cancelar (y fondo oscuro cuando SÍ hay botón de cancelar)
  @Output() cancelar = new EventEmitter<void>();

  iconos = {
    exito: faCircleCheck,
    error: faCircleXmark,
    info: faCircleInfo,
  };

  clickFondo() {
    if (this.textoCancelar) {
      this.cancelar.emit();
    } else {
      this.cerrar.emit();
    }
  }
}
