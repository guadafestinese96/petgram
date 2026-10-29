import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPaw, faTrash } from '@fortawesome/free-solid-svg-icons';
import { API_URL } from '../config/api';
import { Publicacion } from '../models/publicacion';
import { AuthService } from '../services/auth.service';
import { PublicacionesService } from '../services/publicaciones.service';
import { obtenerMensajeError } from '../shared/http-error';
import { Modal } from '../shared/modal/modal';

@Component({
  selector: 'app-publicacion-card',
  imports: [FontAwesomeModule, DatePipe, Modal],
  templateUrl: './publicacion-card.html',
  styleUrl: './publicacion-card.css',
})
export class PublicacionCard {
  private authService = inject(AuthService);
  private publicacionesService = inject(PublicacionesService);

  // Entrada: la publicación a mostrar. Salida: avisa al padre cuando se eliminó.
  publicacion = input.required<Publicacion>();
  eliminada = output<string>();

  faPaw = faPaw;
  faTrash = faTrash;

  // Estado local del like: arranca con lo que vino del back y se actualiza con la respuesta
  meGusta = linkedSignal(() => this.publicacion().meGusta);
  cantidadLikes = linkedSignal(() => this.publicacion().cantidadLikes);

  mostrarPaw = signal(false); // huella grande del doble click
  procesandoLike = signal(false);
  confirmandoEliminar = signal(false);
  modalError = signal({ visible: false, titulo: '', mensaje: '' });

  // Solo el dueño ve el botón de eliminar (el admin se habilita en el Sprint #4)
  puedeEliminar = computed(
    () => this.publicacion().usuario._id === this.authService.usuarioActual()?._id,
  );

  imagenUrl = computed(() => {
    const imagen = this.publicacion().imagen;
    return imagen ? API_URL + imagen : null;
  });

  avatarUrl = computed(() => {
    const imagen = this.publicacion().usuario.imagenPerfil;
    return imagen ? API_URL + imagen : null;
  });

  inicial = computed(() =>
    this.publicacion().usuario.nombreUsuario.charAt(0).toUpperCase(),
  );

  // Click en la huellita: da o quita el me gusta
  alternarLike() {
    if (this.procesandoLike()) return;
    this.procesandoLike.set(true);

    const id = this.publicacion()._id;
    const peticion = this.meGusta()
      ? this.publicacionesService.quitarLike(id)
      : this.publicacionesService.darLike(id);

    peticion.subscribe({
      next: (resultado) => {
        this.meGusta.set(resultado.meGusta);
        this.cantidadLikes.set(resultado.cantidadLikes);
        this.procesandoLike.set(false);
      },
      error: (err) => {
        this.procesandoLike.set(false);
        this.mostrarError('No se pudo actualizar tu me gusta', obtenerMensajeError(err));
      },
    });
  }

  // Doble click en la imagen (como Instagram): solo da like, nunca lo quita
  dobleClick() {
    this.mostrarPaw.set(true);
    setTimeout(() => this.mostrarPaw.set(false), 800);
    if (!this.meGusta()) {
      this.alternarLike();
    }
  }

  pedirConfirmacion() {
    this.confirmandoEliminar.set(true);
  }

  confirmarEliminacion() {
    this.confirmandoEliminar.set(false);
    const id = this.publicacion()._id;

    this.publicacionesService.eliminar(id).subscribe({
      next: () => this.eliminada.emit(id),
      error: (err) =>
        this.mostrarError('No se pudo eliminar la publicación', obtenerMensajeError(err)),
    });
  }

  mostrarError(titulo: string, mensaje: string) {
    this.modalError.set({ visible: true, titulo, mensaje });
  }

  cerrarError() {
    this.modalError.update((m) => ({ ...m, visible: false }));
  }
}
