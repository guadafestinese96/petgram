import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api';
import { AuthResponse, LoginRequest, Usuario } from '../models/usuario';

const CLAVE_TOKEN = 'token';
const CLAVE_USUARIO = 'usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Signal con el usuario logueado: cuando cambia la sesión, el navbar se actualiza solo
  usuarioActual = signal<Usuario | null>(this.leerUsuarioGuardado());

  constructor(private http: HttpClient) {}

  // El registro se envía como multipart/form-data (lleva la imagen de perfil)
  registro(formData: FormData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/registro`, formData);
  }

  login(datos: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, datos);
  }

  // Guarda token y datos del usuario en el navegador
  guardarSesion(respuesta: AuthResponse) {
    localStorage.setItem(CLAVE_TOKEN, respuesta.token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(respuesta.usuario));
    this.usuarioActual.set(respuesta.usuario);
  }

  obtenerToken(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  obtenerUsuario(): Usuario | null {
    return this.usuarioActual();
  }

  cerrarSesion() {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    this.usuarioActual.set(null);
  }

  private leerUsuarioGuardado(): Usuario | null {
    const guardado = localStorage.getItem(CLAVE_USUARIO);
    if (!guardado) return null;
    try {
      return JSON.parse(guardado) as Usuario;
    } catch {
      return null;
    }
  }
}
