export type RolUsuario = 'ADMIN' | 'OPERADOR' | 'VENDEDOR' | 'REPARTIDOR';

/** Espejo de LoginRequestDTO */
export interface LoginRequest {
  usuario: string;
  clave: string;
}

/** Espejo de LoginResponseDTO */
export interface LoginResponse {
  token: string;
  tipoToken: string;
  id: number;
  nombreCompleto: string;
  usuario: string;
  rol: RolUsuario;
}
