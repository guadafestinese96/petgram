import { Component, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './navbar/navbar';
import { SesionService } from './services/sesion.service';
import { Modal } from './shared/modal/modal';

@Component({
  imports: [RouterOutlet, Navbar, Modal],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  // Contador de sesión: a los 10 minutos avisa que quedan 5 y ofrece extenderla
  protected sesion = inject(SesionService);

  constructor() {
    // La app se instala como PWA y el service worker guarda una copia de la versión.
    // Cuando Vercel publica una versión nueva, la recargamos sola para no quedar con la vieja.
    const swUpdate = inject(SwUpdate);
    if (swUpdate.isEnabled) {
      swUpdate.versionUpdates
        .pipe(filter((evento) => evento.type === 'VERSION_READY'))
        .subscribe(() => document.location.reload());
      swUpdate.checkForUpdate().catch(() => undefined);
    }
  }
}
