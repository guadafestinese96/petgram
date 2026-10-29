import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { API_URL } from '../config/api';
import { Publicacion } from '../models/publicacion';
import { Usuario } from '../models/usuario';
import { PublicacionCard } from '../publicacion-card/publicacion-card';
import { AuthService } from '../services/auth.service';
import { PublicacionesService } from '../services/publicaciones.service';
import { obtenerMensajeError } from '../shared/http-error';
import { Modal } from '../shared/modal/modal';

@Component({
  selector: 'app-mi-perfil',
  imports: [DatePipe, RouterLink, PublicacionCard, Modal],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil implements OnInit {
  usuario: Usuario | null;

  ultimasPublicaciones = signal<Publicacion[]>([]);
  cargando = signal(false);
  modalError = signal({ visible: false, mensaje: '' });

  constructor(
    private authService: AuthService,
    private publicacionesService: PublicacionesService,
    private router: Router,
  ) {
    this.usuario = this.authService.obtenerUsuario();
  }

  ngOnInit() {
    this.cargarPublicaciones();
  }

  get imagenUrl(): string | null {
    return this.usuario?.imagenPerfil ? API_URL + this.usuario.imagenPerfil : null;
  }

  // Mis últimas 3 publicaciones. Los comentarios se agregan en el Sprint #3.
  cargarPublicaciones() {
    if (!this.usuario) return;

    this.cargando.set(true);
    this.publicacionesService
      .listar({ usuario: this.usuario._id, orden: 'fecha', limit: 3 })
      .subscribe({
        next: (resultado) => {
          this.ultimasPublicaciones.set(resultado.publicaciones);
          this.cargando.set(false);
        },
        error: (err) => {
          this.cargando.set(false);
          this.modalError.set({ visible: true, mensaje: obtenerMensajeError(err) });
        },
      });
  }

  cerrarError() {
    this.modalError.update((m) => ({ ...m, visible: false }));
  }

  cerrarSesion() {
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
