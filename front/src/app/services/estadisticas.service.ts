import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api';
import {
  ComentariosPorDia,
  ComentariosPorPublicacion,
  PublicacionesPorUsuario,
} from '../models/estadisticas';

// Todas las rutas son solo para administradores. desde / hasta: 'AAAA-MM-DD'
@Injectable({ providedIn: 'root' })
export class EstadisticasService {
  private url = `${API_URL}/estadisticas`;

  constructor(private http: HttpClient) {}

  publicacionesPorUsuario(desde: string, hasta: string): Observable<PublicacionesPorUsuario> {
    return this.http.get<PublicacionesPorUsuario>(`${this.url}/publicaciones-por-usuario`, {
      params: this.rango(desde, hasta),
    });
  }

  comentariosPorDia(desde: string, hasta: string): Observable<ComentariosPorDia> {
    return this.http.get<ComentariosPorDia>(`${this.url}/comentarios`, {
      params: this.rango(desde, hasta),
    });
  }

  comentariosPorPublicacion(desde: string, hasta: string): Observable<ComentariosPorPublicacion> {
    return this.http.get<ComentariosPorPublicacion>(`${this.url}/comentarios-por-publicacion`, {
      params: this.rango(desde, hasta),
    });
  }

  private rango(desde: string, hasta: string) {
    return new HttpParams().set('desde', desde).set('hasta', hasta);
  }
}
