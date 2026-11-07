import { Routes } from '@angular/router';
import { Cargando } from './cargando/cargando';
import { adminGuard, authGuard, invitadoGuard } from './guards/auth.guards';
import { Login } from './login/login';
import { MiPerfil } from './mi-perfil/mi-perfil';
import { PublicacionDetalle } from './publicacion-detalle/publicacion-detalle';
import { Publicaciones } from './publicaciones/publicaciones';
import { Registro } from './registro/registro';

// - Al abrir la app se pasa por "cargando", que valida el token contra el back.
// - Solo se puede acceder a la app estando logueado (authGuard).
// - El dashboard es solo para administradores y se carga bajo demanda (lazy loading),
//   así la librería de gráficos no pesa para el resto de los usuarios.
export const routes: Routes = [
  { path: '', redirectTo: 'cargando', pathMatch: 'full' },
  { path: 'cargando', component: Cargando, title: 'Petgram' },
  { path: 'login', component: Login, canActivate: [invitadoGuard], title: 'Petgram · Iniciar sesión' },
  { path: 'registro', component: Registro, canActivate: [invitadoGuard], title: 'Petgram · Registro' },
  { path: 'publicaciones', component: Publicaciones, canActivate: [authGuard], title: 'Petgram · Publicaciones' },
  { path: 'publicacion/:id', component: PublicacionDetalle, canActivate: [authGuard], title: 'Petgram · Publicación' },
  { path: 'mi-perfil', component: MiPerfil, canActivate: [authGuard], title: 'Petgram · Mi perfil' },
  {
    path: 'dashboard',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
    children: [
      { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
      {
        path: 'usuarios',
        title: 'Petgram · Usuarios',
        loadComponent: () =>
          import('./dashboard/usuarios/dashboard-usuarios').then((m) => m.DashboardUsuarios),
      },
      {
        path: 'estadisticas',
        title: 'Petgram · Estadísticas',
        loadComponent: () =>
          import('./dashboard/estadisticas/dashboard-estadisticas').then(
            (m) => m.DashboardEstadisticas,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'cargando' },
];
