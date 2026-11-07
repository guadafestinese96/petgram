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
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faComment, faPaw, faShieldHalved, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Comentarios } from '../comentarios/comentarios';
import { Publicacion } from '../models/publicacion';
import { AuthService } from '../services/auth.service';
import { PublicacionesService } from '../services/publicaciones.service';
import { ImagenRespaldoDirective } from '../shared/directivas/imagen-respaldo.directive';
import { obtenerMensajeError } from '../shared/http-error';
import { Modal } from '../shared/modal/modal';
import { PluralPipe } from '../shared/pipes/plural.pipe';
import { TiempoRelativoPipe } from '../shared/pipes/tiempo-relativo.pipe';
import { UrlImagenPipe } from '../shared/pipes/url-imagen.pipe';

@Component({
  selector: 'app-publicacion-card',
  imports: [
    FontAwesomeModule,
    DatePipe,
    Modal,
    Comentarios,
    ImagenRespaldoDirective,
    PluralPipe,
    TiempoRelativoPipe,
    UrlImagenPipe,
  ],
  templateUrl: './publicacion-card.html',
  styleUrl: './publicacion-card.css',
  host: { '[class.expandida]': 'expandida()' },
})
export class PublicacionCard {
  private authService = inject(AuthService);
  private publicacionesService = inject(PublicacionesService);
  private router = inject(Router);

  // Entrada: la publicación a mostrar. Salida: avisa al padre cuando se eliminó.
  publicacion = input.required<Publicacion>();
  // Página "publicación": se ve grande y sin el atajo a los comentarios
  expandida = input(false);
  // "Mi perfil": muestra los comentarios dentro de la card
  mostrarComentarios = input(false);
  eliminada = output<string>();

  faPaw = faPaw;
  faTrash = faTrash;
  faComment = faComment;
  faShield = faShieldHalved;

  // Estado local: arranca con lo que vino del back y se actualiza con cada respuesta
  meGusta = linkedSignal(() => this.publicacion().meGusta);
  cantidadLikes = linkedSignal(() => this.publicacion().cantidadLikes);
  cantidadComentarios = linkedSignal(() => this.publicacion().cantidadComentarios ?? 0);

  mostrarPaw = signal(false); // huella grande del doble click
  procesandoLike = signal(false);
  confirmandoEliminar = signal(false);
  modalError = signal({ visible: false, titulo: '', mensaje: '' });

  esPropia = computed(
    () => this.publicacion().usuario._id === this.authService.usuarioActual()?._id,
  );

  // El dueño puede borrar las suyas. Un administrador puede dar de baja cualquiera.
  puedeEliminar = computed(() => this.esPropia() || this.authService.esAdmin());

  // Admin borrando una publicación ajena: se le avisa con un mensaje distinto
  bajaComoAdmin = computed(() => !this.esPropia() && this.authService.esAdmin());

  mensajeConfirmacion = computed(() =>
    this.bajaComoAdmin()
      ? `Vas a dar de baja la publicación de @${this.publicacion().usuario.nombreUsuario} como administrador. Dejará de estar disponible, junto con todos sus comentarios.`
      : 'La publicación y sus comentarios dejarán de estar disponibles. Esta acción no se puede deshacer.',
  );

  inicial = computed(() =>
    this.publicacion().usuario.nombreUsuario.charAt(0).toUpperCase(),
  );

  irAlDetalle() {
    if (this.expandida()) return;
    this.router.navigate(['/publicacion', this.publicacion()._id]);
  }

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
