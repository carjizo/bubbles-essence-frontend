import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PedidoCliente } from '../../../core/models/producto.model';
import { PedidoClienteService } from '../../../core/services/pedido-cliente.service';

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mis-pedidos.component.html',
  styleUrl: './mis-pedidos.component.css'
})
export class MisPedidosComponent implements OnInit {
  private readonly pedidoService = inject(PedidoClienteService);

  readonly misPedidos = signal<PedidoCliente[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarMisPedidos();
  }

  private cargarMisPedidos(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.pedidoService.obtenerMisPedidos().subscribe({
      next: (res) => {
        this.misPedidos.set(res.data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando pedidos:', err);
        this.error.set('No se pudieron cargar tus pedidos. Intenta más tarde.');
        this.cargando.set(false);
      }
    });
  }

  formatoPrecio(monto: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto);
  }

  formatoFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  getEstadoClass(estado: string): string {
    const estadoMap: { [key: string]: string } = {
      'PENDING_PAYMENT': 'estado-pendiente',
      'PAID': 'estado-confirmado',
      'PREPARING': 'estado-preparacion',
      'READY_TO_SHIP': 'estado-recoger',
      'SHIPPED': 'estado-en-transito',
      'DELIVERED': 'estado-entregado',
      'CANCELLED': 'estado-cancelado'
    };
    return estadoMap[estado] || 'estado-default';
  }

  getEstadoTexto(estado: string): string {
    const estadoMap: { [key: string]: string } = {
      'PENDING_PAYMENT': 'Pendiente de Pago',
      'PAID': 'Confirmado',
      'PREPARING': 'En Preparación',
      'READY_TO_SHIP': 'Listo para Recoger',
      'SHIPPED': 'En Tránsito',
      'DELIVERED': 'Entregado',
      'CANCELLED': 'Cancelado'
    };
    return estadoMap[estado] || estado;
  }

  irAlCatalogo(): void {
    window.location.href = '/cliente';
  }
}
