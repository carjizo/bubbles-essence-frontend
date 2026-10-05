import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
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

  preguntar(pregunta: string): Observable<ApiResponse<RespuestaChat>> {
    const body: PreguntaChat = { pregunta };
    return this.http.post<ApiResponse<RespuestaChat>>(`${this.base}/chat`, body);
  }
}