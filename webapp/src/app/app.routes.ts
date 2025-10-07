import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { EmpresaComponent } from './empresa/empresa.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'empresa', component: EmpresaComponent },
  { path: '**', redirectTo: '' }
];
