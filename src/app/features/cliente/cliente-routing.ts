import { Route } from '@angular/router';
import { ClienteLayoutComponent } from './cliente-layout/cliente-layout.component';
import { CatalogoPublicoComponent } from './catalogo-publico/catalogo-publico.component';
import { ProductoDetalleComponent } from './producto-detalle/producto-detalle.component';
import { CarritoClienteComponent } from './carrito-cliente/carrito-cliente.component';
import { CheckoutClienteComponent } from './checkout-cliente/checkout-cliente.component';
import { SeguimientoPedidoComponent } from './seguimiento-pedido/seguimiento-pedido.component';
import { ClienteRegistroComponent } from './cliente-registro/cliente-registro.component';
import { ClienteLoginComponent } from './cliente-login/cliente-login.component';
import { MisPedidosComponent } from './mis-pedidos/mis-pedidos.component';

export const CLIENTE_ROUTES: Route[] = [
  // Rutas públicas sin layout (registro y login)
  { path: 'registro', component: ClienteRegistroComponent },
  { path: 'login', component: ClienteLoginComponent },
  
  // Rutas con layout
  {
    path: '',
    component: ClienteLayoutComponent,
    children: [
      { path: '', component: CatalogoPublicoComponent },
      { path: 'productos/:id', component: ProductoDetalleComponent },
      { path: 'carrito', component: CarritoClienteComponent },
      { path: 'checkout', component: CheckoutClienteComponent },
      { path: 'seguimiento', component: SeguimientoPedidoComponent },
      { path: 'mis-pedidos', component: MisPedidosComponent }
    ]
  }
];
