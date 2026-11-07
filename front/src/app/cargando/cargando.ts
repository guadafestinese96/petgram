import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, timer } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { obtenerMensajeError } from '../shared/http-error';

// Tiempo mínimo que se ve la pantalla (para que el spinner no sea un "parpadeo")
const DURACION_MINIMA_MS = 900;

// Pantalla inicial: valida el token guardado contra POST /auth/autorizar.
// Válido => publicaciones (o la ruta que se quiso abrir). Inválido => login.
@Component({
  selector: 'app-cargando',
  templateUrl: './cargando.html',
  styleUrl: './cargando.css',
})
export class Cargando implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  mensaje = signal('Cargando Petgram...');
  error = signal<string | null>(null);

  ngOnInit() {
    this.validarSesion();
  }

  validarSesion() {
    this.error.set(null);

    if (!this.authService.obtenerToken()) {
      this.mensaje.set('Preparando todo...');
      timer(DURACION_MINIMA_MS).subscribe(() => this.router.navigate(['/login']));
      return;
    }

    this.mensaje.set('Verificando tu sesión...');
    forkJoin([this.authService.autorizar(), timer(DURACION_MINIMA_MS)]).subscribe({
      next: ([respuesta]) => {
        this.authService.actualizarUsuario(respuesta.usuario);
        this.authService.sesionValidada = true;
        this.router.navigateByUrl(this.destino());
      },
      error: (err) => {
        // 401: el interceptor ya cerró la sesión y redirigió al login
        if (err?.status === 401) return;
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
