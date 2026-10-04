import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GrupoResponse, GrupoRequest } from '../../../../core/services/grupo.service';

@Component({
  selector: 'app-grupo-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grupo-form.component.html',
  styleUrl: './grupo-form.component.css'
})
export class GrupoFormComponent {
  @Input() grupo?: GrupoResponse;
  @Output() guardado = new EventEmitter<GrupoRequest>();
  @Output() cancelado = new EventEmitter<void>();

  readonly enviando = signal(false);
  readonly error = signal('');

  form = {
    codigo: '',
    nombre: '',
    descripcion: ''
  };

  ngOnInit(): void {
    if (this.grupo) {
      this.form = {
        codigo: this.grupo.codigo,
        nombre: this.grupo.nombre,
        descripcion: this.grupo.descripcion || ''
      };
    }
  }

  guardar(): void {
    if (!this.form.codigo || !this.form.nombre) {
      return;
    }
    this.guardado.emit(this.form as GrupoRequest);
  }
}
