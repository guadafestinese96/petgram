import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChartPie, faUsers } from '@fortawesome/free-solid-svg-icons';

// Contenedor del dashboard (solo administradores): pestañas Usuarios / Estadísticas
@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FontAwesomeModule],
  template: `
    <section class="dashboard">
      <header class="dashboard-header">
        <h2 class="dashboard-titulo">Panel de administración</h2>
        <nav class="tabs" aria-label="Secciones del dashboard">
          <a class="tab" routerLink="usuarios" routerLinkActive="activa">
            <fa-icon [icon]="faUsers"></fa-icon> Usuarios
          </a>
          <a class="tab" routerLink="estadisticas" routerLinkActive="activa">
            <fa-icon [icon]="faChartPie"></fa-icon> Estadísticas
          </a>
        </nav>
      </header>
      <router-outlet />
    </section>
  `,
  styles: `
    .dashboard {
      display: flex;
      flex-direction: column;
      gap: 20px;
      width: 100%;
      max-width: 1100px;
      margin: 0 auto;
      padding: 20px 15px 40px;
      box-sizing: border-box;
    }
    .dashboard-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      background-color: var(--azul-oscuro);
      color: var(--azul-claro);
      padding: 14px 18px;
      border-radius: 14px;
      box-shadow: 0 4px 14px rgba(5, 10, 48, 0.3);
    }
    .dashboard-titulo { font-size: 1.25rem; }
    .tabs { display: flex; gap: 8px; }
    .tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 20px;
      color: var(--azul-claro);
      text-decoration: none;
      border: 1px solid rgba(250, 246, 252, 0.3);
      transition: background-color 0.2s;
    }
    .tab:hover { background-color: rgba(250, 246, 252, 0.1); }
    .tab.activa { background-color: var(--azul-medio); border-color: var(--azul-medio); }
  `,
})
export class Dashboard {
  faUsers = faUsers;
  faChartPie = faChartPie;
}
