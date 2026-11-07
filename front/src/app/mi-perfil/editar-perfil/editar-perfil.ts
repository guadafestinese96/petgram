import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCamera, faXmark } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../services/auth.service';
import { UsuariosService } from '../../services/usuarios.service';
import { AutofocusDirective } from '../../shared/directivas/autofocus.directive';
import { obtenerMensajeError } from '../../shared/http-error';
import { validarImagen } from '../../shared/imagen';
import { Modal, TipoModal } from '../../shared/modal/modal';
import { UrlImagenPipe } from '../../shared/pipes/url-imagen.pipe';

// Ventana para editar los datos de "Mi perfil" (nombre, apellido, descripción y foto)
@Component({
  selector: 'app-editar-perfil',
  imports: [ReactiveFormsModule, FontAwesomeModule, Modal, AutofocusDirective, UrlImagenPipe],
  templateUrl: './editar-perfil.html',
  styleUrl: './editar-perfil.css',
})
export class EditarPerfil {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private usuariosService = inject(UsuariosService);

  visible = input(false);
  cerrar = output<void>();

  faXmark = faXmark;
  faCamera = faCamera;

  archivo: File | null = null;
  previsualizacion = signal<string | null>(null);
  guardando = signal(false);
  modal = signal<{ visible: boolean; tipo: TipoModal; titulo: string; mensaje: string }>({
    visible: false,
    tipo: 'info',
    titulo: '',
    mensaje: '',
  });

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(30)]],
    apellido: ['', [Validators.required, Validators.maxLength(30)]],
    descripcionBreve: ['', [Validators.required, Validators.maxLength(150)]],
  });

  constructor() {
    // Cada vez que se abre la ventana se cargan los datos actuales del usuario
    effect(() => {
      if (!this.visible()) return;
      const usuario = untracked(() => this.authService.usuarioActual());
      this.form.reset({
        nombre: usuario?.nombre ?? '',
        apellido: usuario?.apellido ?? '',
        descripcionBreve: usuario?.descripcionBreve ?? '',
      });
      this.archivo = null;
      this.previsualizacion.set(usuario?.imagenPerfil ?? null);
    });
  }

  onFileSelected(event: Event) {
    const inputArchivo = event.target as HTMLInputElement;
    const file = inputArchivo.files?.[0];
    if (!file) return;

    const error = validarImagen(file);
    if (error) {
      inputArchivo.value = '';
      this.mostrarModal('error', 'Imagen no válida', error);
      return;
    }

    this.archivo = file;
    const lector = new FileReader();
    lector.onload = () => this.previsualizacion.set(lector.result as string);
    lector.readAsDataURL(file);
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const formData = new FormData();
    formData.append('nombre', valores.nombre.trim());
    formData.append('apellido', valores.apellido.trim());
    formData.append('descripcionBreve', valores.descripcionBreve.trim());
    if (this.archivo) formData.append('imagen', this.archivo);

    this.guardando.set(true);
    this.usuariosService.actualizarMiPerfil(formData).subscribe({
      next: (usuario) => {
        this.guardando.set(false);
        this.authService.actualizarUsuario(usuario);
        this.cerrar.emit();
        this.mostrarModal('exito', '¡Perfil actualizado!', 'Tus datos se guardaron correctamente.');
      },
      error: (err) => {
        this.guardando.set(false);
        this.mostrarModal('error', 'No se pudo actualizar tu perfil', obtenerMensajeError(err));
      },
    });
  }

  private mostrarModal(tipo: TipoModal, titulo: string, mensaje: string) {
    this.modal.set({ visible: true, tipo, titulo, mensaje });
  }

  cerrarModal() {
    this.modal.update((m) => ({ ...m, visible: false }));
  }
}
