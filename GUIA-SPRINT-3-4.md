# Petgram – Sprints 3 y 4

## 1. Instalar dependencias nuevas (una sola vez)

```bash
cd front
npm install        # agrega chart.js (gráficos) y @angular/service-worker (PWA)
```

El back no tiene dependencias nuevas.

## 2. Levantar

```bash
cd back  && npm run start:dev     # http://localhost:3000
cd front && npm start             # http://localhost:4200
```

**Administrador inicial:** al arrancar el back, si no existe ningún admin en la base,
se crea uno con los datos del `.env`:

- usuario: `admin` (o `admin@petgram.com`)
- contraseña: `Admin1234`

Cambialos en `back/.env` (`ADMIN_USUARIO`, `ADMIN_CORREO`, `ADMIN_PASSWORD`) antes del primer arranque si querés otros.

## 3. Rutas nuevas del back

| Método | Ruta | Qué hace | Status |
|---|---|---|---|
| POST | `/auth/autorizar` | Valida el token (header `Authorization: Bearer`) y devuelve el usuario | 200 / 401 |
| POST | `/auth/refrescar` | Token nuevo con la misma payload, vence en 15 min | 200 / 401 |
| GET | `/publicaciones/:id` | Detalle de una publicación | 200 / 404 |
| GET | `/publicaciones/:id/comentarios?offset&limit` | Comentarios, los más recientes primero | 200 / 404 |
| POST | `/publicaciones/:id/comentarios` | Nuevo comentario `{ mensaje }` | 201 / 400 / 404 |
| PUT | `/publicaciones/:id/comentarios/:comentarioId` | Edita (solo el autor), marca `modificado: true` | 200 / 403 / 404 |
| GET | `/usuarios` | Listado (admin) | 200 / 403 |
| POST | `/usuarios` | Alta con perfil `usuario` o `administrador` (admin, multipart) | 201 / 400 / 409 |
| DELETE | `/usuarios/:id` | Baja lógica: deshabilita (admin) | 200 / 400 / 404 / 409 |
| POST | `/usuarios/:id/habilitar` | Alta lógica: rehabilita (admin) | 200 / 404 / 409 |
| PATCH | `/usuarios/mi-perfil` | Editar mi perfil (nombre, apellido, descripción, foto) | 200 / 400 |
| GET | `/estadisticas/publicaciones-por-usuario?desde&hasta` | Gráfico de barras (admin) | 200 / 400 / 403 |
| GET | `/estadisticas/comentarios?desde&hasta` | Gráfico de líneas, por día (admin) | 200 / 400 / 403 |
| GET | `/estadisticas/comentarios-por-publicacion?desde&hasta` | Gráfico de torta (admin) | 200 / 400 / 403 |

`desde` / `hasta` con formato `AAAA-MM-DD`, ambos inclusive (por defecto, los últimos 30 días).
Al dar de baja una publicación también se dan de baja sus comentarios.

## 4. Dónde está cada requisito del front

**Sprint 3**
- Página publicación: `publicacion-detalle/` (ruta `/publicacion/:id`) + `comentarios/` (cargar más, editar, "(editado)")
- Token guardado en `localStorage`: `services/auth.service.ts`
- Pantalla cargando + validación contra `/auth/autorizar`: `cargando/` + `guards/auth.guards.ts`
- Contador de 10 min + modal para extender la sesión: `services/sesion.service.ts` (modal en `app.html`)
- 401 → login: `interceptors/auth.interceptor.ts`

**Sprint 4**
- Admin puede dar de baja cualquier publicación (listado, detalle y perfil): `publicacion-card/`
- Dashboard usuarios (listado, alta con radio buttons, habilitar/deshabilitar): `dashboard/usuarios/`
- Dashboard estadísticas (barras, líneas, torta, lapso elegible por gráfico): `dashboard/estadisticas/` + `shared/grafico/`
- PWA: `ngsw-config.json`, `public/manifest.webmanifest`, `public/icons/`, `provideServiceWorker` en `app.config.ts`
  (el service worker solo se activa con `ng build`, no con `ng serve`; para probarlo: `npx http-server dist/front/browser`)
- Pipes propias (`shared/pipes/`): `tiempoRelativo`, `edad`, `urlImagen` (+ `plural` de yapa)
- Directivas propias (`shared/directivas/`): `*appSoloAdmin` (estructural), `appAutofocus`, `appImagenRespaldo`
