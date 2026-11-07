import {
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { TipoGrafico } from '../../models/estadisticas';

Chart.register(...registerables);

// Colores de la marca + complementarios para las porciones de la torta
const PALETA = ['#233dff', '#ff4d6d', '#2ea44f', '#f5a524', '#8e44ad', '#16a2b8', '#050a30', '#9aa5ff'];

// Envoltorio de Chart.js: recibe tipo, etiquetas y valores y dibuja el gráfico.
// Cuando cambian los datos se vuelve a dibujar solo.
@Component({
  selector: 'app-grafico',
  template: `<div class="contenedor"><canvas #lienzo [attr.aria-label]="titulo()" role="img"></canvas></div>`,
  styles: `
    :host { display: block; }
    .contenedor { position: relative; height: 320px; width: 100%; }
  `,
})
export class Grafico {
  tipo = input.required<TipoGrafico>();
  etiquetas = input.required<string[]>();
  valores = input.required<number[]>();
  titulo = input('');
  nombreSerie = input('Cantidad');

  private lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');
  private grafico?: Chart;

  constructor() {
    afterRenderEffect(() => {
      this.dibujar(this.tipo(), this.etiquetas(), this.valores());
    });
    inject(DestroyRef).onDestroy(() => this.grafico?.destroy());
  }

  private dibujar(tipo: TipoGrafico, etiquetas: string[], valores: number[]) {
    this.grafico?.destroy();

    const esCircular = tipo === 'pie' || tipo === 'doughnut';
    const colores = esCircular ? etiquetas.map((_, i) => PALETA[i % PALETA.length]) : PALETA[0];

    const config = {
      type: tipo,
      data: {
        labels: etiquetas,
        datasets: [
          {
            label: this.nombreSerie(),
            data: valores,
            backgroundColor: tipo === 'line' ? 'rgba(35, 61, 255, 0.15)' : colores,
            borderColor: esCircular ? '#ffffff' : PALETA[0],
            borderWidth: esCircular ? 2 : tipo === 'line' ? 3 : 0,
            borderRadius: tipo === 'bar' ? 8 : 0,
            fill: tipo === 'line',
            tension: 0.35,
            pointRadius: tipo === 'line' ? 3 : 0,
            pointBackgroundColor: PALETA[0],
            maxBarThickness: 48,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: esCircular, position: 'bottom' },
          tooltip: { backgroundColor: '#050a30', padding: 10, cornerRadius: 8 },
        },
        scales: esCircular
          ? {}
          : {
              x: { grid: { display: false }, ticks: { color: '#050a30' } },
              y: { beginAtZero: true, ticks: { precision: 0, color: '#050a30' } },
            },
      },
    };

    this.grafico = new Chart(this.lienzo().nativeElement, config as unknown as ChartConfiguration);
  }
}
