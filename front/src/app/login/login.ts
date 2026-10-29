import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { obtenerMensajeError } from '../shared/http-error';
import { Modal, TipoModal } from '../shared/modal/modal';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, Modal],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;
  cargando = false;

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
    this.loginForm = this.fb.group({
      // Correo o nombre de usuario
      identificador: ['', [Validators.required]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/),
        ],
      ],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: (respuesta) => {
        this.cargando = false;
        this.cdr.markForCheck();
        this.authService.guardarSesion(respuesta);
        this.router.navigate(['/publicaciones']);
      },
      error: (err) => {
        this.cargando = false;
        this.modal = {
          visible: true,
          tipo: 'error',
          titulo: 'No se pudo iniciar sesión',
          mensaje: obtenerMensajeError(err),
        };
        // Necesario en Angular zoneless: avisa que hay que volver a dibujar la pantalla
        this.cdr.markForCheck();
      },
    });
  }

  cerrarModal() {
    this.modal.visible = false;
  }
}