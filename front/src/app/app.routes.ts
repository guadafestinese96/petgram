import { Routes } from '@angular/router';
import { Login } from './login/login';
import { MiPerfil } from './mi-perfil/mi-perfil';
import { Publicaciones } from './publicaciones/publicaciones';
import { Registro } from './registro/registro';

// Sprint #1: navegación libre entre pantallas (sin guards todavía).
// Los guards y la pantalla "cargando" llegan en el Sprint #3.
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'publicaciones', component: Publicaciones },
  { path: 'mi-perfil', component: MiPerfil },
  { path: '**', redirectTo: 'login' },
];
