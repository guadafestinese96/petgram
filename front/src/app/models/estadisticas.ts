// Respuestas de GET /estadisticas/...
interface RespuestaEstadistica<T> {
  desde: string; // AAAA-MM-DD
  hasta: string;
  total: number;
  datos: T[];
}

export type PublicacionesPorUsuario = RespuestaEstadistica<{
  usuarioId: string;
  nombreUsuario: string;
  cantidad: number;
}>;

export type ComentariosPorDia = RespuestaEstadistica<{
  fecha: string; // AAAA-MM-DD
  cantidad: number;
}>;

export type ComentariosPorPublicacion = RespuestaEstadistica<{
  publicacionId: string;
  titulo: string;
  nombreUsuario?: string;
  cantidad: number;
}>;

// Lo que necesita un gráfico para dibujarse
export interface DatosGrafico {
  etiquetas: string[];
  valores: number[];
  total: number;
}

export type TipoGrafico = 'bar' | 'line' | 'pie' | 'doughnut';
