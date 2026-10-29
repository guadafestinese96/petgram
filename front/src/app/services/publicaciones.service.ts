import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api';
import {
  ListadoPublicaciones,
  OpcionesListado,
  Publicacion,
  ResultadoLike,
} from '../models/publicacion';

@Injectable({ providedIn: 'root' })
export class PublicacionesService {
  private url = `${API_URL}/publicaciones`;

  constructor(private http: HttpClient) {}

  listar(opciones: OpcionesListado = {}): Observable<ListadoPublicaciones> {
    let params = new HttpParams();
    Object.entries(opciones).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== '') {
        params = params.set(clave, String(valor));
      }
    });
    return this.http.get<ListadoPublicaciones>(this.url, { params });
  }

  // multipart/form-data: titulo, mensaje e imagen (opcional)
  crear(formData: FormData): Observable<Publicacion> {
    return this.http.post<Publicacion>(this.url, formData);
  }

  eliminar(id: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.url}/${id}`);
  }

  darLike(id: string): Observable<ResultadoLike> {
    return this.http.post<ResultadoLike>(`${this.url}/${id}/like`, {});
  }

  quitarLike(id: string): Observable<ResultadoLike> {
    return this.http.delete<ResultadoLike>(`${this.url}/${id}/like`);
  }
}
