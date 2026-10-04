import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed, effect } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CarritoService } from '../../../core/services/carrito.service';
import { AuthService } from '../../../core/services/auth.service';

interface SesionClienteGuardada {
  token: string;
  usuario: any;
}

@Component({
  selector: 'app-cliente-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './cliente-navbar.component.html',
  styleUrl: './cliente-navbar.component.css'
})
export class ClienteNavbarComponent {
  private readonly carritoService = inject(CarritoService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  
  readonly menuAbierto = signal(false);
  
  // Signal reactiva que se recalcula cuando localStorage cambia
  private readonly storageUpdate = signal(0);
  
  readonly estaClienteLogueado = computed(() => {
    // Usa storageUpdate para crear dependencia reactiva
    this.storageUpdate();
    const sesion = localStorage.getItem('be_session_cliente');
    return !!sesion;
  });
  
  readonly nombreCliente = computed(() => {
    // Usa storageUpdate para crear dependencia reactiva
    this.storageUpdate();
    const sesion = localStorage.getItem('be_session_cliente');
    if (sesion) {
      try {
        const parsed: SesionClienteGuardada = JSON.parse(sesion);
        return parsed.usuario?.nombreCompleto || 'Cliente';
      } catch {
        return 'Cliente';
      }
    }
    return '';
  });

  constructor() {
    // Escucha cambios en localStorage
    effect(() => {
      const handleStorageChange = () => {
        this.storageUpdate.update(v => v + 1);
      };
      
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    });
  }

  get carrito() {
    return this.carritoService.carrito();
  }

  get estaAutenticado() {
    return this.authService.estaAutenticado();
  }

  toggleMenu(): void {
    this.menuAbierto.set(!this.menuAbierto());
  }

  closeMenu(): void {
    this.menuAbierto.set(false);
  }

  logoutCliente(): void {
    if (confirm('¿Deseas cerrar sesión?')) {
      localStorage.removeItem('be_session_cliente');
      this.storageUpdate.update(v => v + 1); // Trigger reactivity
      this.menuAbierto.set(false);
      this.router.navigate(['/cliente']);
    }
  }
}
