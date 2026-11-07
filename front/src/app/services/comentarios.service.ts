import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api';
import { Comentario, ListadoComentarios } from '../models/comentario';

@Injectable({ providedIn: 'root' })
export class ComentariosService {
  constructor(private http: HttpClient) {}

  private url(publicacionId: string) {
    return `${API_URL}/publicaciones/${publicacionId}/comentarios`;
  }

  // Los más recientes primero, paginados
  listar(publicacionId: string, offset: number, limit: number): Observable<ListadoComentarios> {
    const params = new HttpParams().set('offset', offset).set('limit', limit);
    return this.http.get<ListadoComentarios>(this.url(publicacionId), { params });
  }

  crear(publicacionId: string, mensaje: string): Observable<Comentario> {
    return this.http.post<Comentario>(this.url(publicacionId), { mensaje });
  }

  editar(publicacionId: string, comentarioId: string, mensaje: string): Observable<Comentario> {
    return this.http.put<Comentario>(`${this.url(publicacionId)}/${comentarioId}`, { mensaje });
  }
}
