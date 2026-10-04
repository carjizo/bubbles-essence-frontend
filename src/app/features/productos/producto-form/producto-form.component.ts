import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductoService } from '../../../core/services/producto.service';
import { Producto } from '../../../core/models/producto.model';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './producto-form.component.html',
  styleUrl: './producto-form.component.css',
})
export class ProductoFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly productoService = inject(ProductoService);

  /** null = modo "crear"; con valor = modo "editar" */
  @Input() producto: Producto | null = null;

  @Output() guardado = new EventEmitter<Producto>();
  @Output() cancelado = new EventEmitter<void>();

  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.maxLength(50)]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: ['', [Validators.maxLength(200)]],
    imagenUrl: [''],
    precio: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    activo: [true],
  });

  ngOnChanges(): void {
    this.error.set(null);
    this.form.reset({
      codigo: this.producto?.codigo ?? '',
      nombre: this.producto?.nombre ?? '',
      descripcion: this.producto?.descripcion ?? '',
      imagenUrl: this.producto?.imagenUrl ?? '',
      precio: this.producto?.precio ?? 0,
      stock: this.producto?.stock ?? 0,
      activo: this.producto?.activo ?? true,
    });
  }

  get esEdicion(): boolean {
    return this.producto !== null;
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    const valores = this.form.getRawValue();

    const peticion = this.esEdicion
      ? this.productoService.actualizar(this.producto!.id, valores)
      : this.productoService.crear(valores);

    peticion.subscribe({
      next: (respuesta) => {
        this.guardando.set(false);
        this.guardado.emit(respuesta.data);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo guardar el producto.');
      },
    });
  }
}
