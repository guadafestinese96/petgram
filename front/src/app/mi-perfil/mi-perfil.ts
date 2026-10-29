import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { API_URL } from '../config/api';
import { Usuario } from '../models/usuario';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-mi-perfil',
  imports: [DatePipe, RouterLink],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil {
  usuario: Usuario | null;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    this.usuario = this.authService.obtenerUsuario();
  }

  get imagenUrl(): string | null {
    return this.usuario?.imagenPerfil ? API_URL + this.usuario.imagenPerfil : null;
  }

  cerrarSesion() {
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
