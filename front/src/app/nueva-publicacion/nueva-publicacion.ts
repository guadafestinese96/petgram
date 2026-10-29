import { Component, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faImage, faXmark } from '@fortawesome/free-solid-svg-icons';
import { PublicacionesService } from '../services/publicaciones.service';
import { obtenerMensajeError } from '../shared/http-error';
import { validarImagen } from '../shared/imagen';
import { Modal, TipoModal } from '../shared/modal/modal';

@Component({
  selector: 'app-nueva-publicacion',
  imports: [ReactiveFormsModule, FontAwesomeModule, Modal],
  templateUrl: './nueva-publicacion.html',
  styleUrl: './nueva-publicacion.css',
})
export class NuevaPublicacion {
  // El padre controla cuándo se muestra la ventana
  visible = input(false);
  cerrar = output<void>();
  // Avisa al padre para que recargue el listado
  creada = output<void>();

  faImage = faImage;
  faXmark = faXmark;

  form: FormGroup;
  archivo: File | null = null;
  previsualizacion = signal<string | null>(null);
  enviando = signal(false);
  modal = signal<{ visible: boolean; tipo: TipoModal; titulo: string; mensaje: string }>({
    visible: false,
    tipo: 'info',
    titulo: '',
    mensaje: '',
  });

  constructor(
    private fb: FormBuilder,
    private publicacionesService: PublicacionesService,
  ) {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(100)]],
      mensaje: ['', [Validators.required, Validators.maxLength(500)]],
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return; // el usuario canceló el selector: se conserva la imagen anterior

    const error = validarImagen(file);
    if (error) {
      input.value = '';
      this.mostrarModal('error', 'Imagen no válida', error);
      return;
    }

    this.archivo = file;

    // Vista previa: se lee el archivo como data URL para mostrarlo antes de subirlo
    const lector = new FileReader();
    lector.onload = () => this.previsualizacion.set(lector.result as string);
    lector.readAsDataURL(file);
  }

  quitarImagen(input: HTMLInputElement) {
    input.value = '';
    this.archivo = null;
    this.previsualizacion.set(null);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    formData.append('titulo', this.form.value.titulo);
    formData.append('mensaje', this.form.value.mensaje);
    if (this.archivo) {
      formData.append('imagen', this.archivo);
    }

    this.enviando.set(true);
    this.publicacionesService.crear(formData).subscribe({
      next: () => {
        this.enviando.set(false);
        this.limpiar();
        this.cerrar.emit();
        this.creada.emit();
        this.mostrarModal('exito', '¡Publicación creada!', 'Tu publicación ya está en el listado.');
      },
      error: (err) => {
        this.enviando.set(false);
        this.mostrarModal('error', 'No se pudo publicar', obtenerMensajeError(err));
      },
    });
  }

  cancelar() {
    this.limpiar();
    this.cerrar.emit();
  }

  private limpiar() {
    this.form.reset({ titulo: '', mensaje: '' });
    this.archivo = null;
    this.previsualizacion.set(null);
  }

  private mostrarModal(tipo: TipoModal, titulo: string, mensaje: string) {
    this.modal.set({ visible: true, tipo, titulo, mensaje });
  }

  cerrarModal() {
    this.modal.update((m) => ({ ...m, visible: false }));
  }
}
