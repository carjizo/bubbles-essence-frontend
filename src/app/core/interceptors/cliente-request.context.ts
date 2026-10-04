import { HttpContextToken } from '@angular/common/http';

/**
 * Marca explícita: esta petición debe usar el token de CLIENTE, sin
 * importar qué diga la URL.
 *
 * Por qué no basta con mirar la URL: varios endpoints de cliente
 * comparten la misma ruta base que endpoints de staff (ej.
 * /api/v1/pedidos/mis-pedidos vs /api/v1/pedidos para el staff), así
 * que "la URL contiene /cliente/" no es una señal confiable. En vez de
 * adivinar, cada servicio Angular que llama un endpoint que exige rol
 * CLIENTE en el backend (ver @PreAuthorize("hasRole('CLIENTE')")) debe
 * marcarlo así:
 *
 *   this.http.get(url, { context: new HttpContext().set(USA_TOKEN_CLIENTE, true) })
 */
export const USA_TOKEN_CLIENTE = new HttpContextToken<boolean>(() => false);