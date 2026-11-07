import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Comentarios } from '../comentarios/comentarios';
import { Publicacion } from '../models/publicacion';
import { PublicacionCard } from '../publicacion-card/publicacion-card';
import { PublicacionesService } from '../services/publicaciones.service';
import { obtenerMensajeError } from '../shared/http-error';
import { Modal } from '../shared/modal/modal';

// Página "publicación": la publicación en grande + sus comentarios
@Component({
  selector: 'app-publicacion-detalle',
  imports: [PublicacionCard, Comentarios, Modal, RouterLink, FontAwesomeModule],
  templateUrl: './publicacion-detalle.html',
  styleUrl: './publicacion-detalle.css',
})
export class PublicacionDetalle implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private publicacionesService = inject(PublicacionesService);

  faArrowLeft = faArrowLeft;

  publicacion = signal<Publicacion | null>(null);
  cargando = signal(true);
  noEncontrada = signal(false);
  error = signal<string | null>(null);
  eliminadaOk = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.publicacionesService.obtener(id).subscribe({
      next: (publicacion) => {
        this.publicacion.set(publicacion);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        // 404 (no existe / dada de baja) o 400 (id mal formado)
        if (err instanceof HttpErrorResponse && (err.status === 404 || err.status === 400)) {
          this.noEncontrada.set(true);
        } else {
          this.error.set(obtenerMensajeError(err));
        }
      },
    });
  }

  // Se dio de baja desde esta página: aviso y vuelta al listado
  onEliminada() {
    this.eliminadaOk.set(true);
  }

  volverAlListado() {
    this.eliminadaOk.set(false);
    this.router.navigate(['/publicaciones']);
  }
}
