import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface RegistroClienteRequest {
  documento: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  clave: string;
}

export interface LoginClienteRequest {
  documento: string;
  clave: string;
}

export interface ClienteLoginResponse {
  token: string;
  tipoToken: string;
  id: number;
  nombreCompleto: string;
  documento: string;
  correo: string;
  telefono: string;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly http = inject(HttpClient);

  registroCliente(datos: RegistroClienteRequest): Observable<ApiResponse<ClienteLoginResponse>> {
    return this.http.post<ApiResponse<ClienteLoginResponse>>(
      `${environment.apiUrl}/auth/registro-cliente`,
      datos
    );
  }

  loginCliente(credenciales: LoginClienteRequest): Observable<ApiResponse<ClienteLoginResponse>> {
    return this.http.post<ApiResponse<ClienteLoginResponse>>(
      `${environment.apiUrl}/auth/login-cliente`,
      credenciales
    );
  }
}
