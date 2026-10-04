import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AccesoService } from '../../core/services/acceso.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {
  private readonly auth = inject(AuthService);
  private readonly acceso = inject(AccesoService);
  private readonly router = inject(Router);

  readonly puedeGestionar = computed(() => {
    const u = this.auth.usuarioActual();
    // Admin si tiene rol ADMIN o la acción admin-panel
    return u?.rol === 'ADMIN' || this.acceso.tieneAccion('admin-panel');
  });
}
