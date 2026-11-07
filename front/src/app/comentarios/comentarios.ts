import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPaperPlane, faPen } from '@fortawesome/free-solid-svg-icons';
import { Comentario } from '../models/comentario';
import { AuthService } from '../services/auth.service';
import { ComentariosService } from '../services/comentarios.service';
import { AutofocusDirective } from '../shared/directivas/autofocus.directive';
import { ImagenRespaldoDirective } from '../shared/directivas/imagen-respaldo.directive';
import { obtenerMensajeError } from '../shared/http-error';
import { Modal } from '../shared/modal/modal';
import { PluralPipe } from '../shared/pipes/plural.pipe';
import { TiempoRelativoPipe } from '../shared/pipes/tiempo-relativo.pipe';
import { UrlImagenPipe } from '../shared/pipes/url-imagen.pipe';

const MAX_CARACTERES = 300;

// Comentarios de una publicación: se usan en la página "publicación" y en "Mi perfil".
// - Primera carga limitada; "Cargar más" trae los siguientes SIN borrar los anteriores.
// - Los más recientes arriba, uno debajo del otro.
// - El autor de un comentario puede editarlo; los editados muestran "(editado)".
@Component({
  selector: 'app-comentarios',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    FontAwesomeModule,
    DatePipe,
    Modal,
    AutofocusDirective,
    ImagenRespaldoDirective,
    PluralPipe,
    TiempoRelativoPipe,
    UrlImagenPipe,
  ],
  templateUrl: './comentarios.html',
  styleUrl: './comentarios.css',
})
export class Comentarios implements OnInit {
  private comentariosService = inject(ComentariosService);
  private authService = inject(AuthService);

  publicacionId = input.required<string>();
  porPagina = input(5);
  compacto = input(false); // versión chica para "Mi perfil"
  linkPublicacion = input(false); // muestra "Ver publicación" para ir al detalle
  // Avisa al padre el total actualizado (por ejemplo para el contador de la card)
  totalCambio = output<number>();

  faPaperPlane = faPaperPlane;
  faPen = faPen;
  maxCaracteres = MAX_CARACTERES;

  comentarios = signal<Comentario[]>([]);
  total = signal(0);
  cargando = signal(false);
  enviando = signal(false);
  editandoId = signal<string | null>(null);
  guardando = signal(false);
  modalError = signal({ visible: false, titulo: '', mensaje: '' });

  nuevo = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(MAX_CARACTERES), Validators.pattern(/\S/)],
  });
  edicion = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(MAX_CARACTERES), Validators.pattern(/\S/)],
  });

  ngOnInit() {
    this.cargar();
  }

  get restantes(): number {
    return Math.max(0, this.total() - this.comentarios().length);
  }

  esMio(comentario: Comentario): boolean {
    return comentario.usuario._id === this.authService.usuarioActual()?._id;
  }

  // offset = cantidad ya mostrada: así "Cargar más" sigue desde donde quedó
  cargar() {
    this.cargando.set(true);
    this.comentariosService
      .listar(this.publicacionId(), this.comentarios().length, this.porPagina())
      .subscribe({
        next: (resultado) => {
          // Evita duplicados si alguien comentó mientras tanto
          const ids = new Set(this.comentarios().map((c) => c._id));
          const nuevos = resultado.comentarios.filter((c) => !ids.has(c._id));
          this.comentarios.update((lista) => [...lista, ...nuevos]);
          this.total.set(resultado.total);
          this.totalCambio.emit(resultado.total);
          this.cargando.set(false);
        },
        error: (err) => {
          this.cargando.set(false);
          this.mostrarError('No se pudieron cargar los comentarios', obtenerMensajeError(err));
        },
      });
  }

  enviar() {
    if (this.nuevo.invalid || this.enviando()) {
      this.nuevo.markAsTouched();
      return;
    }

    this.enviando.set(true);
    this.comentariosService.crear(this.publicacionId(), this.nuevo.value.trim()).subscribe({
      next: (comentario) => {
        // El más reciente va arriba
        this.comentarios.update((lista) => [comentario, ...lista]);
        this.total.update((t) => t + 1);
        this.totalCambio.emit(this.total());
        this.nuevo.reset('');
        this.enviando.set(false);
      },
      error: (err) => {
        this.enviando.set(false);
        this.mostrarError('No se pudo publicar tu comentario', obtenerMensajeError(err));
      },
    });
  }

  empezarEdicion(comentario: Comentario) {
    this.edicion.reset(comentario.mensaje);
    this.editandoId.set(comentario._id);
  }

  cancelarEdicion() {
    this.editandoId.set(null);
  }

  guardarEdicion(comentario: Comentario) {
    const mensaje = this.edicion.value.trim();
    if (this.edicion.invalid || this.guardando()) return;
    if (mensaje === comentario.mensaje) {
      this.cancelarEdicion(); // no cambió nada
      return;
    }

    this.guardando.set(true);
    this.comentariosService.editar(this.publicacionId(), comentario._id, mensaje).subscribe({
      next: (editado) => {
        this.comentarios.update((lista) => lista.map((c) => (c._id === editado._id ? editado : c)));
        this.guardando.set(false);
        this.editandoId.set(null);
      },
      error: (err) => {
        this.guardando.set(false);
        this.mostrarError('No se pudo editar el comentario', obtenerMensajeError(err));
      },
    });
  }

  // Enter envía, Shift+Enter hace un salto de línea
  enterEnNuevo(evento: Event) {
    if ((evento as KeyboardEvent).shiftKey) return;
    evento.preventDefault();
    this.enviar();
  }

  enterEnEdicion(evento: Event, comentario: Comentario) {
    if ((evento as KeyboardEvent).shiftKey) return;
    evento.preventDefault();
    this.guardarEdicion(comentario);
  }

  private mostrarError(titulo: string, mensaje: string) {
    this.modalError.set({ visible: true, titulo, mensaje });
  }

  cerrarError() {
    this.modalError.update((m) => ({ ...m, visible: false }));
  }
}
