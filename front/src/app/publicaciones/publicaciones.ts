import { Component, OnInit, computed, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { NuevaPublicacion } from '../nueva-publicacion/nueva-publicacion';
import { OrdenPublicaciones, Publicacion } from '../models/publicacion';
import { PublicacionCard } from '../publicacion-card/publicacion-card';
import { PublicacionesService } from '../services/publicaciones.service';
import { obtenerMensajeError } from '../shared/http-error';
import { Modal } from '../shared/modal/modal';

const POR_PAGINA = 5;

@Component({
  imports: [PublicacionCard, NuevaPublicacion, FontAwesomeModule, Modal],
  selector: 'app-publicaciones',
  styleUrl: './publicaciones.css',
  templateUrl: './publicaciones.html',
})
export class Publicaciones implements OnInit {
  faPlus = faPlus;

  mostrandoFormulario = signal(false); // ventana de nueva publicación
  publicaciones = signal<Publicacion[]>([]);
  total = signal(0);
  pagina = signal(1); // empieza en 1
  orden = signal<OrdenPublicaciones>('fecha');
  cargando = signal(false);
  modalError = signal({ visible: false, mensaje: '' });

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / POR_PAGINA)));

  constructor(private publicacionesService: PublicacionesService) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);

    this.publicacionesService
      .listar({
        orden: this.orden(),
        offset: (this.pagina() - 1) * POR_PAGINA,
        limit: POR_PAGINA,
      })
      .subscribe({
        next: (resultado) => {
          this.publicaciones.set(resultado.publicaciones);
          this.total.set(resultado.total);
          this.cargando.set(false);
        },
        error: (err) => {
          this.cargando.set(false);
          this.modalError.set({ visible: true, mensaje: obtenerMensajeError(err) });
        },
      });
  }

  cambiarOrden(valor: string) {
    this.orden.set(valor === 'likes' ? 'likes' : 'fecha');
    this.pagina.set(1);
    this.cargar();
  }

  irAPagina(numero: number) {
    if (numero < 1 || numero > this.totalPaginas()) return;
    this.pagina.set(numero);
    this.cargar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Se creó una publicación nueva: vuelve a la primera página, ordenada por fecha
  onCreada() {
    this.orden.set('fecha');
    this.pagina.set(1);
    this.cargar();
  }

  // Se eliminó una: si era la última de la página, retrocede una página
  onEliminada() {
    if (this.publicaciones().length === 1 && this.pagina() > 1) {
      this.pagina.update((p) => p - 1);
    }
    this.cargar();
  }

  cerrarError() {
    this.modalError.update((m) => ({ ...m, visible: false }));
  }
}
