import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GrupoResponse, GrupoService, GrupoRequest } from '../../../core/services/grupo.service';
import { AccionResponse, AccionService } from '../../../core/services/accion.service';
import { UsuarioResponseDTO, UsuarioService } from '../../../core/services/usuario.service';
import { GrupoFormComponent } from './grupo-form/grupo-form.component';

type VistaFormulario = { modo: 'crear' } | { modo: 'editar'; grupo: GrupoResponse } | null;
type VistaDetalle = { grupo: GrupoResponse; acciones: AccionResponse[]; usuarios: UsuarioResponseDTO[] } | null;

@Component({
  selector: 'app-grupos',
  standalone: true,
  imports: [CommonModule, FormsModule, GrupoFormComponent],
  templateUrl: './grupos.component.html',
  styleUrl: './grupos.component.css'
})
export class GruposComponent {
  private readonly grupoService = inject(GrupoService);
  private readonly accionService = inject(AccionService);
  private readonly usuarioService = inject(UsuarioService);

  readonly grupos = signal<GrupoResponse[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly vistaFormulario = signal<VistaFormulario>(null);
  readonly vistaDetalle = signal<VistaDetalle>(null);

  readonly todosLosUsuarios = signal<UsuarioResponseDTO[]>([]);
  readonly todasLasAcciones = signal<AccionResponse[]>([]);

  constructor() {
    this.cargar();
    this.cargarAccionesYUsuarios();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.grupoService.listar().subscribe({
      next: (res) => {
        console.log('✓ Grupos cargados:', res.data.length, res.data);
        this.grupos.set(res.data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('✗ Error cargando grupos:', err);
        this.error.set('No se pudo cargar grupos');
        this.cargando.set(false);
      }
    });
  }

  private cargarAccionesYUsuarios(): void {
    this.accionService.listar().subscribe({
      next: (res) => {
        console.log('✓ Acciones cargadas para asignar a grupos:', res.data.length, res.data);
        this.todasLasAcciones.set(res.data);
      },
      error: (err) => console.error('✗ Error cargando acciones:', err)
    });
    this.usuarioService.listar().subscribe({
      next: (res) => {
        console.log('✓ Usuarios cargados para asignar a grupos:', res.data.length, res.data);
        this.todosLosUsuarios.set(res.data);
      },
      error: (err) => console.error('✗ Error cargando usuarios:', err)
    });
  }

  abrirCrear(): void {
    this.vistaFormulario.set({ modo: 'crear' });
  }

  abrirEditar(grupo: GrupoResponse): void {
    this.vistaFormulario.set({ modo: 'editar', grupo });
  }

  cerrarFormulario(): void {
    this.vistaFormulario.set(null);
  }

  alGuardarGrupo(formData: GrupoRequest): void {
    const vista = this.vistaFormulario() as any;
    const operacion = vista?.modo === 'crear'
      ? this.grupoService.crear(formData)
      : this.grupoService.actualizar(vista.grupo.id, formData);

    operacion.subscribe({
      next: () => {
        this.cerrarFormulario();
        this.cargar();
      },
      error: () => this.error.set('Error guardando grupo')
    });
  }

  abrirDetalle(grupo: GrupoResponse): void {
    this.grupoService.listarAcciones(grupo.id).subscribe({
      next: (resAcciones) => {
        this.grupoService.listarUsuarios(grupo.id).subscribe({
          next: (resUsuarios) => {
            this.vistaDetalle.set({
              grupo,
              acciones: resAcciones.data,
              usuarios: resUsuarios.data
            });
          },
          error: () => this.error.set('Error cargando usuarios del grupo')
        });
      },
      error: () => this.error.set('Error cargando acciones del grupo')
    });
  }

  cerrarDetalle(): void {
    this.vistaDetalle.set(null);
  }

  toggleEstado(grupo: GrupoResponse): void {
    const operacion = grupo.activo
      ? this.grupoService.desactivar(grupo.id)
      : this.grupoService.activar(grupo.id);

    operacion.subscribe({
      next: () => this.cargar(),
      error: () => this.error.set('Error cambiando estado del grupo')
    });
  }

  asignarAccion(grupoId: number, accionId: number): void {
    this.grupoService.asignarAccion(grupoId, accionId).subscribe({
      next: () => {
        const detalle = this.vistaDetalle();
        if (detalle) this.abrirDetalle(detalle.grupo);
      },
      error: () => this.error.set('Error asignando acción')
    });
  }

  quitarAccion(grupoId: number, accionId: number): void {
    this.grupoService.quitarAccion(grupoId, accionId).subscribe({
      next: () => {
        const detalle = this.vistaDetalle();
        if (detalle) this.abrirDetalle(detalle.grupo);
      },
      error: () => this.error.set('Error quitando acción')
    });
  }

  asignarUsuario(grupoId: number, usuarioId: number): void {
    this.grupoService.asignarUsuario(grupoId, usuarioId).subscribe({
      next: () => {
        const detalle = this.vistaDetalle();
        if (detalle) this.abrirDetalle(detalle.grupo);
      },
      error: () => this.error.set('Error asignando usuario')
    });
  }

  quitarUsuario(grupoId: number, usuarioId: number): void {
    this.grupoService.quitarUsuario(grupoId, usuarioId).subscribe({
      next: () => {
        const detalle = this.vistaDetalle();
        if (detalle) this.abrirDetalle(detalle.grupo);
      },
      error: () => this.error.set('Error quitando usuario')
    });
  }

  /** Verifica si una acción ya está asignada al grupo actual */
  accionYaAsignada(accionId: number): boolean {
    const detalle = this.vistaDetalle();
    if (!detalle) return false;
    return detalle.acciones.some(a => a.id === accionId);
  }

  /** Verifica si un usuario ya está asignado al grupo actual */
  usuarioYaAsignado(usuarioId: number): boolean {
    const detalle = this.vistaDetalle();
    if (!detalle) return false;
    return detalle.usuarios.some(u => u.id === usuarioId);
  }

  trackById(_: number, item: any): any {
    return item.id;
  }
}

