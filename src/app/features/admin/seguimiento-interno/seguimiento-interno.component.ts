import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PedidoClienteService } from '../../../core/services/pedido-cliente.service';

interface PedidoInterno {
  id: number;
  codigoPedido: string;
  invitadoNombre: string;
  invitadoTelefono: string;
  tipoEntrega: string;
  direccionEntrega?: string;
  estadoPedido: string;
  montoTotal: number;
  fechaPedido: string;
  fechaActualizacion?: string;
  detalles?: Array<{
    id: number;
    productoId: number;
    productoNombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
}

type EstadoFiltro = 'TODOS' | 'PENDING_PAYMENT' | 'PAID' | 'PREPARING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
type EstadoSiguiente = 'PREPARING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED';

@Component({
  selector: 'app-seguimiento-interno',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seguimiento-interno.component.html',
  styleUrl: './seguimiento-interno.component.css'
})
export class SeguimientoInternoComponent implements OnInit {
  private readonly pedidoService = inject(PedidoClienteService);

  // ========== BÚSQUEDA ==========
  readonly busqueda = signal('');
  readonly tipoBusqueda = signal<'codigo' | 'telefono'>('codigo');
  readonly pedidos = signal<PedidoInterno[]>([]);
  readonly buscando = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedPedido = signal<PedidoInterno | null>(null);

  // ========== LISTADO Y FILTROS ==========
  readonly filtroEstado = signal<EstadoFiltro>('TODOS');
  readonly cargandoLista = signal(false);
  readonly todosPedidos = signal<PedidoInterno[]>([]);

