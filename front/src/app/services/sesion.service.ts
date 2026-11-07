import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { obtenerMensajeError } from '../shared/http-error';
import { AuthService } from './auth.service';

// El token vence a los 15 minutos. El aviso aparece 5 minutos antes del vencimiento,
// o sea, a los 10 minutos de haber iniciado (o refrescado) la sesión.
const AVISO_ANTES_DE_VENCER_MS = 5 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class SesionService {
  private authService = inject(AuthService);
  private router = inject(Router);

  mostrarAviso = signal(false);
  refrescando = signal(false);
  error = signal<string | null>(null);

  private timerAviso?: ReturnType<typeof setTimeout>;
  private timerVencimiento?: ReturnType<typeof setTimeout>;

  constructor() {
    // Cada vez que cambia el token (login, registro, refresco, logout) se reinicia el contador
    effect(() => {
      const token = this.authService.token();
      untracked(() => this.programar(token));
    });
  }

  // "Sí, extender": pide un token nuevo. El effect de arriba reinicia el contador solo.
  extender() {
    this.refrescando.set(true);
    this.authService.refrescar().subscribe({
      next: (respuesta) => {
        this.refrescando.set(false);
        this.mostrarAviso.set(false);
        this.authService.guardarToken(respuesta.token);
        this.authService.actualizarUsuario(respuesta.usuario);
      },
      error: (err) => {
        this.refrescando.set(false);
        this.mostrarAviso.set(false);
        // Un 401 ya lo resuelve el interceptor (lleva al login)
        if (err?.status !== 401) this.error.set(obtenerMensajeError(err));
      },
    });
  }

  // "No, gracias": se cierra el aviso y la sesión termina cuando venza el token
  rechazar() {
    this.mostrarAviso.set(false);
  }

  cerrarError() {
    this.error.set(null);
  }

  private programar(token: string | null) {
    this.limpiarTimers();
    this.mostrarAviso.set(false);

    const vence = token ? this.authService.vencimientoToken(token) : null;
    if (!vence) return;

    const restante = vence - Date.now();
    this.timerAviso = setTimeout(
      () => this.mostrarAviso.set(true),
      Math.max(0, restante - AVISO_ANTES_DE_VENCER_MS),
    );
    this.timerVencimiento = setTimeout(() => this.vencer(), Math.max(0, restante));
  }

  // El token venció: se cierra la sesión y se vuelve al login avisando el motivo
  private vencer() {
    this.mostrarAviso.set(false);
    this.authService.cerrarSesion();
    this.router.navigate(['/login'], { queryParams: { motivo: 'expirada' } });
  }

  private limpiarTimers() {
    clearTimeout(this.timerAviso);
    clearTimeout(this.timerVencimiento);
  }
}
