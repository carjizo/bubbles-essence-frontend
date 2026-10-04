import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PedidoCliente } from '../../../core/models/producto.model';
import { PedidoClienteService } from '../../../core/services/pedido-cliente.service';

@Component({
  selector: 'app-seguimiento-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './seguimiento-pedido.component.html',
  styleUrl: './seguimiento-pedido.component.css'
})
export class SeguimientoPedidoComponent implements OnInit {
  private readonly pedidoService = inject(PedidoClienteService);

  // Búsqueda de invitado
  readonly codigoPedido = signal('');
  readonly dniCliente = signal('');
  readonly pedido = signal<PedidoCliente | null>(null);

  // Estados comunes
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly mostrarFormulario = signal(true);

  ngOnInit(): void {
    // No hacer nada especial - solo mostrar el formulario de búsqueda
  }

  private buscarAutomatico(codigo: string, dni: string): void {
    this.cargando.set(true);
    this.error.set(null);
    this.pedido.set(null);

    this.pedidoService.seguimiento(codigo, dni).subscribe({
      next: (res) => {
        console.log('✓ Pedido encontrado:', res.data);
        this.pedido.set(res.data);
        this.mostrarFormulario.set(false);
        this.cargando.set(false);
      },
      error: () => {
        console.error('✗ Error buscando pedido');
        this.error.set('No se encontró un pedido con esos datos. Verifica código y DNI.');
        this.cargando.set(false);
      }
    });
  }

  buscar(): void {
    const codigo = this.codigoPedido().trim();
    const dni = this.dniCliente().trim();

    if (!codigo || !dni) {
      this.error.set('Por favor ingresa código de pedido y DNI');
      return;
    }

    this.buscarAutomatico(codigo, dni);
  }

  nuevaBusqueda(): void {
    this.codigoPedido.set('');
    this.dniCliente.set('');
    this.pedido.set(null);
    this.error.set(null);
    this.mostrarFormulario.set(true);
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
}

