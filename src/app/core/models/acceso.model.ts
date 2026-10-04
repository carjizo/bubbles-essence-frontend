import { RolUsuario } from './auth.model';

export interface GrupoResumen {
  id: number;
  codigo: string;
  nombre: string;
}

export interface ModuloResumen {
  id: number;
  codigo: string;
  nombre: string;
  orden: number;
  acciones?: string[];
}

/** Espejo de AccesoResponseDTO: lo que resuelve GET /accesos/mis-accesos */
export interface AccesoResponse {
  usuarioId: number;
  usuario: string;
  nombreCompleto: string;
  rol: RolUsuario;
  activo: boolean;
  grupos: GrupoResumen[];
  modulos: ModuloResumen[];
  acciones: string[];
}
