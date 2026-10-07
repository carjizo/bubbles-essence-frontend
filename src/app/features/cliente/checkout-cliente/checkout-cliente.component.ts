import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import jsPDF from 'jspdf';
import { CrearPedidoClienteRequest, PedidoCliente } from '../../../core/models/producto.model';
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

  readonly formulario: FormGroup;
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly pedidoCreado = signal(false);
  readonly numeroPedido = signal<string | null>(null);
  /** Snapshot completo del pedido recién creado (lo devuelve el backend),
   *  usado para mostrar el resumen en la pantalla de éxito y para armar
   *  el PDF -> no depende del carrito, que ya se limpia apenas se crea
   *  el pedido. */
  readonly pedidoConfirmado = signal<PedidoCliente | null>(null);

  constructor() {
    this.formulario = this.fb.group({
      nombreCliente: ['', [Validators.required, Validators.minLength(3)]],
      telefonoCliente: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      dniCliente: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
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
      invitadoDocumento: this.formulario.get('dniCliente')?.value,
      invitadoCorreo: this.formulario.get('correoCliente')?.value || undefined,
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
        this.pedidoConfirmado.set(res.data);
        this.carritoService.limpiar();
        // Sin redirect automático: la pantalla se queda mostrando la
        // confirmación hasta que el cliente decida ir a seguimiento (o
        // descargar el PDF) por su cuenta.
      },
      error: (err) => {
        console.error('✗ Error creando pedido:', err);
        this.enviando.set(false);
        this.error.set(err.error?.message || 'Error al crear el pedido');
      }
    });
  }

  /**
   * PDF básico del comprobante, armado 100% en el navegador (no pasa por
   * el backend) a partir del mismo pedidoConfirmado que se muestra en
   * pantalla, así siempre coinciden.
   */
  descargarPdf(): void {
    const pedido = this.pedidoConfirmado();
    if (!pedido) {
      return;
    }

    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.setTextColor(90, 61, 216);
    doc.text('Bubbles & Essence', 14, y);

    y += 7;
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Confirmación de pedido', 14, y);

    y += 12;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Código de pedido: ${pedido.codigoPedido}`, 14, y);
    y += 6;
    doc.text(`Fecha: ${new Date(pedido.fechaPedido).toLocaleString('es-PE')}`, 14, y);
    y += 6;
    doc.text(`Estado: ${pedido.estadoPedido}`, 14, y);

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Datos del cliente', 14, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
    doc.text(`Nombre: ${pedido.invitadoNombre ?? pedido.nombreCliente ?? '-'}`, 14, y);
    y += 6;
    doc.text(`DNI: ${(pedido as any).invitadoDocumento ?? '-'}`, 14, y);
    y += 6;
    doc.text(`Teléfono: ${pedido.invitadoTelefono ?? pedido.telefonoCliente ?? '-'}`, 14, y);
    const correo = (pedido as any).invitadoCorreo;
    if (correo) {
      y += 6;
      doc.text(`Correo: ${correo}`, 14, y);
    }

    y += 6;
    doc.text(
      `Entrega: ${pedido.tipoEntrega === 'DELIVERY' ? 'Envío a domicilio' : 'Recojo en tienda'}`,
      14,
      y
    );
    if (pedido.direccionEntrega) {
      y += 6;
      doc.text(`Dirección: ${pedido.direccionEntrega}`, 14, y);
    }

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Productos', 14, y);
    doc.setFont('helvetica', 'normal');
    y += 8;

    doc.setFontSize(9);
    doc.text('Producto', 14, y);
    doc.text('Cant.', 120, y);
    doc.text('P. Unit.', 145, y);
    doc.text('Subtotal', 175, y);
    y += 2;
    doc.line(14, y, 196, y);
    y += 6;

    for (const item of pedido.detalles ?? []) {
      doc.text(item.productoNombre, 14, y);
      doc.text(String(item.cantidad), 120, y);
      doc.text(`S/ ${item.precioUnitario.toFixed(2)}`, 145, y);
      doc.text(`S/ ${item.subtotal.toFixed(2)}`, 175, y);
      y += 6;
    }

    y += 2;
    doc.line(14, y, 196, y);
    y += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: S/ ${pedido.montoTotal.toFixed(2)}`, 145, y);

    y += 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(130, 130, 130);
    doc.text('Guarda este comprobante: el código de pedido y tu DNI son lo que necesitas', 14, y);
    y += 5;
    doc.text('para hacer seguimiento de tu pedido en cualquier momento.', 14, y);

    doc.save(`pedido-${pedido.codigoPedido}.pdf`);
  }

  formatoPrecio(precio: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(precio);
  }

  trackById(_: number, item: any): number {
    return item.productoId;
  }
}