import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCamera, faChartPie, faUser } from '@fortawesome/free-solid-svg-icons';
import { API_URL } from '../config/api';
import { AuthService } from '../services/auth.service';
import { ImagenRespaldoDirective } from '../shared/directivas/imagen-respaldo.directive';
import { SoloAdminDirective } from '../shared/directivas/solo-admin.directive';

@Component({
  imports: [FontAwesomeModule, SoloAdminDirective, ImagenRespaldoDirective],
  standalone: true,
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  templateUrl: './navbar.html',
})
export class Navbar {
  faUser = faUser;
  faCamera = faCamera;
  faChartPie = faChartPie;

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  // Foto de perfil del usuario logueado (null si no hay sesión o no subió foto)
  get imagenUrl(): string | null {
    const imagen = this.authService.usuarioActual()?.imagenPerfil;
    return imagen ? API_URL + imagen : null;
  }

  redirigirSegunSesion() {
    // Si está logueado va a su perfil, si no al login
    if (this.authService.obtenerToken()) {
      this.router.navigate(['/mi-perfil']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  redirigirPublicaciones() {
    this.router.navigate(['/publicaciones']);
  }

  redirigirDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
