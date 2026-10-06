import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PreguntaChat, RespuestaChat } from '../models/asistente.model';

/**
 * Endpoint público (permitAll en el backend) — no necesita ninguna marca
 * de USA_TOKEN_CLIENTE, lo puede llamar un invitado sin sesión.
 */
@Injectable({ providedIn: 'root' })
export class AsistenteService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/asistente`;

  /**
   * Render free duerme el backend tras ~15 min sin tráfico; el primer
   * request luego de eso puede tardar 30-60s en "despertarlo". Sin este
   * timeout, un request colgado deja el chat en "Escribiendo..." para
   * siempre sin explicar nada. 45s da margen al cold-start sin dejar al
   * usuario esperando indefinidamente si de verdad algo se rompió.
   */
  private static readonly TIMEOUT_MS = 45_000;

  preguntar(pregunta: string): Observable<ApiResponse<RespuestaChat>> {
    const body: PreguntaChat = { pregunta };
    return this.http
      .post<ApiResponse<RespuestaChat>>(`${this.base}/chat`, body)
      .pipe(timeout(AsistenteService.TIMEOUT_MS));
  }
}