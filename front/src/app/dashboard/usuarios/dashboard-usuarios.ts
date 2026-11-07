import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { Usuario } from '../../models/usuario';
import { AuthService } from '../../services/auth.service';
import { UsuariosService } from '../../services/usuarios.service';
import { ImagenRespaldoDirective } from '../../shared/directivas/imagen-respaldo.directive';
import { obtenerMensajeError } from '../../shared/http-error';
import { Modal, TipoModal } from '../../shared/modal/modal';
import { PluralPipe } from '../../shared/pipes/plural.pipe';
import { TiempoRelativoPipe } from '../../shared/pipes/tiempo-relativo.pipe';
import { UrlImagenPipe } from '../../shared/pipes/url-imagen.pipe';
import { FormNuevoUsuario } from './form-nuevo-usuario';

type Filtro = 'todos' | 'activos' | 'deshabilitados' | 'administradores';

// Dashboard / usuarios: listado, alta de nuevos usuarios y alta / baja lógica
@Component({
  selector: 'app-dashboard-usuarios',
  imports: [
    FontAwesomeModule,
    Modal,
    FormNuevoUsuario,
    ImagenRespaldoDirective,
    PluralPipe,
    TiempoRelativoPipe,
    UrlImagenPipe,
  ],
  templateUrl: './dashboard-usuarios.html',
  styleUrl: './dashboard-usuarios.css',
})
export class DashboardUsuarios implements OnInit {
  private usuariosService = inject(UsuariosService);
  private authService = inject(AuthService);

  faUserPlus = faUserPlus;

  usuarios = signal<Usuario[]>([]);
  cargando = signal(false);
  creando = signal(false); // ventana "nuevo usuario"
  procesandoId = signal<string | null>(null);
  filtro = signal<Filtro>('todos');
  busqueda = signal('');

  // Confirmación antes de habilitar / deshabilitar
  confirmacion = signal<{ usuario: Usuario; habilitar: boolean } | null>(null);
  modal = signal<{ visible: boolean; tipo: TipoModal; titulo: string; mensaje: string }>({
    visible: false,
    tipo: 'info',
    titulo: '',
    mensaje: '',
  });

  idActual = computed(() => this.authService.usuarioActual()?._id);

  filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return this.usuarios().filter((u) => {
      const pasaFiltro =
        this.filtro() === 'todos' ||
        (this.filtro() === 'activos' && u.activo) ||
        (this.filtro() === 'deshabilitados' && !u.activo) ||
        (this.filtro() === 'administradores' && u.perfil === 'administrador');
      const pasaBusqueda =
        !texto ||
        `${u.nombre} ${u.apellido} ${u.nombreUsuario} ${u.correo}`.toLowerCase().includes(texto);
      return pasaFiltro && pasaBusqueda;
    });
  });

  resumen = computed(() => ({
    total: this.usuarios().length,
    activos: this.usuarios().filter((u) => u.activo).length,
    admins: this.usuarios().filter((u) => u.perfil === 'administrador').length,
  }));

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.usuariosService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.mostrarModal('error', 'No se pudieron cargar los usuarios', obtenerMensajeError(err));
      },
    });
  }

  cambiarFiltro(valor: string) {
    this.filtro.set(valor as Filtro);
  }

  pedirConfirmacion(usuario: Usuario) {
    this.confirmacion.set({ usuario, habilitar: !usuario.activo });
  }

  mensajeConfirmacion(): string {
    const c = this.confirmacion();
    if (!c) return '';
    return c.habilitar
      ? `@${c.usuario.nombreUsuario} va a poder volver a ingresar y usar Petgram.`
      : `@${c.usuario.nombreUsuario} no va a poder ingresar a la aplicación. Si intenta iniciar sesión se le avisará que está deshabilitado.`;
  }

  confirmarCambio() {
    const c = this.confirmacion();
    this.confirmacion.set(null);
    if (!c) return;

    this.procesandoId.set(c.usuario._id);
    const peticion = c.habilitar
      ? this.usuariosService.habilitar(c.usuario._id)
      : this.usuariosService.deshabilitar(c.usuario._id);

    peticion.subscribe({
      next: (respuesta) => {
        this.procesandoId.set(null);
        this.usuarios.update((lista) =>
          lista.map((u) => (u._id === respuesta.usuario._id ? respuesta.usuario : u)),
        );
        this.mostrarModal('exito', c.habilitar ? 'Usuario habilitado' : 'Usuario deshabilitado', respuesta.mensaje);
      },
      error: (err) => {
        this.procesandoId.set(null);
        this.mostrarModal('error', 'No se pudo completar la acción', obtenerMensajeError(err));
      },
    });
  }

  onCreado(usuario: Usuario) {
    this.creando.set(false);
    this.usuarios.update((lista) => [usuario, ...lista]);
    this.mostrarModal(
      'exito',
      '¡Usuario creado!',
      `@${usuario.nombreUsuario} fue creado con perfil "${usuario.perfil}".`,
    );
  }

  private mostrarModal(tipo: TipoModal, titulo: string, mensaje: string) {
    this.modal.set({ visible: true, tipo, titulo, mensaje });
  }

  cerrarModal() {
    this.modal.update((m) => ({ ...m, visible: false }));
  }
}
