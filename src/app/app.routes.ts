// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LegislacaoComponent } from './components/legislacao/legislacao.component';
import { CatalogosComponent } from './components/catalogos/catalogos.component';
import { BioinsumosComponent } from './components/bioinsumos/bioinsumos.component';
import { InoculantesComponent } from './components/inoculantes/inoculantes.component'; // <--- IMPORTE AQUI
import { BioinsumosDisplayComponent } from './components/bioinsumos-display/bioinsumos-display.component';
import { GraficosComponent } from './components/graficos/graficos.component';


export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, title: 'Página Inicial | Portal Bioinsumos' },
  { path: 'legislacao', component: LegislacaoComponent, title: 'Legislação | Portal Bioinsumos' },
  {
    path: 'catalogos',
    component: CatalogosComponent,
    title: 'Catálogos de Bioinsumos | Portal Bioinsumos'
  },
  { path: 'biodefensivos', component: BioinsumosComponent, title: 'Catálogo de Biodefensivos e Controle | Portal Bioinsumos' },
  {
    path: 'bioestimulantes', // <--- NOVA ROTA ADICIONADA
    component: InoculantesComponent,
    title: 'Catálogo de Bioestimulantes e Inoculantes | Portal Bioinsumos'
  },
  {
    path: 'lista-bioinsumos-api',
    component: BioinsumosDisplayComponent,
    title: 'Bioinsumos da API | Portal Bioinsumos'
  },
  {
    path: 'graficos',
    component: GraficosComponent ,
    title: 'Gráficos | Portal Bioinsumos'
  }
];