import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LegislacaoComponent } from './components/legislacao/legislacao.component';
import { BioinsumosComponent } from './components/bioinsumos/bioinsumos.component'; // 1. IMPORTAR O NOVO COMPONENTE

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, title: 'Página Inicial | Portal Bioinsumos' },
  { path: 'legislacao', component: LegislacaoComponent, title: 'Legislação | Portal Bioinsumos' },
  { path: 'bioinsumos', component: BioinsumosComponent, title: 'Lista de Bioinsumos | Portal Bioinsumos' } // 2. ADICIONAR A NOVA ROTA
];