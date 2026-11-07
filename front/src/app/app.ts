import { Component, inject } from '@angular/core';
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
}
