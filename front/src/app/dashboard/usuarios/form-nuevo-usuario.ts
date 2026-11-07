import { Component, inject, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { Usuario } from '../../models/usuario';
import { UsuariosService } from '../../services/usuarios.service';
import { AutofocusDirective } from '../../shared/directivas/autofocus.directive';
import { obtenerMensajeError } from '../../shared/http-error';
import { validarImagen } from '../../shared/imagen';
import { Modal } from '../../shared/modal/modal';

const PATRON_PASSWORD = /^(?=.*[A-Z])(?=.*\d).+$/;
const PATRON_USUARIO = /^[a-zA-Z0-9_.]+$/;

function passwordsIguales(form: AbstractControl): ValidationErrors | null {
  return form.get('password')?.value === form.get('repetirPassword')?.value
    ? null
    : { mismatch: true };
}

// Formulario de registro de nuevos usuarios desde el dashboard.
// Mismos datos que el registro + dos radio buttons para elegir el perfil.
@Component({
  selector: 'app-form-nuevo-usuario',
  imports: [ReactiveFormsModule, FontAwesomeModule, Modal, AutofocusDirective],
  templateUrl: './form-nuevo-usuario.html',
  styleUrl: './form-nuevo-usuario.css',
})
export class FormNuevoUsuario {
  private fb = inject(FormBuilder);
  private usuariosService = inject(UsuariosService);

  visible = input(false);
  cerrar = output<void>();
  creado = output<Usuario>();

  faXmark = faXmark;
  archivo: File | null = null;
  enviando = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(30)]],
      apellido: ['', [Validators.required, Validators.maxLength(30)]],
      correo: ['', [Validators.required, Validators.email]],
      nombreUsuario: [
        '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(20), Validators.pattern(PATRON_USUARIO)],
      ],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(PATRON_PASSWORD)]],
      repetirPassword: ['', [Validators.required]],
      fechaNacimiento: ['', [Validators.required]],
      descripcionBreve: ['', [Validators.required, Validators.maxLength(150)]],
      perfil: ['usuario' as 'usuario' | 'administrador', [Validators.required]],
    },
    { validators: passwordsIguales },
  );

  // true si el campo fue tocado y tiene el error indicado (o cualquier error)
  invalido(campo: string, error?: string): boolean {
    const control = this.form.get(campo);
    if (!control?.touched) return false;
    return error ? control.hasError(error) : control.invalid;
  }

  onFileSelected(event: Event) {
    const inputArchivo = event.target as HTMLInputElement;
    const file = inputArchivo.files?.[0];
    this.archivo = null;
    if (!file) return;

    const error = validarImagen(file);
    if (error) {
      inputArchivo.value = '';
      this.error.set(error);
      return;
    }
    this.archivo = file;
  }

  enviar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    Object.entries(this.form.getRawValue()).forEach(([campo, valor]) => {
      formData.append(campo, String(valor).trim());
    });
    if (this.archivo) formData.append('imagen', this.archivo);

    this.enviando.set(true);
    this.usuariosService.crear(formData).subscribe({
      next: (usuario) => {
        this.enviando.set(false);
        this.limpiar();
        this.creado.emit(usuario);
      },
      error: (err) => {
        this.enviando.set(false);
        this.error.set(obtenerMensajeError(err));
      },
    });
  }

  cancelar() {
    this.limpiar();
    this.cerrar.emit();
  }

  private limpiar() {
    this.form.reset();
    this.archivo = null;
  }
}
