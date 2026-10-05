import { CommonModule } from '@angular/common';
import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsistenteService } from '../../../core/services/asistente.service';
import { MensajeChat } from '../../../core/models/asistente.model';

@Component({
  selector: 'app-asistente-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Botón flotante -->
    <button class="burbuja" (click)="alternarPanel()" [class.oculto]="panelAbierto()">
      <span class="burbuja-icono">💬</span>
    </button>

    <!-- Panel del chat -->
    @if (panelAbierto()) {
      <div class="panel">
        <header class="panel-header">
          <div class="header-info">
            <span class="header-avatar">🧼</span>
            <div>
              <div class="header-titulo">Bubbles & Essence</div>
              <div class="header-subtitulo">Asistente virtual · en línea</div>
            </div>
          </div>
          <button class="cerrar" (click)="alternarPanel()" aria-label="Cerrar">✕</button>
        </header>

        <div class="mensajes" #mensajesContainer>
          @if (mensajes().length === 0) {
            <div class="mensaje-bienvenida">
              <span class="bienvenida-icono">🧼✨</span>
              <p>¡Hola! Pregúntame sobre nuestros jabones, ingredientes, precios, envíos o recojo en tienda.</p>
            </div>
          }
          @for (m of mensajes(); track $index) {
            <div class="fila" [class.usuario]="m.autor === 'usuario'">
              @if (m.autor === 'asistente') {
                <span class="avatar-mini">🧼</span>
              }
              <div class="burbuja-mensaje" [class.usuario]="m.autor === 'usuario'" [innerHTML]="formatear(m.texto)"></div>
            </div>
          }
          @if (cargando()) {
            <div class="fila">
              <span class="avatar-mini">🧼</span>
              <div class="burbuja-mensaje escribiendo">
                <span class="punto"></span><span class="punto"></span><span class="punto"></span>
              </div>
            </div>
          }
        </div>

        <form class="input-area" (ngSubmit)="enviar()">
          <input
            type="text"
            placeholder="Escribe tu pregunta..."
            [(ngModel)]="textoActual"
            name="pregunta"
            [disabled]="cargando()"
            maxlength="500"
          />
          <button type="submit" [disabled]="cargando() || !textoActual.trim()" aria-label="Enviar">➤</button>
        </form>
      </div>
    }
  `,
  styles: [`
    :host {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .burbuja {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, #7c5cf0, #5a3dd8);
      color: white;
      cursor: pointer;
      box-shadow: 0 6px 18px rgba(90, 61, 216, 0.4);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.15s ease;
    }
    .burbuja:hover { transform: scale(1.06); }
    .burbuja-icono { font-size: 24px; }
    .burbuja.oculto { display: none; }

    .panel {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 360px;
      max-width: calc(100vw - 32px);
      height: 500px;
      max-height: calc(100vh - 48px);
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.22);
      display: flex;
      flex-direction: column;
      z-index: 1000;
      overflow: hidden;
      animation: aparecer 0.18s ease-out;
    }
    @keyframes aparecer {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .panel-header {
      background: linear-gradient(135deg, #7c5cf0, #5a3dd8);
      color: white;
      padding: 14px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-info { display: flex; align-items: center; gap: 10px; }
    .header-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255,255,255,0.18);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .header-titulo { font-weight: 700; font-size: 14px; line-height: 1.2; }
    .header-subtitulo { font-size: 11px; opacity: 0.85; }
    .cerrar {
      background: none;
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
      opacity: 0.85;
      padding: 4px;
    }
    .cerrar:hover { opacity: 1; }

    .mensajes {
      flex: 1;
      overflow-y: auto;
      padding: 14px 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: #f7f6fb;
    }
    .mensaje-bienvenida {
      text-align: center;
      color: #666;
      margin-top: 24px;
      padding: 0 16px;
    }
    .bienvenida-icono { font-size: 28px; display: block; margin-bottom: 8px; }
    .mensaje-bienvenida p { font-size: 13.5px; line-height: 1.5; margin: 0; }

    .fila {
      display: flex;
      align-items: flex-end;
      gap: 6px;
    }
    .fila.usuario { justify-content: flex-end; }
    .avatar-mini {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #e8e3fb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      flex-shrink: 0;
    }

    .burbuja-mensaje {
      background: white;
      padding: 10px 13px;
      border-radius: 14px 14px 14px 4px;
      max-width: 78%;
      font-size: 13.5px;
      line-height: 1.5;
      box-shadow: 0 1px 2px rgba(0,0,0,0.06);
      color: #2a2a2a;
    }
    .burbuja-mensaje.usuario {
      background: linear-gradient(135deg, #7c5cf0, #5a3dd8);
      color: white;
      border-radius: 14px 14px 4px 14px;
    }
    .burbuja-mensaje ::ng-deep strong { color: #5a3dd8; font-weight: 700; }
    .burbuja-mensaje.usuario ::ng-deep strong { color: white; }
    .burbuja-mensaje ::ng-deep ul { margin: 4px 0; padding-left: 18px; }
    .burbuja-mensaje ::ng-deep li { margin-bottom: 2px; }
    .burbuja-mensaje ::ng-deep .link-chat {
      display: inline-block;
      margin-top: 4px;
      padding: 5px 10px;
      background: #ede8fc;
      color: #5a3dd8;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 12.5px;
    }
    .burbuja-mensaje.usuario ::ng-deep .link-chat {
      background: rgba(255,255,255,0.22);
      color: white;
    }

    .burbuja-mensaje.escribiendo { display: flex; gap: 4px; padding: 13px; }
    .punto {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #b3a8e6;
      animation: rebote 1.1s infinite ease-in-out;
    }
    .punto:nth-child(2) { animation-delay: 0.15s; }
    .punto:nth-child(3) { animation-delay: 0.3s; }
    @keyframes rebote {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
      30% { transform: translateY(-4px); opacity: 1; }
    }

    .input-area {
      display: flex;
      border-top: 1px solid #ececf2;
      padding: 10px;
      gap: 8px;
      background: white;
    }
    .input-area input {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 20px;
      padding: 9px 14px;
      font-size: 13.5px;
      outline: none;
    }
    .input-area input:focus { border-color: #7c5cf0; }
    .input-area button {
      background: linear-gradient(135deg, #7c5cf0, #5a3dd8);
      color: white;
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      cursor: pointer;
      flex-shrink: 0;
      font-size: 14px;
    }
    .input-area button:disabled {
      opacity: 0.4;
      cursor: default;
    }
  `],
})
export class AsistenteChatComponent implements AfterViewChecked {
  private readonly asistenteService = inject(AsistenteService);

  @ViewChild('mensajesContainer') mensajesContainer?: ElementRef<HTMLDivElement>;

  readonly panelAbierto = signal(false);
  readonly mensajes = signal<MensajeChat[]>([]);
  readonly cargando = signal(false);
  textoActual = '';

  private debeHacerScroll = false;

  alternarPanel(): void {
    this.panelAbierto.update((v) => !v);
  }

  enviar(): void {
    const pregunta = this.textoActual.trim();
    if (!pregunta || this.cargando()) {
      return;
    }

    this.mensajes.update((msgs) => [...msgs, { autor: 'usuario', texto: pregunta }]);
    this.textoActual = '';
    this.cargando.set(true);
    this.debeHacerScroll = true;

    this.asistenteService.preguntar(pregunta).subscribe({
      next: (res) => {
        this.mensajes.update((msgs) => [...msgs, { autor: 'asistente', texto: res.data.respuesta }]);
        this.cargando.set(false);
        this.debeHacerScroll = true;
      },
      error: () => {
        this.mensajes.update((msgs) => [
          ...msgs,
          { autor: 'asistente', texto: 'No pude responder justo ahora. Intenta de nuevo en un momento.' },
        ]);
        this.cargando.set(false);
        this.debeHacerScroll = true;
      },
    });
  }

  ngAfterViewChecked(): void {
    if (this.debeHacerScroll && this.mensajesContainer) {
      this.mensajesContainer.nativeElement.scrollTop = this.mensajesContainer.nativeElement.scrollHeight;
      this.debeHacerScroll = false;
    }
  }

  /**
   * Convierte el Markdown básico que el modelo suele devolver (**negrita**,
   * listas con "- ", links sueltos https://...) a HTML simple. Primero
   * escapa cualquier HTML real del texto (por si el modelo repite algo
   * raro del prompt o alguien intenta inyectar algo) y RECIÉN AHÍ aplica
   * las etiquetas propias -> no hay forma de que termine insertando HTML
   * arbitrario. Angular además sanitiza [innerHTML] por su cuenta,
   * aceptando solo etiquetas simples como <strong>/<ul>/<li>/<br>/<a>,
   * así que esto es seguro por partida doble.
   */
  formatear(texto: string): string {
    const escapado = texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const conLinks = this.linkificar(escapado);
    const conNegrita = conLinks.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    const lineas = conNegrita.split('\n');
    let html = '';
    let dentroDeLista = false;

    for (const linea of lineas) {
      const esItem = /^\s*-\s+/.test(linea);
      if (esItem) {
        if (!dentroDeLista) {
          html += '<ul>';
          dentroDeLista = true;
        }
        html += `<li>${linea.replace(/^\s*-\s+/, '')}</li>`;
      } else {
        if (dentroDeLista) {
          html += '</ul>';
          dentroDeLista = false;
        }
        html += linea ? `${linea}<br>` : '<br>';
      }
    }
    if (dentroDeLista) {
      html += '</ul>';
    }

    return html;
  }

  /**
   * Reemplaza URLs sueltas (https://...) por botones clickeables, con una
   * etiqueta amigable según el dominio en vez de mostrar el link crudo
   * completo (que para el de Google Maps sería carga visual innecesaria).
   */
  private linkificar(texto: string): string {
    return texto.replace(/(https?:\/\/[^\s<]+)/g, (url) => {
      let etiqueta = '🔗 Abrir enlace';
      if (url.includes('wa.me') || url.includes('whatsapp.com')) {
        etiqueta = '📱 Escribir por WhatsApp';
      } else if (url.includes('instagram.com')) {
        etiqueta = '📷 Ver Instagram';
      } else if (url.includes('google.com/maps') || url.includes('maps.app.goo.gl')) {
        etiqueta = '📍 Ver ubicación';
      }
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="link-chat">${etiqueta}</a>`;
    });
  }
}