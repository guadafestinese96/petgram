import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api';
import { AuthResponse, LoginRequest, Usuario } from '../models/usuario';

const CLAVE_TOKEN = 'token';
const CLAVE_USUARIO = 'usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Signals con la sesión: cuando cambian, todo lo que los usa se actualiza solo
  // (navbar, directiva *appSoloAdmin, contador de sesión, etc.)
  usuarioActual = signal<Usuario | null>(this.leerUsuarioGuardado());
  token = signal<string | null>(localStorage.getItem(CLAVE_TOKEN));

  esAdmin = computed(() => this.usuarioActual()?.perfil === 'administrador');

  // true cuando el token ya se validó contra /auth/autorizar (pantalla "cargando")
  // o cuando se acaba de obtener con login / registro
  sesionValidada = false;

  constructor(private http: HttpClient) {}

  // El registro se envía como multipart/form-data (lleva la imagen de perfil)
  registro(formData: FormData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/registro`, formData);
  }

  login(datos: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, datos);
  }

  // Valida el token guardado (lo agrega el interceptor). 401 si es inválido o venció.
  autorizar(): Observable<{ usuario: Usuario }> {
    return this.http.post<{ usuario: Usuario }>(`${API_URL}/auth/autorizar`, {});
  }

  // Pide un token nuevo con otros 15 minutos de vida
  refrescar(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/refrescar`, {});
  }

  // Guarda token y datos del usuario en el navegador
  guardarSesion(respuesta: AuthResponse) {
    this.guardarToken(respuesta.token);
    this.actualizarUsuario(respuesta.usuario);
    this.sesionValidada = true;
  }

  guardarToken(token: string) {
    localStorage.setItem(CLAVE_TOKEN, token);
    this.token.set(token);
  }

  actualizarUsuario(usuario: Usuario) {
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    this.usuarioActual.set(usuario);
  }

  obtenerToken(): string | null {
    return this.token();
  }

  obtenerUsuario(): Usuario | null {
    return this.usuarioActual();
  }

  // Momento (en ms) en que vence el token, leído del campo "exp" del JWT
  vencimientoToken(token = this.token()): number | null {
    if (!token) return null;
    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const { exp } = JSON.parse(atob(payload)) as { exp?: number };
      return exp ? exp * 1000 : null;
    } catch {
      return null;
    }
  }

  cerrarSesion() {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    this.token.set(null);
    this.usuarioActual.set(null);
    this.sesionValidada = false;
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
