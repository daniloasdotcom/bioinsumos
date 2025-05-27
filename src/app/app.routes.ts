// Seu app.routes.ts atual
import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LegislacaoComponent } from './components/legislacao/legislacao.component';
import { BioinsumosComponent } from './components/bioinsumos/bioinsumos.component'; // <--- JÁ EXISTE

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, title: 'Página Inicial | Portal Bioinsumos' },
  { path: 'legislacao', component: LegislacaoComponent, title: 'Legislação | Portal Bioinsumos' },
  { path: 'bioinsumos', component: BioinsumosComponent, title: 'Lista de Bioinsumos | Portal Bioinsumos' },
  // {
  //   path: 'lista-bioinsumos-api',
  //   component: BioinsumosDisplayComponent,
  //   title: 'Bioinsumos da API | Portal Bioinsumos'
  // }
];