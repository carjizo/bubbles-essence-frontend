import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { AccesoService } from '../services/acceso.service';

/**
 * Muestra el contenido solo si el usuario logueado tiene ese código de
 * acción (ej. "btn-editar-producto"). Uso:
 *
 *   <button *appHasAccion="'btn-editar-producto'" (click)="editar(p)">Editar</button>
 *
 * El código es el mismo que ves en GET /accesos/mis-accesos -> acciones[].
 * No hace ninguna llamada propia: lee el signal ya cargado en AccesoService.
 */
@Directive({
  selector: '[appHasAccion]',
  standalone: true,
})
export class HasAccionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly accesoService = inject(AccesoService);

  private codigo = '';
  private insertado = false;

  @Input() set appHasAccion(codigo: string) {
    this.codigo = codigo;
  }

  constructor() {
    effect(() => {
      // Se re-evalúa solo: el signal de AccesoService cambia al loguearse,
      // deslogearse, o recargar accesos.
      let tieneAcceso = false;
      // Soporta dos formas de uso: 'btn-editar-producto' o 'MODULO:btn-editar-producto'
      if (this.codigo.includes(':')) {
        const [modulo, accion] = this.codigo.split(':', 2);
        tieneAcceso = this.accesoService.tieneAccionEnModulo(modulo, accion);
      } else {
        tieneAcceso = this.accesoService.tieneAccion(this.codigo);
      }
      if (tieneAcceso && !this.insertado) {
        this.viewContainerRef.createEmbeddedView(this.templateRef);
        this.insertado = true;
      } else if (!tieneAcceso && this.insertado) {
        this.viewContainerRef.clear();
        this.insertado = false;
      }
    });
  }
}
