import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccionResponse, AccionService, AccionRequest } from '../../../../core/services/accion.service';
import { ModuloResponse, ModuloService } from '../../../../core/services/modulo.service';

@Component({
  selector: 'app-accion-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './accion-form.component.html',
  styleUrl: './accion-form.component.css'
})
export class AccionFormComponent implements OnInit {
  @Input() accion?: AccionResponse;
  @Output() guardado = new EventEmitter<AccionResponse>();
  @Output() cancelado = new EventEmitter<void>();

  private readonly accionService = inject(AccionService);
  private readonly moduloService = inject(ModuloService);

  readonly modulos = signal<ModuloResponse[]>([]);
  readonly enviando = signal(false);
  readonly error = signal('');

  form = {
    codigo: '',
    nombre: '',
    descripcion: '',
    moduloId: 0
  };

  ngOnInit(): void {
    this.cargarModulos();
    if (this.accion) {
      this.form = {
        codigo: this.accion.codigo,
        nombre: this.accion.nombre,
        descripcion: this.accion.descripcion || '',
        moduloId: this.accion.moduloId
      };
    }
  }

  private cargarModulos(): void {
    this.moduloService.listar().subscribe({
      next: (res) => {
        this.modulos.set(res.data);
      }
    });
  }

  guardar(): void {
    if (!this.form.codigo || !this.form.nombre || !this.form.moduloId) {
      return;
    }

    this.enviando.set(true);
    const req: AccionRequest = this.form as AccionRequest;
    const operacion = this.accion
      ? this.accionService.actualizar(this.accion.id, req)
      : this.accionService.crear(req);

    operacion.subscribe({
      next: (res) => {
        this.enviando.set(false);
        this.guardado.emit(res.data);
      },
      error: () => {
        this.error.set('Error guardando acción');
        this.enviando.set(false);
      }
    });
  }
}
