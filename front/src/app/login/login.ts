import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { obtenerMensajeError } from '../shared/http-error';
import { AutofocusDirective } from '../shared/directivas/autofocus.directive';
import { Modal, TipoModal } from '../shared/modal/modal';

// Mensajes que se muestran al llegar al login redirigido (ver interceptor y SesionService)
const MOTIVOS: Record<string, { titulo: string; mensaje: string }> = {
  expirada: {
    titulo: 'Tu sesión expiró',
    mensaje: 'Pasaron 15 minutos desde que iniciaste sesión. Volvé a ingresar para seguir.',
  },
  sesion: {
    titulo: 'Tenés que volver a iniciar sesión',
    mensaje: 'Tu sesión no es válida o ya venció. Ingresá nuevamente.',
  },
  deshabilitado: {
    titulo: 'Usuario deshabilitado',
    mensaje: 'Tu usuario fue deshabilitado por un administrador. No podés ingresar a la aplicación.',
  },
};

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, Modal, AutofocusDirective],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;
  cargando = false;
  private limpiarMotivo = false;

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
    route: ActivatedRoute,
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

    const motivo = MOTIVOS[route.snapshot.queryParamMap.get('motivo') ?? ''];
    if (motivo) {
      this.modal = { visible: true, tipo: 'info', ...motivo };
      this.limpiarMotivo = true;
    }
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
    // Limpia el ?motivo=... de la URL para que no vuelva a aparecer al recargar
    if (this.limpiarMotivo) {
      this.limpiarMotivo = false;
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }
}