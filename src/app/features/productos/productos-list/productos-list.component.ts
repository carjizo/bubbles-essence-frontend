import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged, filter, map, skip, startWith } from 'rxjs';
import { HasAccionDirective } from '../../../core/directives/has-accion.directive';
import { FiltrosProducto, Producto } from '../../../core/models/producto.model';
import { ProductoService } from '../../../core/services/producto.service';
import { ProductoFormComponent } from '../producto-form/producto-form.component';

type VistaFormulario = { modo: 'crear' } | { modo: 'editar'; producto: Producto } | null;

/** Lo que el usuario edita dentro del panel de filtros (y lo que queda aplicado). */
interface FiltrosPanel {
  activo: boolean;
  inactivo: boolean;
  fechaDesde: string;
  fechaHasta: string;
  codigo: string;
  nombre: string;
}

const FILTROS_VACIOS: FiltrosPanel = {
  activo: false,
  inactivo: false,
  fechaDesde: '',
  fechaHasta: '',
  codigo: '',
  nombre: '',
};

@Component({
  selector: 'app-productos-list',
  standalone: true,
  imports: [CommonModule, HasAccionDirective, ProductoFormComponent, FormsModule],
  templateUrl: './productos-list.component.html',
  styleUrl: './productos-list.component.css',
})
export class ProductosListComponent {
  private readonly productoService = inject(ProductoService);

  /** Tope que devuelve el backend (ver ProductoServiceImpl.LIMITE_FILAS). */
  readonly LIMITE_BACKEND = 50;
  /** Mínimo de caracteres para disparar la búsqueda por ingrediente. */
  readonly MIN_CARACTERES_BUSQUEDA = 3;
  readonly opcionesTamano = [10, 20, 50];

