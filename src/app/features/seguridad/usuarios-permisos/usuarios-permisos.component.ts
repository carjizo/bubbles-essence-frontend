import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsuarioResponseDTO, UsuarioService } from '../../../core/services/usuario.service';
import { PermisoResponse, PermisoService, AsignarPermisoRequest } from '../../../core/services/permiso.service';
import { AccionResponse, AccionService } from '../../../core/services/accion.service';

@Component({
  selector: 'app-usuarios-permisos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios-permisos.component.html',
  styleUrl: './usuarios-permisos.component.css'
})
export class UsuariosPermisosComponent {
  private readonly usuarioService = inject(UsuarioService);
  private readonly permisoService = inject(PermisoService);
  private readonly accionService = inject(AccionService);

  readonly usuarios = signal<UsuarioResponseDTO[]>([]);
  readonly usuarioSeleccionado = signal<UsuarioResponseDTO | null>(null);
  readonly permisosPuntuales = signal<PermisoResponse[]>([]);
  readonly todasLasAcciones = signal<AccionResponse[]>([]);

  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly cargandoPermisos = signal(false);

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    
    this.usuarioService.listar().subscribe({
      next: (res) => {
        console.log('✓ Usuarios cargados:', res.data.length, res.data);
        this.usuarios.set(res.data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('✗ Error cargando usuarios:', err);
        this.error.set('No se pudo cargar usuarios');
        this.cargando.set(false);
      }
    });

    this.accionService.listar().subscribe({
      next: (res) => {
        console.log('✓ Acciones cargadas:', res.data.length, res.data);
        this.todasLasAcciones.set(res.data);
      },
      error: (err) => {
        console.error('✗ Error cargando acciones:', err);
      }
    });
  }

  seleccionarUsuario(usuario: UsuarioResponseDTO): void {
    this.usuarioSeleccionado.set(usuario);
    this.cargarPermisosDelUsuario(usuario.id);
  }

  private cargarPermisosDelUsuario(usuarioId: number): void {
    this.cargandoPermisos.set(true);
    this.permisoService.listarPorUsuario(usuarioId).subscribe({
      next: (res) => {
        this.permisosPuntuales.set(res.data);
        this.cargandoPermisos.set(false);
      },
      error: () => {
        this.error.set('Error cargando permisos');
        this.cargandoPermisos.set(false);
      }
    });
  }

  asignarPermiso(usuarioId: number, accionId: number, tipo: 'GRANT' | 'DENY'): void {
    const req: AsignarPermisoRequest = { accionId, tipo };
    this.permisoService.asignar(usuarioId, req).subscribe({
      next: () => this.cargarPermisosDelUsuario(usuarioId),
      error: () => this.error.set('Error asignando permiso')
    });
  }

  quitarPermiso(usuarioId: number, accionId: number): void {
    this.permisoService.quitar(usuarioId, accionId).subscribe({
      next: () => this.cargarPermisosDelUsuario(usuarioId),
      error: () => this.error.set('Error quitando permiso')
    });
  }

  /** Determina si una acción tiene permiso de tipo y retorna el permiso o null */
  obtenerPermisoDeAccion(accionId: number, tipo: 'GRANT' | 'DENY'): PermisoResponse | null {
    return this.permisosPuntuales().find(p => p.accionId === accionId && p.tipo === tipo) || null;
  }

  /** Determina el estado actual de un permiso para una acción */
  obtenerEstadoPermiso(accionId: number): 'grant' | 'deny' | 'none' {
    const grant = this.obtenerPermisoDeAccion(accionId, 'GRANT');
    if (grant) return 'grant';
    const deny = this.obtenerPermisoDeAccion(accionId, 'DENY');
    if (deny) return 'deny';
    return 'none';
  }

  trackById(_: number, item: any): any {
    return item.id;
  }
}
