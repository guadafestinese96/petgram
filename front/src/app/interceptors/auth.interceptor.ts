import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_URL } from '../config/api';
import { AuthService } from '../services/auth.service';

// En login y registro un 401 significa "credenciales incorrectas", no "sesión vencida"
const RUTAS_SIN_SESION = ['/auth/login', '/auth/registro'];

// 1) Agrega el header  Authorization: Bearer <token>  a todas las peticiones a nuestro back
// 2) Si alguna petición devuelve 401, cierra la sesión y redirige al login para rehacer el token
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const esNuestroBack = req.url.startsWith(API_URL);
  const token = authService.obtenerToken();

  if (token && esNuestroBack) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((err: unknown) => {
      const esRutaSinSesion = RUTAS_SIN_SESION.some((ruta) => req.url.includes(ruta));

      if (err instanceof HttpErrorResponse && err.status === 401 && esNuestroBack && !esRutaSinSesion) {
        const motivo = String(err.error?.message ?? '').includes('deshabilitado')
          ? 'deshabilitado'
          : 'sesion';
        authService.cerrarSesion();
        router.navigate(['/login'], { queryParams: { motivo } });
      }
      return throwError(() => err);
    }),
  );
};
