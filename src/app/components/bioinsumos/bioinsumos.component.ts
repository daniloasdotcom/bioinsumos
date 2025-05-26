import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http'; // 👈 IMPORTANTE!
import { BioinsumosService } from '../../services/bioinsumos.service';

@Component({
  selector: 'app-bioinsumos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule // 👈 ADICIONE AQUI
  ],
  templateUrl: './bioinsumos.component.html',
  styleUrl: './bioinsumos.component.scss'
})
export class BioinsumosComponent implements OnInit {
  termoBusca = '';
  bioinsumos: any[] = [];

  constructor(private bioService: BioinsumosService) {}

  ngOnInit(): void {
    this.bioService.getBioinsumos().subscribe(dados => {
      this.bioinsumos = dados.map(b => ({ ...b, expandido: false }));
    });
  }

  get bioinsumosFiltrados() {
    const termo = this.termoBusca.toLowerCase();
    return this.bioinsumos.filter(b =>
      b.nome.toLowerCase().includes(termo) ||
      b.cultura.toLowerCase().includes(termo) ||
      b.alvo.toLowerCase().includes(termo)
    );
  }

  toggleExpandir(bio: any) {
    bio.expandido = !bio.expandido;
  }
}
