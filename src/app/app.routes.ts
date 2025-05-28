// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LegislacaoComponent } from './components/legislacao/legislacao.component';
import { CatalogosComponent } from './components/catalogos/catalogos.component';
import { BioinsumosComponent } from './components/bioinsumos/bioinsumos.component';
import { InoculantesComponent } from './components/inoculantes/inoculantes.component'; // <--- IMPORTE AQUI
import { BioinsumosDisplayComponent } from './components/bioinsumos-display/bioinsumos-display.component';


export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, title: 'Página Inicial | Portal Bioinsumos' },
  { path: 'legislacao', component: LegislacaoComponent, title: 'Legislação | Portal Bioinsumos' },
  {
    path: 'catalogos',
    component: CatalogosComponent,
    title: 'Catálogos de Bioinsumos | Portal Bioinsumos'
  },
  { path: 'bioinsumos', component: BioinsumosComponent, title: 'Catálogo de Produtos Biológicos | Portal Bioinsumos' },
  {
    path: 'inoculantes', // <--- NOVA ROTA ADICIONADA
    component: InoculantesComponent,
    title: 'Catálogo de Inoculantes | Portal Bioinsumos'
  },
  {
    path: 'lista-bioinsumos-api',
    component: BioinsumosDisplayComponent,
    title: 'Bioinsumos da API | Portal Bioinsumos'
  }
];