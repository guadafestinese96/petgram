import { Directive, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

// DIRECTIVA PROPIA #1 (estructural)
// Muestra el elemento solo si el usuario logueado es administrador.
// Si cambia la sesión (login / logout) se muestra u oculta solo.
// Uso:  <button *appSoloAdmin>Dashboard</button>
@Directive({ selector: '[appSoloAdmin]' })
export class SoloAdminDirective {
  private template = inject(TemplateRef);
  private contenedor = inject(ViewContainerRef);
  private authService = inject(AuthService);
  private visible = false;

  constructor() {
    effect(() => {
      const esAdmin = this.authService.esAdmin();
      if (esAdmin && !this.visible) {
        this.contenedor.createEmbeddedView(this.template);
        this.visible = true;
      } else if (!esAdmin && this.visible) {
        this.contenedor.clear();
        this.visible = false;
      }
    });
  }
}
