import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCamera, faChartPie, faUser } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../services/auth.service';
import { ImagenRespaldoDirective } from '../shared/directivas/imagen-respaldo.directive';
import { SoloAdminDirective } from '../shared/directivas/solo-admin.directive';
import { UrlImagenPipe } from '../shared/pipes/url-imagen.pipe';

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

  private urlImagen = new UrlImagenPipe();

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  // Foto de perfil del usuario logueado (null si no hay sesión o no subió foto)
  get imagenUrl(): string | null {
    const imagen = this.authService.usuarioActual()?.imagenPerfil;
    // La pipe resuelve tanto rutas locales (/uploads/...) como URLs de Cloudinary (https://...)
    return this.urlImagen.transform(imagen);
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
