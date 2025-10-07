import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { EmpresaComponent } from './empresa/empresa.component';
import { PrevisaoComponent } from './previsao/previsao.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'dashboard', redirectTo: 'home' },
  { path: 'empresa', component: EmpresaComponent },
  { path: 'previsao', component: PrevisaoComponent },
  { path: '**', redirectTo: '' }
];
