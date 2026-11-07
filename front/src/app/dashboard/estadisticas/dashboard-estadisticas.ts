import { Component, inject } from '@angular/core';
import { map } from 'rxjs';
import { DatosGrafico } from '../../models/estadisticas';
import { EstadisticasService } from '../../services/estadisticas.service';
import { PanelGrafico } from './panel-grafico';

// En la torta se muestran las publicaciones con más comentarios y el resto se agrupa
const MAX_PORCIONES = 7;

const recortar = (texto: string, largo = 28) =>
  texto.length > largo ? `${texto.slice(0, largo - 1)}…` : texto;

// Dashboard / estadísticas: 3 gráficos de distinto tipo (barras, líneas y torta),
// cada uno con su propio lapso de tiempo.
@Component({
  selector: 'app-dashboard-estadisticas',
  imports: [PanelGrafico],
  template: `
    <div class="grilla">
      <app-panel-grafico
        class="ancho-completo"
        titulo="Publicaciones por usuario"
        descripcion="Cantidad de publicaciones que realizó cada usuario en el lapso elegido."
        [tipo]="'bar'"
        nombreSerie="Publicaciones"
        textoTotal="publicaciones"
        [cargarDatos]="publicacionesPorUsuario"
      ></app-panel-grafico>

      <app-panel-grafico
        titulo="Comentarios realizados"
        descripcion="Comentarios hechos día por día en el lapso elegido."
        [tipo]="'line'"
        nombreSerie="Comentarios"
        textoTotal="comentarios"
        [cargarDatos]="comentariosPorDia"
      ></app-panel-grafico>

      <app-panel-grafico
        titulo="Comentarios por publicación"
        descripcion="Cuántos comentarios recibió cada publicación en el lapso elegido."
        [tipo]="'doughnut'"
        nombreSerie="Comentarios"
        textoTotal="comentarios"
        [cargarDatos]="comentariosPorPublicacion"
      ></app-panel-grafico>
    </div>
  `,
  styles: `
    .grilla {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }
    .ancho-completo { grid-column: span 2; }
    @media (max-width: 860px) {
      .grilla { grid-template-columns: minmax(0, 1fr); }
      .ancho-completo { grid-column: span 1; }
    }
  `,
})
export class DashboardEstadisticas {
  private estadisticasService = inject(EstadisticasService);

  // Cada función adapta la respuesta del back al formato del gráfico
  publicacionesPorUsuario = (desde: string, hasta: string) =>
    this.estadisticasService.publicacionesPorUsuario(desde, hasta).pipe(
      map(
        (r): DatosGrafico => ({
          etiquetas: r.datos.map((d) => `@${d.nombreUsuario}`),
          valores: r.datos.map((d) => d.cantidad),
          total: r.total,
        }),
      ),
    );

  comentariosPorDia = (desde: string, hasta: string) =>
    this.estadisticasService.comentariosPorDia(desde, hasta).pipe(
      map(
        (r): DatosGrafico => ({
          // '2026-10-29' => '29/10'
          etiquetas: r.datos.map((d) => `${d.fecha.slice(8, 10)}/${d.fecha.slice(5, 7)}`),
          valores: r.datos.map((d) => d.cantidad),
          total: r.total,
        }),
      ),
    );

  comentariosPorPublicacion = (desde: string, hasta: string) =>
    this.estadisticasService.comentariosPorPublicacion(desde, hasta).pipe(
      map((r): DatosGrafico => {
        const principales = r.datos.slice(0, MAX_PORCIONES);
        const resto = r.datos.slice(MAX_PORCIONES);
        const etiquetas = principales.map((d) =>
          recortar(d.nombreUsuario ? `${d.titulo} (@${d.nombreUsuario})` : d.titulo),
        );
        const valores = principales.map((d) => d.cantidad);
        if (resto.length > 0) {
          etiquetas.push(`Otras ${resto.length} publicaciones`);
          valores.push(resto.reduce((suma, d) => suma + d.cantidad, 0));
        }
        return { etiquetas, valores, total: r.total };
      }),
    );
}
