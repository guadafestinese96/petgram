import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Solo usuarios logueados. Si hay token pero todavía no se validó contra el back,
// pasa primero por la pantalla "cargando" y después vuelve a la ruta pedida.
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.obtenerToken()) {
    return router.createUrlTree(['/login']);
  }
  if (!authService.sesionValidada) {
    return router.createUrlTree(['/cargando'], { queryParams: { destino: state.url } });
  }
  return true;
};

// Solo administradores (se usa junto con authGuard)
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  return authService.esAdmin() ? true : inject(Router).createUrlTree(['/publicaciones']);
};

// Login y registro: si ya hay una sesión válida no tiene sentido mostrarlos
export const invitadoGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  if (authService.obtenerToken() && authService.sesionValidada) {
    return inject(Router).createUrlTree(['/publicaciones']);
  }
  return true;
};
