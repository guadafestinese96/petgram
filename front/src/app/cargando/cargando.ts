import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, TimeoutError, forkJoin, timeout, timer } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { obtenerMensajeError } from '../shared/http-error';

// Tiempo mínimo que se ve la pantalla (para que el spinner no sea un "parpadeo")
const DURACION_MINIMA_MS = 900;

// Si el back no responde en este tiempo (por ejemplo, Vercel "despertando" o mala conexión
// en el celu) se muestra el error con "Reintentar" en vez de dejar el spinner para siempre.
const TIEMPO_MAXIMO_MS = 15000;

// Pantalla inicial: valida el token guardado contra POST /auth/autorizar.
// Válido => publicaciones (o la ruta que se quiso abrir). Inválido => login.
@Component({
  selector: 'app-cargando',
  templateUrl: './cargando.html',
  styleUrl: './cargando.css',
})
export class Cargando {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  mensaje = signal('Cargando Petgram...');
  error = signal<string | null>(null);

  private validacion?: Subscription;

  constructor() {
    // Angular reutiliza este componente si se vuelve a navegar a /cargando estando ya acá
    // (solo cambia ?destino=...). En ese caso ngOnInit NO se vuelve a ejecutar y el spinner
    // quedaba girando para siempre. Escuchando los query params se valida en cada llegada.
    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.validarSesion());
  }

  validarSesion() {
    this.error.set(null);
    this.validacion?.unsubscribe();

    // La sesión ya se validó (por ejemplo, otra navegación llegó primero): ir directo
    if (this.authService.obtenerToken() && this.authService.sesionValidada) {
      this.router.navigateByUrl(this.destino());
      return;
    }

    if (!this.authService.obtenerToken()) {
      this.mensaje.set('Preparando todo...');
      timer(DURACION_MINIMA_MS).subscribe(() => this.router.navigate(['/login']));
      return;
    }

    this.mensaje.set('Verificando tu sesión...');
    this.validacion = forkJoin([
      this.authService.autorizar().pipe(timeout(TIEMPO_MAXIMO_MS)),
      timer(DURACION_MINIMA_MS),
    ]).subscribe({
      next: ([respuesta]) => {
        this.authService.actualizarUsuario(respuesta.usuario);
        this.authService.sesionValidada = true;
        this.router.navigateByUrl(this.destino());
      },
      error: (err) => {
        // 401: el interceptor ya cerró la sesión y redirigió al login
        if (err?.status === 401) return;
        if (err instanceof TimeoutError) {
          this.error.set('El servidor está tardando en responder. Tocá "Reintentar".');
          return;
        }
        this.error.set(obtenerMensajeError(err));
      },
    });
  }

  irAlLogin() {
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }

  // Solo rutas internas (evita redirecciones raras con ?destino=...)
  private destino(): string {
    const destino = this.route.snapshot.queryParamMap.get('destino');
    return destino?.startsWith('/') && !destino.startsWith('/cargando') && !destino.startsWith('//')
      ? destino
      : '/publicaciones';
  }
}
