/** Espejo de ProductoResponseDTO */
export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  imagenUrl?: string;
  ingredienteId?: number;
  activo: boolean;
  fechaCreacion: string;
  usuarioCreador: string;
}

/** Filtros opcionales del listado admin (espejo de los query params de GET /productos). */
export interface FiltrosProducto {
  activo?: boolean;
  /** yyyy-MM-dd */
  fechaDesde?: string;
  /** yyyy-MM-dd */
  fechaHasta?: string;
  /** Búsqueda predictiva: productos con un ingrediente que contenga este texto (3+ caracteres). */
  ingrediente?: string;
  codigo?: string;
  nombre?: string;
}

/** Espejo de ProductoRequestDTO */
export interface ProductoRequest {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  imagenUrl?: string;
  ingredienteId?: number;
  activo: boolean | null;
}

/** Item en el carrito del cliente */
export interface ItemCarrito {
  productoId: number;
  producto: Producto;
  cantidad: number;
  subtotal: number; // precio * cantidad
}

/** Estado del carrito (para localStorage) */
export interface EstadoCarrito {
  items: ItemCarrito[];
  total: number;
  cantidadTotal: number;
}

/** Solicitud para crear un pedido (cliente sin login) */
export interface CrearPedidoClienteRequest {
  clienteId?: number;
  invitadoNombre: string;
  invitadoTelefono: string;
  invitadoDocumento: string;
  invitadoCorreo?: string;
  tipoEntrega: 'RECOJO' | 'DELIVERY'; // RECOJO | DELIVERY
  direccionEntrega?: string;
  items: Array<{
    productoId: number;
    cantidad: number;
  }>;
}

/** Respuesta del pedido creado (espejo de PedidoResponseDTO) */
export interface PedidoCliente {
  id: number;
  codigoPedido: string;
  codigo?: string;
  clienteId?: number;
  invitadoNombre: string;
  nombreCliente?: string;
  invitadoTelefono: string;
  telefonoCliente?: string;
  tipoEntrega: 'RECOJO' | 'DELIVERY';
  direccionEntrega?: string;
  estadoPedido: string;
  estado?: string;
  vendedorId?: number;
  montoTotal: number;
  total?: number;
  canceladoPor?: string;
  motivoCancelacion?: string;
  fechaCancelacion?: string;
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
  cantidadProductos?: number;
  observaciones?: string;
}
