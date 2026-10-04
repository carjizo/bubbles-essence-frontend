import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HasAccionDirective } from '../../../core/directives/has-accion.directive';
import { Producto } from '../../../core/models/producto.model';
import { ProductoService } from '../../../core/services/producto.service';
import { ProductoFormComponent } from '../producto-form/producto-form.component';

type VistaFormulario = { modo: 'crear' } | { modo: 'editar'; producto: Producto } | null;

@Component({
  selector: 'app-productos-list',
  standalone: true,
  imports: [CommonModule, HasAccionDirective, ProductoFormComponent, FormsModule],
  templateUrl: './productos-list.component.html',
  styleUrl: './productos-list.component.css',
})
export class ProductosListComponent {
  private readonly productoService = inject(ProductoService);

  readonly productos = signal<Producto[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly vistaFormulario = signal<VistaFormulario>(null);
  
  // Modal para editar imagen
  readonly productoEditandoImagen = signal<Producto | null>(null);
  readonly nuevaImagenUrl = signal('');
  readonly actualizandoImagen = signal(false);
  readonly errorImagen = signal<string | null>(null);

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.productoService.listar().subscribe({
      next: (respuesta) => {
        this.productos.set(respuesta.data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el catálogo. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }

  abrirCrear(): void {
    this.vistaFormulario.set({ modo: 'crear' });
  }

  abrirEditar(producto: Producto): void {
    this.vistaFormulario.set({ modo: 'editar', producto });
  }

  cerrarFormulario(): void {
    this.vistaFormulario.set(null);
  }

  alGuardar(): void {
    this.vistaFormulario.set(null);
    this.cargar();
  }

  abrirEditarImagen(producto: Producto): void {
    this.productoEditandoImagen.set(producto);
    this.nuevaImagenUrl.set(producto.imagenUrl || '');
    this.errorImagen.set(null);
  }

  cerrarEditarImagen(): void {
    this.productoEditandoImagen.set(null);
    this.nuevaImagenUrl.set('');
    this.errorImagen.set(null);
  }

  guardarImagen(): void {
    const producto = this.productoEditandoImagen();
    if (!producto || !this.nuevaImagenUrl().trim()) {
      this.errorImagen.set('La URL de la imagen no puede estar vacía');
      return;
    }

    this.actualizandoImagen.set(true);
    this.errorImagen.set(null);

    const productoActualizado = {
      ...producto,
      imagenUrl: this.nuevaImagenUrl().trim()
    };

    this.productoService.actualizar(producto.id, productoActualizado).subscribe({
      next: () => {
        this.productos.update(prods =>
          prods.map(p => p.id === producto.id ? productoActualizado : p)
        );
        this.actualizandoImagen.set(false);
        this.cerrarEditarImagen();
      },
      error: (err) => {
        this.actualizandoImagen.set(false);
        this.errorImagen.set(err?.error?.message ?? 'No se pudo actualizar la imagen');
      }
    });
  }

  desactivar(producto: Producto): void {
    const confirmado = confirm(`¿Desactivar "${producto.nombre}"? Dejará de verse en el catálogo.`);
    if (!confirmado) return;

    this.productoService.desactivar(producto.id).subscribe({
      next: () => this.cargar(),
      error: () => this.error.set('No se pudo desactivar el producto.'),
    });
  }

  /** Para que @for no re-renderice toda la lista en cada cambio. */
  trackById(_index: number, producto: Producto): number {
    return producto.id;
  }
}
