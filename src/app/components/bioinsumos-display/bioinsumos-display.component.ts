// src/app/components/bioinsumos-display/bioinsumos-display.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmbrapaBioinsumosService, FiltrosBioinsumos, RespostaPaginada } from '../../services/embrapa-bioinsumos.service'; // Importar FiltrosBioinsumos e RespostaPaginada
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators'; // Adicionar map

@Component({
  selector: 'app-bioinsumos-display',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bioinsumos-display.component.html',
  styleUrls: ['./bioinsumos-display.component.scss']
})
export class BioinsumosDisplayComponent implements OnInit {
  // Removido: produtosBiologicos$: Observable<any[]> | undefined;
  // Removido: produtosOriginais: any[] = [];
  produtosFiltrados: any[] = []; // Continuamos usando este para o template

  filtros: FiltrosBioinsumos = { // Usando a interface para tipar os filtros
    q: '', // 'q' é o termo de busca geral que você mencionou
    marca_comercial: '',
    cultura: ''
    // page: 1 // Poderíamos adicionar o controle de página aqui
  };

  erroApi: string | null = null;
  isLoading: boolean = true;

  // Informações de paginação
  totalRegistros?: number;
  totalPaginas?: number;
  paginaAtual: number = 1; // Começamos na página 1

  constructor(private embrapaService: EmbrapaBioinsumosService) {}

  ngOnInit(): void {
    this.aplicarFiltrosEBuscar(); // Chama a busca inicial
  }

  aplicarFiltrosEBuscar(novaPagina?: number): void {
    this.isLoading = true;
    this.erroApi = null;

    if (novaPagina) {
      this.paginaAtual = novaPagina;
    }
    this.filtros.page = this.paginaAtual; // Adiciona a página atual aos filtros

    // Mapear os filtros do formulário para os parâmetros da API
    // O parâmetro "q" é para busca geral. "Produto" pode ser mapeado para "q" ou "marca_comercial".
    // Para esta implementação, vamos usar 'q' para o campo "Produto/Ingrediente".
    const apiFiltros: FiltrosBioinsumos = {
      q: this.filtros.q, // Usando 'q' para o filtro de "Produto/Ingrediente"
      marca_comercial: this.filtros.marca_comercial,
      cultura: this.filtros.cultura,
      page: this.filtros.page
    };
    // Remover chaves de filtro vazias para não enviar parâmetros desnecessários
    Object.keys(apiFiltros).forEach(key => {
        const typedKey = key as keyof FiltrosBioinsumos;
        if (!apiFiltros[typedKey] || (typeof apiFiltros[typedKey] === 'string' && !(apiFiltros[typedKey] as string).trim())) {
            delete apiFiltros[typedKey];
        }
    });


    this.embrapaService.buscarProdutosBiologicos(apiFiltros).pipe(
      tap((resposta: RespostaPaginada<any>) => {
        this.produtosFiltrados = resposta.itens;
        this.totalRegistros = resposta.totalRegistros;
        this.totalPaginas = resposta.totalPaginas;
        // this.paginaAtual já está correta
        this.isLoading = false;
        console.log('Resposta da API (busca):', resposta);
      }),
      catchError(err => {
        console.error('Erro ao buscar produtos biológicos no componente:', err);
        this.erroApi = err.message || 'Ocorreu uma falha ao carregar os dados da API.';
        this.produtosFiltrados = [];
        this.isLoading = false;
        this.totalRegistros = 0;
        this.totalPaginas = 0;
        return of({ itens: [], totalRegistros: 0, totalPaginas: 0, registrosPorPagina: 0 });
      })
    ).subscribe(); // Precisamos nos inscrever para que a chamada HTTP seja feita
  }

  // Chamado quando os inputs de filtro mudam no HTML
  onFiltroChange(): void {
    this.paginaAtual = 1; // Resetar para a primeira página ao mudar os filtros de texto
    this.aplicarFiltrosEBuscar();
  }

  mudarPagina(novaPagina: number): void {
    if (novaPagina >= 1 && (!this.totalPaginas || novaPagina <= this.totalPaginas)) {
      this.aplicarFiltrosEBuscar(novaPagina);
    }
  }
}