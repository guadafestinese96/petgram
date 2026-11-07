import { Component, OnInit, input, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { DatosGrafico, TipoGrafico } from '../../models/estadisticas';
import { Grafico } from '../../shared/grafico/grafico';
import { obtenerMensajeError } from '../../shared/http-error';

// Fecha local en formato AAAA-MM-DD (lo que usa <input type="date">)
export function fechaInput(fecha: Date): string {
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mm}-${dd}`;
}

// Tarjeta con un gráfico y su propio lapso de tiempo (desde / hasta) elegible
@Component({
  selector: 'app-panel-grafico',
  imports: [Grafico],
  templateUrl: './panel-grafico.html',
  styleUrl: './panel-grafico.css',
})
export class PanelGrafico implements OnInit {
  titulo = input.required<string>();
  descripcion = input('');
  tipo = input.required<TipoGrafico>();
  nombreSerie = input('Cantidad');
  textoTotal = input('en total');
  // Función que trae los datos del back para el lapso elegido
  cargarDatos = input.required<(desde: string, hasta: string) => Observable<DatosGrafico>>();

  hoy = fechaInput(new Date());
  desde = signal(fechaInput(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)));
  hasta = signal(this.hoy);

  datos = signal<DatosGrafico | null>(null);
  cargando = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.actualizar();
  }

  // Atajos: últimos 7 / 30 / 90 días
  usarUltimosDias(dias: number) {
    this.hasta.set(this.hoy);
    this.desde.set(fechaInput(new Date(Date.now() - (dias - 1) * 24 * 60 * 60 * 1000)));
    this.actualizar();
  }

  actualizar() {
    if (!this.desde() || !this.hasta()) {
      this.error.set('Elegí las dos fechas del lapso.');
      return;
    }
    if (this.desde() > this.hasta()) {
      this.error.set('La fecha "desde" no puede ser posterior a la fecha "hasta".');
      return;
    }

    this.error.set(null);
    this.cargando.set(true);
    this.cargarDatos()(this.desde(), this.hasta()).subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(obtenerMensajeError(err));
      },
    });
  }
}