  // Computed: pedidos filtrados por estado
  // ---- Paginación local, sobre los hasta 100 pedidos que trae el backend ----
  readonly LIMITE_BACKEND = 100;
  readonly opcionesTamano = [10, 20, 50];
  readonly paginaActual = signal(1);
  readonly tamanoPagina = signal(10);
  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.todosPedidos().length / this.tamanoPagina())),
  );
  /** Página efectiva: si la lista se achica (cambio de estado, recarga tras confirmar un pago...), no queda una página inexistente. */
  readonly pagina = computed(() => Math.min(this.paginaActual(), this.totalPaginas()));
  readonly paginas = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));
  readonly pedidosPagina = computed(() => {
    const inicio = (this.pagina() - 1) * this.tamanoPagina();
    return this.todosPedidos().slice(inicio, inicio + this.tamanoPagina());
  });
  readonly rangoMostrado = computed(() => {
    const total = this.todosPedidos().length;
    if (total === 0) {
      return '0';
    }
    const inicio = (this.pagina() - 1) * this.tamanoPagina() + 1;
    const fin = Math.min(this.pagina() * this.tamanoPagina(), total);
    return `${inicio}–${fin} de ${total}`;
  });
  readonly alcanzoLimite = computed(() => this.todosPedidos().length >= this.LIMITE_BACKEND);

  readonly pedidosFiltrados = computed(() => {
    const todos = this.todosPedidos();
    if (this.filtroEstado() === 'TODOS') return todos;
    return todos.filter(p => p.estadoPedido === this.filtroEstado());
  });

  // Contadores por estado
  readonly contadores = computed(() => {
    const todos = this.todosPedidos();
    return {
      TODOS: todos.length,
      PENDING_PAYMENT: todos.filter(p => p.estadoPedido === 'PENDING_PAYMENT').length,
      PAID: todos.filter(p => p.estadoPedido === 'PAID').length,
      PREPARING: todos.filter(p => p.estadoPedido === 'PREPARING').length,
      READY_TO_SHIP: todos.filter(p => p.estadoPedido === 'READY_TO_SHIP').length,
      SHIPPED: todos.filter(p => p.estadoPedido === 'SHIPPED').length,
      DELIVERED: todos.filter(p => p.estadoPedido === 'DELIVERED').length,
      CANCELLED: todos.filter(p => p.estadoPedido === 'CANCELLED').length
    } as Record<string, number>;
  });

  // ========== MODALES DE PAGO ==========
  readonly showModalConfirmarPago = signal(false);
  readonly showModalRechazarPago = signal(false);
  readonly confirmandoPago = signal(false);
  readonly rechazandoPago = signal(false);

  // Datos del formulario de confirmación de pago
  readonly referenciaYape = signal('');
  readonly montoVerificado = signal<number>(0);
  readonly observacionPago = signal('');

  // Datos del formulario de rechazo
  readonly motivoRechazo = signal('');
  readonly observacionRechazo = signal('');

  // ========== MODAL DE CAMBIO DE ESTADO ==========
  readonly showModalCambiarEstado = signal(false);
  readonly nuevoEstado = signal<EstadoSiguiente>('PREPARING');
  readonly cambiandoEstado = signal(false);
  readonly observacionEstado = signal('');

  ngOnInit(): void {
    this.cargarTodosPedidos();
  }

  // ========== LISTADO DE PEDIDOS ==========
  cargarTodosPedidos(): void {
    this.cargandoLista.set(true);
    this.error.set(null);
    const estado = this.filtroEstado() === 'TODOS' ? undefined : this.filtroEstado();
    this.pedidoService.listar(estado).subscribe({
      next: (res) => { this.todosPedidos.set(Array.isArray(res.data) ? res.data : [res.data]); this.cargandoLista.set(false); },
      error: (err) => { this.error.set('Error al cargar los pedidos'); this.cargandoLista.set(false); }
    });
  }

  irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas() || pagina === this.pagina()) {
      return;
    }
    this.paginaActual.set(pagina);
    this.selectedPedido.set(null); // el pedido expandido ya no está en pantalla
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cambiarTamano(tamano: number | string): void {
    this.tamanoPagina.set(Number(tamano));
    this.paginaActual.set(1);
    this.selectedPedido.set(null);
  }

  cambiarFiltro(estado: string): void {
    this.filtroEstado.set(estado as EstadoFiltro);
    this.paginaActual.set(1);
    this.cargarTodosPedidos();
  }

  // ========== BÚSQUEDA POR CÓDIGO ==========

  buscar(): void {
    const termino = this.busqueda().trim();
    if (!termino) {
      this.error.set('Por favor ingresa un criterio de búsqueda');
      return;
    }

    this.buscando.set(true);
    this.error.set(null);
    this.pedidos.set([]);

    // Buscar por código
    if (this.tipoBusqueda() === 'codigo') {
      this.pedidoService.buscarPorCodigoParaAdmin(termino).subscribe({
        next: (res) => {
          console.log('✓ Pedido encontrado:', res.data);
          this.pedidos.set([res.data]);
          this.selectedPedido.set(res.data);
          this.buscando.set(false);
        },
        error: () => {
          console.error('✗ Error buscando pedido');
          this.error.set('No se encontró un pedido con ese código');
          this.buscando.set(false);
        }
      });
    }
  }

  verDetalles(pedido: PedidoInterno): void {
    this.selectedPedido.set(this.selectedPedido() === pedido ? null : pedido);
  }

  // ========== FORMATEO Y TRADUCCIÓN ==========

  getEstadoClass(estado: string): string {
    const estados: { [key: string]: string } = {
      'PENDING_PAYMENT': 'estado-pendiente',
      'PAID': 'estado-confirmado',
      'PREPARING': 'estado-preparacion',
      'READY_TO_SHIP': 'estado-recoger',
      'SHIPPED': 'estado-transito',
      'DELIVERED': 'estado-entregado',
      'CANCELLED': 'estado-cancelado'
    };
    return estados[estado] || 'estado-desconocido';
  }

  getEstadoTexto(estado: string): string {
    const textos: { [key: string]: string } = {
      'PENDING_PAYMENT': 'Pendiente de pago',
      'PAID': 'Confirmado',
      'PREPARING': 'En preparación',
      'READY_TO_SHIP': 'Listo para recoger',
      'SHIPPED': 'En tránsito',
      'DELIVERED': 'Entregado',
      'CANCELLED': 'Cancelado'
    };
    return textos[estado] || estado;
  }

  getEstadoEmoji(estado: string): string {
    const emojis: { [key: string]: string } = {
      'PENDING_PAYMENT': '⏳',
      'PAID': '✅',
      'PREPARING': '👨‍🍳',
      'READY_TO_SHIP': '📦',
      'SHIPPED': '🚚',
      'DELIVERED': '🏁',
      'CANCELLED': '❌'
    };
    return emojis[estado] || '❓';
  }

  getEstadosValidos(estadoActual: string): EstadoSiguiente[] {
    // Define las transiciones válidas
    const transiciones: { [key: string]: EstadoSiguiente[] } = {
      'PAID': ['PREPARING'],
      'PREPARING': ['READY_TO_SHIP'],
      'READY_TO_SHIP': ['SHIPPED', 'DELIVERED'],
      'SHIPPED': ['DELIVERED']
    };
    return transiciones[estadoActual] || [];
  }

  formatoPrecio(precio: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(precio);
  }

  formatoFecha(fecha: string): string {
    return new Intl.DateTimeFormat('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(fecha));
  }

  // ========== CONFIRMACIÓN DE PAGO ==========

  abrirModalConfirmarPago(pedido: PedidoInterno): void {
    if (pedido.estadoPedido !== 'PENDING_PAYMENT') {
      this.error.set('Solo se pueden confirmar pagos de pedidos PENDIENTES');
      return;
    }
    this.selectedPedido.set(pedido);
    this.montoVerificado.set(pedido.montoTotal);
    this.showModalConfirmarPago.set(true);
  }

  cerrarModalConfirmarPago(): void {
    this.showModalConfirmarPago.set(false);
    this.referenciaYape.set('');
    this.montoVerificado.set(0);
    this.observacionPago.set('');
  }

  confirmarPago(): void {
    const pedido = this.selectedPedido();
    if (!pedido) return;

    if (!this.referenciaYape().trim()) {
      this.error.set('Por favor ingresa la referencia Yape');
      return;
    }

    if (this.montoVerificado() <= 0) {
      this.error.set('Por favor ingresa un monto válido');
      return;
    }

    this.confirmandoPago.set(true);
    this.error.set(null);

    const request = {
      referenciaYape: this.referenciaYape(),
      montoVerificado: this.montoVerificado(),
      observacion: this.observacionPago()
    };

    this.pedidoService.confirmarPago(pedido.id, request).subscribe({
      next: (res) => {
        console.log('✓ Pago confirmado:', res.data);
        this.selectedPedido.set(res.data as any);
        this.actualizarPedidoEnListas(res.data);
        this.cerrarModalConfirmarPago();
        this.confirmandoPago.set(false);
        this.error.set(null);
      },
      error: (err) => {
        console.error('✗ Error confirmando pago:', err);
        this.error.set(err.error?.message || 'Error al confirmar el pago');
        this.confirmandoPago.set(false);
      }
    });
  }

  // ========== RECHAZO DE PAGO ==========

  abrirModalRechazarPago(pedido: PedidoInterno): void {
    if (pedido.estadoPedido !== 'PENDING_PAYMENT') {
      this.error.set('Solo se pueden rechazar pagos de pedidos PENDIENTES');
      return;
    }
    this.selectedPedido.set(pedido);
    this.showModalRechazarPago.set(true);
  }

  cerrarModalRechazarPago(): void {
    this.showModalRechazarPago.set(false);
    this.motivoRechazo.set('');
    this.observacionRechazo.set('');
  }

  rechazarPago(): void {
    const pedido = this.selectedPedido();
    if (!pedido) return;

    if (!this.motivoRechazo().trim()) {
      this.error.set('Por favor ingresa el motivo del rechazo');
      return;
    }

    this.rechazandoPago.set(true);
    this.error.set(null);

    const request = {
      motivo: this.motivoRechazo(),
      observacion: this.observacionRechazo()
    };

    this.pedidoService.rechazarPago(pedido.id, request).subscribe({
      next: (res) => {
        console.log('✓ Pago rechazado:', res.data);
        this.selectedPedido.set(res.data as any);
        this.actualizarPedidoEnListas(res.data);
        this.cerrarModalRechazarPago();
        this.rechazandoPago.set(false);
        this.error.set(null);
      },
      error: (err) => {
        console.error('✗ Error rechazando pago:', err);
        this.error.set(err.error?.message || 'Error al rechazar el pago');
        this.rechazandoPago.set(false);
      }
    });
  }

  // ========== CAMBIO DE ESTADO ==========

  abrirModalCambiarEstado(pedido: PedidoInterno): void {
    const validos = this.getEstadosValidos(pedido.estadoPedido);
    if (validos.length === 0) {
      this.error.set('Este pedido no puede cambiar de estado');
      return;
    }
    this.selectedPedido.set(pedido);
    this.nuevoEstado.set(validos[0]);
    this.showModalCambiarEstado.set(true);
  }

  cerrarModalCambiarEstado(): void {
    this.showModalCambiarEstado.set(false);
    this.nuevoEstado.set('PREPARING');
    this.observacionEstado.set('');
  }

  cambiarEstado(): void {
    const pedido = this.selectedPedido();
    if (!pedido) return;

    this.cambiandoEstado.set(true);
    this.error.set(null);

    const request = {
      nuevoEstado: this.nuevoEstado()
    };

    this.pedidoService.cambiarEstado(pedido.id, request).subscribe({
      next: (res) => {
        console.log('✓ Estado actualizado:', res.data);
        this.selectedPedido.set(res.data as any);
        this.actualizarPedidoEnListas(res.data);
        this.cerrarModalCambiarEstado();
        this.cambiandoEstado.set(false);
        this.error.set(null);
      },
      error: (err) => {
        console.error('✗ Error cambiando estado:', err);
        this.error.set(err.error?.message || 'Error al cambiar el estado');
        this.cambiandoEstado.set(false);
      }
    });
  }

  // ========== HELPERS ==========

  private actualizarPedidoEnListas(pedidoActualizado: any): void {
    // Actualizar en todosPedidos
    const todosActualizado = this.todosPedidos().map(p =>
      p.id === pedidoActualizado.id ? (pedidoActualizado as PedidoInterno) : p
    );
    this.todosPedidos.set(todosActualizado);

    // Actualizar en pedidos (si existe búsqueda)
    if (this.pedidos().length > 0) {
      const busquedaActualizada = this.pedidos().map(p =>
        p.id === pedidoActualizado.id ? (pedidoActualizado as PedidoInterno) : p
      );
      this.pedidos.set(busquedaActualizada);
    }
  }

  limpiar(): void {
    this.busqueda.set('');
    this.pedidos.set([]);
    this.selectedPedido.set(null);
    this.error.set(null);
  }
}
