import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api';
import { Usuario } from '../models/usuario';

interface RespuestaEstado {
  mensaje: string;
  usuario: Usuario;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private url = `${API_URL}/usuarios`;

  constructor(private http: HttpClient) {}

  // ---------- Solo administradores ----------

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.url);
  }

  // multipart/form-data: mismos datos que el registro + perfil (+ imagen opcional)
  crear(formData: FormData): Observable<Usuario> {
    return this.http.post<Usuario>(this.url, formData);
  }

  deshabilitar(id: string): Observable<RespuestaEstado> {
    return this.http.delete<RespuestaEstado>(`${this.url}/${id}`);
  }

  habilitar(id: string): Observable<RespuestaEstado> {
    return this.http.post<RespuestaEstado>(`${this.url}/${id}/habilitar`, {});
  }

  // ---------- Cualquier usuario logueado ----------

  // multipart/form-data: nombre, apellido, descripcionBreve, imagen (opcional)
  actualizarMiPerfil(formData: FormData): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.url}/mi-perfil`, formData);
  }
}
