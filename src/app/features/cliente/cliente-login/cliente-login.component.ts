import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ClienteService, LoginClienteRequest } from '../../../core/services/cliente.service';

@Component({
  selector: 'app-cliente-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './cliente-login.component.html',
  styleUrl: './cliente-login.component.css',
})
export class ClienteLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly clienteService = inject(ClienteService);
  private readonly router = inject(Router);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly mostrarPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    documento: ['', [Validators.required]],
    clave: ['', [Validators.required]],
  });

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    const credenciales: LoginClienteRequest = this.form.getRawValue();

    this.clienteService.loginCliente(credenciales).subscribe({
      next: (respuesta) => {
        // Guardar token en localStorage
        const sesion = {
          token: respuesta.data.token,
          usuario: respuesta.data,
        };
        localStorage.setItem('be_session_cliente', JSON.stringify(sesion));
        // Redirigir a Mis Pedidos para ver sus pedidos
        this.router.navigate(['/cliente/mis-pedidos']);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.message ?? 'Documento o contraseña incorrectos. Intenta de nuevo.');
      },
    });
  }

  togglePassword(): void {
    this.mostrarPassword.set(!this.mostrarPassword());
  }
}
