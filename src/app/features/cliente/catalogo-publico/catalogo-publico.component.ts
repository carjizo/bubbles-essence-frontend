import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, filter, map, skip, startWith } from 'rxjs';
import { FiltrosProducto, Producto } from '../../../core/models/producto.model';
import { ProductoClienteService } from '../../../core/services/producto-cliente.service';
import { AuthService } from '../../../core/services/auth.service';

/** Filtros del panel lateral (los que sí tienen sentido para un comprador). */
interface FiltrosPublicos {
  precioMin: number | null;
  precioMax: number | null;
  soloConStock: boolean;
}

const FILTROS_VACIOS: FiltrosPublicos = { precioMin: null, precioMax: null, soloConStock: false };

@Component({
  selector: 'app-catalogo-publico',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './catalogo-publico.component.html',
  styleUrl: './catalogo-publico.component.css'
})
export class CatalogoPublicoComponent {
  private readonly productoService = inject(ProductoClienteService);
  private readonly authService = inject(AuthService);

  /** Tope que devuelve el backend (ver ProductoServiceImpl.LIMITE_FILAS). */
  readonly LIMITE_BACKEND = 50;
  /** Mínimo de caracteres para disparar la búsqueda por ingrediente. */
  readonly MIN_CARACTERES_BUSQUEDA = 3;
  readonly opcionesTamano = [6, 12, 24];

  /** Hasta 50 filas, ya filtradas y ordenadas (más nuevos primero) por la BD. */
  readonly productos = signal<Producto[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly estaClienteLogueado = signal(this.verificarClienteLogueado());

  // ---- Paginación (local, sobre las filas que ya trajo el backend) ----
  readonly paginaActual = signal(1);
  readonly tamanoPagina = signal(6);
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
  readonly filtrosAplicados = signal<FiltrosPublicos>({ ...FILTROS_VACIOS });
  /** Borrador: se edita en el panel y recién se aplica con "Aplicar filtros". */
  readonly borrador = signal<FiltrosPublicos>({ ...FILTROS_VACIOS });
  readonly errorFiltros = signal<string | null>(null);

  readonly contadorFiltros = computed(() => {
    const f = this.filtrosAplicados();
    return (f.precioMin !== null ? 1 : 0) + (f.precioMax !== null ? 1 : 0) + (f.soloConStock ? 1 : 0);
  });
  /** Hay algo acotando la lista (búsqueda o filtros): cambia el mensaje de "sin resultados". */
  readonly hayCriterios = computed(
    () => this.terminoAplicado().length > 0 || this.contadorFiltros() > 0,
  );

  /** Petición en curso: se cancela si el usuario dispara otra antes de que termine. */
  private peticionActual?: Subscription;

  constructor() {
    // Espera a que el usuario deje de teclear (350 ms) y solo consulta la BD
    // con 3+ caracteres o al vaciar la caja (vuelve a la lista completa).
    this.escritura$
      .pipe(
        debounceTime(350),
        map((valor) => valor.trim()),
        filter((valor) => valor.length === 0 || valor.length >= this.MIN_CARACTERES_BUSQUEDA),
        startWith(''), // semilla = estado inicial (sin búsqueda)...
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

  private verificarClienteLogueado(): boolean {
    return !!localStorage.getItem('be_session_cliente');
  }

  get esAdmin(): boolean {
    return this.authService.estaAutenticado();
  }

  private cargar(): void {
    this.peticionActual?.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);
    this.peticionActual = this.productoService.listar(this.construirFiltrosApi()).subscribe({
      next: (res) => {
        this.productos.set(res.data);
        this.paginaActual.update((pagina) => Math.min(pagina, this.totalPaginas()));
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('✗ Error cargando productos:', err);
        this.error.set('No se pudieron cargar los productos');
        this.cargando.set(false);
      }
    });
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

  private construirFiltrosApi(): FiltrosProducto {
    const f = this.filtrosAplicados();
    const filtros: FiltrosProducto = {};
    if (this.terminoAplicado()) filtros.ingrediente = this.terminoAplicado();
    if (f.precioMin !== null) filtros.precioMin = f.precioMin;
    if (f.precioMax !== null) filtros.precioMax = f.precioMax;
    if (f.soloConStock) filtros.soloConStock = true;
    return filtros;
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

  actualizarBorrador<K extends keyof FiltrosPublicos>(campo: K, valor: FiltrosPublicos[K]): void {
    this.borrador.update((actual) => ({ ...actual, [campo]: valor }));
  }

  aplicarFiltros(): void {
    const b = this.borrador();
    if ((b.precioMin !== null && b.precioMin < 0) || (b.precioMax !== null && b.precioMax < 0)) {
      this.errorFiltros.set('El precio no puede ser negativo.');
      return;
    }
    if (b.precioMin !== null && b.precioMax !== null && b.precioMin > b.precioMax) {
      this.errorFiltros.set('El precio mínimo no puede ser mayor que el máximo.');
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
    if (pagina >= 1 && pagina <= this.totalPaginas() && pagina !== this.paginaActual()) {
      this.paginaActual.set(pagina);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  cambiarTamano(tamano: number | string): void {
    this.tamanoPagina.set(Number(tamano));
    this.paginaActual.set(1);
  }

  formatoPrecio(precio: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(precio);
  }

  trackById(_: number, p: Producto): number {
    return p.id;
  }
}
