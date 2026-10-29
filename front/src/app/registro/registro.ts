import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { obtenerMensajeError } from '../shared/http-error';
import { Modal, TipoModal } from '../shared/modal/modal';

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGEN_MB = 5;

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink, Modal],
  templateUrl: './registro.html',
  styleUrls: ['./registro.css'],
})
export class Registro {
  registroForm: FormGroup;
  archivoSeleccionado: File | null = null;
  cargando = false;
  irAPublicacionesAlCerrar = false;

  modal: { visible: boolean; tipo: TipoModal; titulo: string; mensaje: string } = {
    visible: false,
    tipo: 'info',
    titulo: '',
    mensaje: '',
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.registroForm = this.fb.group(
      {
        nombre: ['', [Validators.required]],
        apellido: ['', [Validators.required]],
        correo: ['', [Validators.required, Validators.email]],
        nombreUsuario: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.pattern(/^[a-zA-Z0-9_.]+$/),
          ],
        ],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/),
          ],
        ],
        repetirPassword: ['', [Validators.required]],
        fechaNacimiento: ['', [Validators.required]],
        descripcionBreve: ['', [Validators.required, Validators.maxLength(150)]],
        // "perfil" ya no se manda: el back siempre crea "usuario".
        // El perfil "administrador" lo asigna otro admin desde el dashboard (Sprint #4).
      },
      { validators: this.passwordMatchValidator },
    );
  }

  // Validador para chequear que las contraseñas coincidan
  passwordMatchValidator(form: FormGroup) {
    const pass = form.get('password')?.value;
    const repetirPass = form.get('repetirPassword')?.value;
    return pass === repetirPass ? null : { mismatch: true };
  }

  // Capturar la imagen de perfil seleccionada (validando tipo y tamaño)
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      this.archivoSeleccionado = null;
      return;
    }

    if (!TIPOS_IMAGEN.includes(file.type)) {
      this.rechazarImagen(input, 'La imagen debe ser JPG, PNG, WEBP o GIF.');
      return;
    }
    if (file.size > MAX_IMAGEN_MB * 1024 * 1024) {
      this.rechazarImagen(input, `La imagen no puede pesar más de ${MAX_IMAGEN_MB} MB.`);
      return;
    }

    this.archivoSeleccionado = file;
  }

  private rechazarImagen(input: HTMLInputElement, mensaje: string) {
    input.value = '';
    this.archivoSeleccionado = null;
    this.mostrarModal('error', 'Imagen no válida', mensaje);
  }

  onSubmit() {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    // El back espera multipart/form-data porque lleva un archivo
    const formData = new FormData();
    Object.entries(this.registroForm.value).forEach(([campo, valor]) => {
      formData.append(campo, valor as string);
    });
    if (this.archivoSeleccionado) {
      formData.append('imagen', this.archivoSeleccionado);
    }

    this.cargando = true;
    this.authService.registro(formData).subscribe({
      next: (respuesta) => {
        this.cargando = false;
        this.cdr.markForCheck();
        this.authService.guardarSesion(respuesta);
        this.irAPublicacionesAlCerrar = true;
        this.mostrarModal(
          'exito',
          '¡Registro exitoso!',
          `Bienvenido/a, ${respuesta.usuario.nombre}. Tu cuenta fue creada correctamente.`,
        );
      },
      error: (err) => {
        this.cargando = false;
        this.mostrarModal(
          'error',
          'No se pudo completar el registro',
          obtenerMensajeError(err),
        );
      },
    });
  }

  mostrarModal(tipo: TipoModal, titulo: string, mensaje: string) {
    this.modal = { visible: true, tipo, titulo, mensaje };
    // Necesario en Angular zoneless: avisa que hay que volver a dibujar la pantalla
    this.cdr.markForCheck();
  }

  cerrarModal() {
    this.modal.visible = false;
    if (this.irAPublicacionesAlCerrar) {
      this.router.navigate(['/publicaciones']);
    }
  }
}