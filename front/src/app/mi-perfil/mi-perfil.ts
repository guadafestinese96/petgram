import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Publicacion } from '../models/publicacion';
import { Usuario } from '../models/usuario';
import { PublicacionCard } from '../publicacion-card/publicacion-card';
import { AuthService } from '../services/auth.service';
import { PublicacionesService } from '../services/publicaciones.service';
import { ImagenRespaldoDirective } from '../shared/directivas/imagen-respaldo.directive';
import { SoloAdminDirective } from '../shared/directivas/solo-admin.directive';
import { obtenerMensajeError } from '../shared/http-error';
import { Modal } from '../shared/modal/modal';
import { EdadPipe } from '../shared/pipes/edad.pipe';
import { UrlImagenPipe } from '../shared/pipes/url-imagen.pipe';
import { EditarPerfil } from './editar-perfil/editar-perfil';

@Component({
  selector: 'app-mi-perfil',
  imports: [
    DatePipe,
    RouterLink,
    PublicacionCard,
    Modal,
    EditarPerfil,
    EdadPipe,
    UrlImagenPipe,
    ImagenRespaldoDirective,
    SoloAdminDirective,
  ],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil implements OnInit {
  ultimasPublicaciones = signal<Publicacion[]>([]);
  cargando = signal(false);
  editando = signal(false);
  modalError = signal({ visible: false, mensaje: '' });

  constructor(
    private authService: AuthService,
    private publicacionesService: PublicacionesService,
    private router: Router,
  ) {}

  // Siempre el dato actualizado (por ejemplo después de editar el perfil)
  get usuario(): Usuario | null {
    return this.authService.usuarioActual();
  }

  ngOnInit() {
    this.cargarPublicaciones();
  }

  // Mis últimas 3 publicaciones (cada card muestra sus comentarios)
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