  /** Hasta 50 filas, ya filtradas y ordenadas por la BD. */
  readonly productos = signal<Producto[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly vistaFormulario = signal<VistaFormulario>(null);

  // ---- Paginación (local, sobre las filas que ya trajo el backend) ----
  readonly paginaActual = signal(1);
  readonly tamanoPagina = signal(10);
  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.productos().length / this.tamanoPagina())),
  );
  readonly paginas = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));
  readonly productosPagina = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.tamanoPagina();
    return this.productos().slice(inicio, inicio + this.tamanoPagina());
  });
  readonly rangoMostrado = computed(() => {
    const total = this.productos().length;
    if (total === 0) {
      return '0';
    }
    const inicio = (this.paginaActual() - 1) * this.tamanoPagina() + 1;
    const fin = Math.min(this.paginaActual() * this.tamanoPagina(), total);
    return `${inicio}–${fin} de ${total}`;
  });
  readonly alcanzoLimite = computed(() => this.productos().length >= this.LIMITE_BACKEND);

  // ---- Búsqueda predictiva por ingrediente ----
  /** Lo que se ve escrito en la caja. */
  readonly terminoInput = signal('');
  /** Lo que realmente se mandó al backend (3+ caracteres, o vacío). */
  private readonly terminoAplicado = signal('');
  private readonly escritura$ = new Subject<string>();
  readonly avisoMinimo = computed(() => {
    const largo = this.terminoInput().trim().length;
    return largo > 0 && largo < this.MIN_CARACTERES_BUSQUEDA;
  });

  // ---- Filtros (panel lateral) ----
  readonly panelFiltrosAbierto = signal(false);
  readonly filtrosAplicados = signal<FiltrosPanel>({ ...FILTROS_VACIOS });
  /** Borrador: se edita en el panel y recién se aplica con "Aplicar filtros". */
  readonly borrador = signal<FiltrosPanel>({ ...FILTROS_VACIOS });
  readonly errorFiltros = signal<string | null>(null);

  readonly contadorFiltros = computed(() => {
    const f = this.filtrosAplicados();
    let total = 0;
    if (f.activo !== f.inactivo) total++; // los dos marcados = sin filtro de estado
    if (f.fechaDesde) total++;
    if (f.fechaHasta) total++;
    if (f.codigo.trim()) total++;
    if (f.nombre.trim()) total++;
    return total;
  });
  readonly hayCriteriosActivos = computed(
    () => this.contadorFiltros() > 0 || this.terminoAplicado().length > 0,
  );

  // ---- Modal para editar imagen ----
  readonly productoEditandoImagen = signal<Producto | null>(null);
  readonly nuevaImagenUrl = signal('');
  readonly actualizandoImagen = signal(false);
  readonly errorImagen = signal<string | null>(null);

  /** Petición en curso: se cancela si el usuario dispara otra antes de que termine. */
  private peticionActual?: Subscription;

  constructor() {
    // Búsqueda predictiva: espera a que el usuario deje de teclear (350 ms),
    // y solo consulta la BD con 3+ caracteres o al vaciar la caja (lista completa).
    this.escritura$
      .pipe(
        debounceTime(350),
        map((valor) => valor.trim()),
        filter((valor) => valor.length === 0 || valor.length >= this.MIN_CARACTERES_BUSQUEDA),
        startWith(''), // semilla = estado inicial (lista sin búsqueda)...
        distinctUntilChanged(),
        skip(1), // ...que no debe disparar una consulta extra
        takeUntilDestroyed(),
      )
      .subscribe((termino) => {
        this.terminoAplicado.set(termino);
        this.paginaActual.set(1);
        this.cargar();
      });

    this.cargar();
  }

  cargar(): void {
    this.peticionActual?.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);
    this.peticionActual = this.productoService.listar(this.construirFiltrosApi()).subscribe({
      next: (respuesta) => {
        this.productos.set(respuesta.data);
        // Si tras recargar hay menos páginas que antes, no quedar parado en una inexistente.
        this.paginaActual.update((pagina) => Math.min(pagina, this.totalPaginas()));
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el catálogo. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }

  private construirFiltrosApi(): FiltrosProducto {
    const f = this.filtrosAplicados();
    const filtros: FiltrosProducto = {};
    if (f.activo !== f.inactivo) filtros.activo = f.activo; // solo uno marcado
    if (f.fechaDesde) filtros.fechaDesde = f.fechaDesde;
    if (f.fechaHasta) filtros.fechaHasta = f.fechaHasta;
    if (f.codigo.trim()) filtros.codigo = f.codigo.trim();
    if (f.nombre.trim()) filtros.nombre = f.nombre.trim();
    if (this.terminoAplicado()) filtros.ingrediente = this.terminoAplicado();
    return filtros;
  }

  // ---------- Búsqueda ----------
  alEscribirBusqueda(valor: string): void {
    this.terminoInput.set(valor);
    this.escritura$.next(valor);
  }

  limpiarBusqueda(): void {
    // Pasa por el mismo flujo (no se salta el debounce) para que
    // distinctUntilChanged siga sabiendo cuál fue la última búsqueda real.
    this.alEscribirBusqueda('');
  }

  // ---------- Filtros ----------
  abrirFiltros(): void {
    this.borrador.set({ ...this.filtrosAplicados() });
    this.errorFiltros.set(null);
    this.panelFiltrosAbierto.set(true);
  }

  @HostListener('document:keydown.escape')
  cerrarFiltros(): void {
    this.panelFiltrosAbierto.set(false);
  }

  actualizarBorrador<K extends keyof FiltrosPanel>(campo: K, valor: FiltrosPanel[K]): void {
    this.borrador.update((actual) => ({ ...actual, [campo]: valor }));
  }

  aplicarFiltros(): void {
    const b = this.borrador();
    if (b.fechaDesde && b.fechaHasta && b.fechaDesde > b.fechaHasta) {
      this.errorFiltros.set('"Registro desde" no puede ser posterior a "Registro hasta".');
      return;
    }
    this.errorFiltros.set(null);
    this.filtrosAplicados.set({ ...b });
    this.panelFiltrosAbierto.set(false);
    this.paginaActual.set(1);
    this.cargar();
  }

  borrarFiltros(): void {
    this.borrador.set({ ...FILTROS_VACIOS });
    this.filtrosAplicados.set({ ...FILTROS_VACIOS });
    this.errorFiltros.set(null);
    this.panelFiltrosAbierto.set(false);
    this.paginaActual.set(1);
    this.cargar();
  }

  // ---------- Paginación ----------
  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
    }
  }

  cambiarTamano(tamano: number | string): void {
    this.tamanoPagina.set(Number(tamano));
    this.paginaActual.set(1);
  }

  // ---------- CRUD (sin cambios de lógica) ----------
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
      imagenUrl: this.nuevaImagenUrl().trim(),
    };

    this.productoService.actualizar(producto.id, productoActualizado).subscribe({
      next: () => {
        this.productos.update((prods) =>
          prods.map((p) => (p.id === producto.id ? productoActualizado : p)),
        );
        this.actualizandoImagen.set(false);
        this.cerrarEditarImagen();
      },
      error: (err) => {
        this.actualizandoImagen.set(false);
        this.errorImagen.set(err?.error?.message ?? 'No se pudo actualizar la imagen');
      },
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
