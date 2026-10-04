import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CrearPedidoClienteRequest } from '../../../core/models/producto.model';
import { CarritoService } from '../../../core/services/carrito.service';
import { PedidoClienteService } from '../../../core/services/pedido-cliente.service';

@Component({
  selector: 'app-checkout-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout-cliente.component.html',
  styleUrl: './checkout-cliente.component.css'
})
export class CheckoutClienteComponent {
  private readonly carritoService = inject(CarritoService);
  private readonly pedidoService = inject(PedidoClienteService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly formulario: FormGroup;
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly pedidoCreado = signal(false);
  readonly numeroPedido = signal<string | null>(null);

  constructor() {
    this.formulario = this.fb.group({
      nombreCliente: ['', [Validators.required, Validators.minLength(3)]],
      telefonoCliente: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      correoCliente: ['', [Validators.email]],
      direccionEntrega: ['', [Validators.required, Validators.minLength(5)]],
      observaciones: ['']
    });
  }

  get carrito() {
    return this.carritoService.carrito();
  }

  enviar(): void {
    if (!this.formulario.valid || this.carrito.items.length === 0) {
      this.error.set('Por favor, completa todos los campos requeridos');
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    const request: CrearPedidoClienteRequest = {
      invitadoNombre: this.formulario.get('nombreCliente')?.value,
      invitadoTelefono: this.formulario.get('telefonoCliente')?.value,
      tipoEntrega: 'RECOJO', // Por defecto RECOJO (sin delivery)
      direccionEntrega: this.formulario.get('direccionEntrega')?.value,
      items: this.carrito.items.map(item => ({
        productoId: item.producto.id,
        cantidad: item.cantidad
      }))
    };

    this.pedidoService.crear(request).subscribe({
      next: (res) => {
        console.log('✓ Pedido creado:', res.data);
        this.enviando.set(false);
        this.pedidoCreado.set(true);
        this.numeroPedido.set(res.data.codigoPedido);
        this.carritoService.limpiar();
        
        // Redirige al seguimiento con parámetros de query pre-llenados
        setTimeout(() => {
          this.router.navigate(['/cliente/seguimiento'], {
            queryParams: {
              codigoPedido: res.data.codigoPedido,
              telefono: request.invitadoTelefono
            }
          });
        }, 3000);
      },
      error: (err) => {
        console.error('✗ Error creando pedido:', err);
        this.enviando.set(false);
        this.error.set(err.error?.message || 'Error al crear el pedido');
      }
    });
  }

  formatoPrecio(precio: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(precio);
  }

  trackById(_: number, item: any): number {
    return item.productoId;
  }
}
