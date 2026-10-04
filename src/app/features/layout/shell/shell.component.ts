import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AccesoService } from '../../../core/services/acceso.service';
import { AuthService } from '../../../core/services/auth.service';

interface ItemMenu {
  codigo: string;
  nombre: string;
  ruta: string | null; // null = módulo sin pantalla propia todavía
}

/** Qué ruta del Angular le corresponde a cada módulo del backend. Un módulo
 *  que el usuario tiene pero que no está en este mapa se muestra en el menú
 *  como "próximamente" en vez de desaparecer, para que se note que el
 *  backend ya lo tiene listo y solo falta construir esa pantalla. */
const RUTA_POR_MODULO: Record<string, string> = {
  USUARIOS: '/admin/usuarios-permisos',
  CATALOGO: '/admin/catalogo',
  PEDIDOS: '/admin/seguimiento-pedidos',
};

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  private readonly authService = inject(AuthService);
  private readonly accesoService = inject(AccesoService);

  readonly usuario = this.authService.usuarioActual;
  readonly puedeAccederAdmin = computed(() => {
    const u = this.usuario();
    // Admin solo si tiene rol ADMIN o tiene la acción admin-panel
    return u?.rol === 'ADMIN' || this.accesoService.tieneAccion('admin-panel');
  });

  readonly itemsMenu = computed<ItemMenu[]>(() => {
    const modulos = this.accesoService.accesos()?.modulos ?? [];
    return modulos.map((m) => ({
      codigo: m.codigo,
      nombre: m.nombre,
      ruta: RUTA_POR_MODULO[m.codigo] ?? null,
    }));
  });

  cerrarSesion(): void {
    this.authService.logout();
  }
}

