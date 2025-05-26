// src/app/components/bioinsumos/bioinsumos.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Para *ngFor, *ngIf, etc.
import { FormsModule } from '@angular/forms';   // Para [(ngModel)] no futuro

@Component({
  selector: 'app-bioinsumos',
  standalone: true,
  imports: [
    CommonModule, // Adicionado
    FormsModule   // Adicionado
  ],
  templateUrl: './bioinsumos.component.html',
  styleUrl: './bioinsumos.component.scss'
})
export class BioinsumosComponent {
  // No futuro:
  // termoBusca: string = '';
  // listaCompletaBioinsumos: any[] = []; // Virá de um serviço
  // listaFiltradaBioinsumos: any[] = [];

  constructor() {
    // No futuro, carregar dados aqui ou no ngOnInit
  }

  // No futuro:
  // buscarBioinsumos(): void {
  //   if (!this.termoBusca) {
  //     this.listaFiltradaBioinsumos = [...this.listaCompletaBioinsumos];
  //   } else {
  //     this.listaFiltradaBioinsumos = this.listaCompletaBioinsumos.filter(bioinsumo =>
  //       bioinsumo.nome.toLowerCase().includes(this.termoBusca.toLowerCase())
  //     );
  //   }
  // }
}