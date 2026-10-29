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
  @Output() cerrar = new EventEmitter<void>();

  iconos = {
    exito: faCircleCheck,
    error: faCircleXmark,
    info: faCircleInfo,
  };
}
