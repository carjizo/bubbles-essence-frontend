import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccionResponse, AccionService } from '../../../core/services/accion.service';
import { AccionFormComponent } from './accion-form/accion-form.component';

type VistaFormulario = { modo: 'crear' } | { modo: 'editar'; accion: AccionResponse } | null;

@Component({
  selector: 'app-acciones',
  standalone: true,
  imports: [CommonModule, FormsModule, AccionFormComponent],
  templateUrl: './acciones.component.html',
  styleUrl: './acciones.component.css'
})
export class AccionesComponent {
  private readonly accionService = inject(AccionService);

  readonly acciones = signal<AccionResponse[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly vistaFormulario = signal<VistaFormulario>(null);

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.accionService.listar().subscribe({
      next: (res) => {
        console.log('✓ Acciones cargadas:', res.data.length, res.data);
        this.acciones.set(res.data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('✗ Error cargando acciones:', err);
        this.error.set('No se pudo cargar acciones');
        this.cargando.set(false);
      }
    });
  }

  abrirCrear(): void {
    this.vistaFormulario.set({ modo: 'crear' });
  }

  abrirEditar(accion: AccionResponse): void {
    this.vistaFormulario.set({ modo: 'editar', accion });
  }

  cerrarFormulario(): void {
    this.vistaFormulario.set(null);
  }

  alGuardarAccion(): void {
    this.cerrarFormulario();
    this.cargar();
  }

  toggleEstado(accion: AccionResponse): void {
    const operacion = accion.activo
      ? this.accionService.desactivar(accion.id)
      : this.accionService.activar(accion.id);

    operacion.subscribe({
      next: () => this.cargar(),
      error: () => this.error.set('Error cambiando estado')
    });
  }

  trackById(_: number, accion: AccionResponse): number {
    return accion.id;
  }
}
