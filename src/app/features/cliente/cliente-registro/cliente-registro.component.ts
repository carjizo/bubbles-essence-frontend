import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ClienteService, RegistroClienteRequest } from '../../../core/services/cliente.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-cliente-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './cliente-registro.component.html',
  styleUrl: './cliente-registro.component.css',
})
export class ClienteRegistroComponent {
  private readonly fb = inject(FormBuilder);
  private readonly clienteService = inject(ClienteService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly mostrarPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    documento: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]],
    nombreCompleto: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    correo: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(/^\d{7,15}$/)]],
    clave: ['', [Validators.required, Validators.minLength(8)]],
    confirmarClave: ['', [Validators.required]],
  });

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { clave, confirmarClave, ...datos } = this.form.getRawValue();

    if (clave !== confirmarClave) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    const registroData: RegistroClienteRequest = {
      ...datos,
      clave,
    };

    this.clienteService.registroCliente(registroData).subscribe({
      next: (respuesta) => {
        // Guardar token en localStorage igual que AuthService
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
        this.error.set(err?.error?.message ?? 'No se pudo completar el registro. Intenta de nuevo.');
      },
    });
  }

  togglePassword(): void {
    this.mostrarPassword.set(!this.mostrarPassword());
  }
}
