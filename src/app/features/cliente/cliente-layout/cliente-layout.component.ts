import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ClienteNavbarComponent } from '../cliente-navbar/cliente-navbar.component';

@Component({
  selector: 'app-cliente-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ClienteNavbarComponent],
  template: `
    <app-cliente-navbar></app-cliente-navbar>
    <main class="cliente-main">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .cliente-main {
      min-height: calc(100vh - 70px);
      background: #f5f5f5;
    }
  `]
})
export class ClienteLayoutComponent {}
