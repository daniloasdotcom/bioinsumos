// src/app/components/bioinsumos/bioinsumos.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Interface para a estrutura de dados do JSON de bioinsumos (produtos biológicos)
interface ApiBioinsumo {
  marca_comercial?: string[];
  classe_categoria_agronomica?: string[];
  indicacao_uso?: {
    cultura?: string;
    praga_nome_cientifico?: string;
    praga_nome_comum?: string[];
    [key: string]: any;
  }[];
  formulacao?: string;
  ingrediente_ativo?: string[];
  ingrediente_ativo_detalhado?: any[];
  numero_registro?: string;
  titular_registro?: string;
  produto_biologico?: boolean;
  modo_acao?: string[];
  tecnica_aplicacao?: string[] | null;
  classificacao_toxicologica?: string;
  classificacao_ambiental?: string;
  inflamavel?: boolean | null;
  corrosivo?: boolean | null;
  produto_agricultura_organica?: boolean;
  url_agrofit?: string;
  [key: string]: any;
}

// Interface para a estrutura de dados que será usada no template HTML
interface BioinsumoDisplay {
  nome: string;
  categorias: string[];
  cultura: string;
  alvo: string;
  descricao: string;
  originalData: ApiBioinsumo;
  expandido?: boolean;
}

@Component({
  selector: 'app-bioinsumos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bioinsumos.component.html',
  styleUrls: ['./bioinsumos.component.scss']
})
export class BioinsumosComponent implements OnInit {
  private bioinsumosTodos: BioinsumoDisplay[] = [];
  bioinsumosFiltradosPrincipal: BioinsumoDisplay[] = [];
  bioinsumosParaExibir: BioinsumoDisplay[] = [];

  // Filtros
  termoBusca: string = '';
  filtroCategoria: string = '';
  filtroPragaCientifica: string = '';
  filtroPragaComum: string = '';
  filtroApenasOrganicos: boolean = false;

  // Listas para dropdowns
  categoriasUnicas: string[] = [];
  pragasCientificasUnicas: string[] = [];
  pragasComunsUnicas: string[] = [];

  // Paginação
  paginaAtual: number = 1;
  itensPorPagina: number = 50;
  totalPaginasCalculado: number = 0;

  // Estados da UI
  isLoading: boolean = true;
  erroApi: string | null = null;
  primeiraBuscaRealizada: boolean = false; // Declarada e inicializada

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.carregarBioinsumosLocais();
  }

  carregarBioinsumosLocais(): void {
    this.isLoading = true;
    this.http.get<ApiBioinsumo[]>('assets/todos_bioinsumos.json').subscribe(
      (dataFromApi) => {
        this.bioinsumosTodos = dataFromApi.map(apiItem => this.mapearParaDisplay(apiItem));
        this.extrairFiltrosUnicos();
        this.isLoading = false;
        // Ao carregar, aplica os filtros (que estarão vazios), mostrando todos os produtos
        this.aplicarFiltrosEPopularPagina(); 
      },
      (error) => {
        console.error('Erro ao carregar o arquivo JSON de bioinsumos:', error);
        this.erroApi = 'Falha ao carregar dados dos bioinsumos. Verifique o console.';
        this.isLoading = false;
      }
    );
  }

  private mapearParaDisplay(apiItem: ApiBioinsumo): BioinsumoDisplay {
    const nome = apiItem.marca_comercial?.[0] || 'Nome Indisponível';
    const categorias = (apiItem.classe_categoria_agronomica && apiItem.classe_categoria_agronomica.length > 0) ?
                       [...apiItem.classe_categoria_agronomica] : ['Categoria Indisponível'];
    
    let cultura = 'Não especificada';
    if (apiItem.indicacao_uso && apiItem.indicacao_uso.length > 0) {
      const culturasUnicas = [...new Set(apiItem.indicacao_uso.map(iu => iu.cultura).filter(c => !!c))];
      cultura = culturasUnicas.length > 0 ? culturasUnicas.join(', ') : 'Não especificada';
    }

    let alvo = 'Não especificado';
    if (apiItem.indicacao_uso && apiItem.indicacao_uso.length > 0) {
      const alvosUnicos = new Set<string>();
      apiItem.indicacao_uso.forEach(iu => {
        if (iu.praga_nome_comum && iu.praga_nome_comum.length > 0) {
          iu.praga_nome_comum.forEach(pnc => { if (pnc) alvosUnicos.add(pnc); });
        } else if (iu.praga_nome_cientifico) {
          if (iu.praga_nome_cientifico) alvosUnicos.add(iu.praga_nome_cientifico);
        }
      });
      alvo = alvosUnicos.size > 0 ? Array.from(alvosUnicos).join(', ') : 'Não especificado';
    }

    const descricao = apiItem.formulacao || `Detalhes sobre ${nome}.`;

    return { 
      nome, 
      categorias, 
      cultura, 
      alvo, 
      descricao, 
      originalData: apiItem, 
      expandido: false 
    };
  }

  private extrairFiltrosUnicos(): void {
    const todasAsCategoriasSet = new Set<string>();
    const todasAsPragasCientificasSet = new Set<string>();
    const todasAsPragasComunsSet = new Set<string>();

    this.bioinsumosTodos.forEach(bio => {
      bio.categorias.forEach(cat => {
        if (cat && cat !== 'Categoria Indisponível') {
          todasAsCategoriasSet.add(cat);
        }
      });

      if (bio.originalData.indicacao_uso) {
        bio.originalData.indicacao_uso.forEach(indicacao => {
          if (indicacao.praga_nome_cientifico) {
            todasAsPragasCientificasSet.add(indicacao.praga_nome_cientifico);
          }
          if (indicacao.praga_nome_comum && indicacao.praga_nome_comum.length > 0) {
            indicacao.praga_nome_comum.forEach(pnc => {
              if (pnc) todasAsPragasComunsSet.add(pnc);
            });
          }
        });
      }
    });

    this.categoriasUnicas = [...todasAsCategoriasSet].sort((a, b) => a.localeCompare(b));
    this.pragasCientificasUnicas = [...todasAsPragasCientificasSet].sort((a, b) => a.localeCompare(b));
    this.pragasComunsUnicas = [...todasAsPragasComunsSet].sort((a, b) => a.localeCompare(b));
  }

  onFiltroChange(): void {
    // Qualquer mudança de filtro deve ser considerada uma ação de busca
    this.primeiraBuscaRealizada = true; 
    this.paginaAtual = 1;
    this.aplicarFiltrosEPopularPagina();
  }

  aplicarFiltrosEPopularPagina(): void {
    const termoBuscaLower = this.termoBusca.toLowerCase().trim();
    const categoriaSelecionada = this.filtroCategoria;
    const pragaCientificaSelecionada = this.filtroPragaCientifica;
    const pragaComumSelecionada = this.filtroPragaComum;
    const apenasOrganicosSelecionado = this.filtroApenasOrganicos;

    // Se todos os filtros estiverem "limpos" (string vazia ou false para o checkbox),
    // mostra todos os produtos. Caso contrário, aplica os filtros.
    if (!termoBuscaLower && !categoriaSelecionada && !pragaCientificaSelecionada && !pragaComumSelecionada && !apenasOrganicosSelecionado) {
      this.bioinsumosFiltradosPrincipal = [...this.bioinsumosTodos];
    } else {
      this.bioinsumosFiltradosPrincipal = this.bioinsumosTodos.filter(bio => {
        const original = bio.originalData as ApiBioinsumo;

        const matchTermoBusca = termoBuscaLower ?
          (bio.nome.toLowerCase().includes(termoBuscaLower) ||
           bio.cultura.toLowerCase().includes(termoBuscaLower) ||
           bio.alvo.toLowerCase().includes(termoBuscaLower) ||
           bio.categorias.some(cat => cat.toLowerCase().includes(termoBuscaLower)) ||
           (original.ingrediente_ativo as string[])?.some(ia => ia.toLowerCase().includes(termoBuscaLower)) ||
           bio.descricao.toLowerCase().includes(termoBuscaLower) ||
           (original.titular_registro && original.titular_registro.toLowerCase().includes(termoBuscaLower)) ||
           (original.numero_registro && original.numero_registro.toLowerCase().includes(termoBuscaLower))
          ) : true;

        const matchCategoria = categoriaSelecionada ?
          bio.categorias.includes(categoriaSelecionada)
          : true;
        
        const matchPragaCientifica = pragaCientificaSelecionada ?
          original.indicacao_uso?.some(iu => iu.praga_nome_cientifico === pragaCientificaSelecionada)
          : true;
        
        const matchPragaComum = pragaComumSelecionada ?
          original.indicacao_uso?.some(iu => iu.praga_nome_comum?.includes(pragaComumSelecionada))
          : true;

        const matchOrganico = apenasOrganicosSelecionado ?
          original.produto_agricultura_organica === true
          : true;

        return matchTermoBusca && matchCategoria && matchPragaCientifica && matchPragaComum && matchOrganico;
      });
    }
    this.totalPaginasCalculado = Math.ceil(this.bioinsumosFiltradosPrincipal.length / this.itensPorPagina);
    this.atualizarPaginaParaExibicao();
  }
  
  atualizarPaginaParaExibicao(): void {
    const startIndex = (this.paginaAtual - 1) * this.itensPorPagina;
    const endIndex = startIndex + this.itensPorPagina;
    this.bioinsumosParaExibir = this.bioinsumosFiltradosPrincipal.slice(startIndex, endIndex);
  }

  mudarPagina(novaPagina: number): void {
    if (novaPagina >= 1 && novaPagina <= this.totalPaginasCalculado) {
      this.paginaAtual = novaPagina;
      this.atualizarPaginaParaExibicao();
    }
  }

  toggleExpandir(bio: BioinsumoDisplay): void {
    bio.expandido = !bio.expandido;
  }

  limparTodosOsFiltros(): void {
    this.termoBusca = '';
    this.filtroCategoria = '';
    this.filtroPragaCientifica = '';
    this.filtroPragaComum = '';
    this.filtroApenasOrganicos = false;
    this.primeiraBuscaRealizada = true; // Garante que a lista completa seja mostrada após limpar
    this.paginaAtual = 1;
    this.aplicarFiltrosEPopularPagina(); 
  }

  get algumFiltroAtivo(): boolean {
    return !!this.termoBusca.trim() || 
           !!this.filtroCategoria ||
           !!this.filtroPragaCientifica ||
           !!this.filtroPragaComum ||
           this.filtroApenasOrganicos;
  }

  baixarResultadosFiltrados(): void { // JSON
    if (this.bioinsumosFiltradosPrincipal.length === 0) {
      alert('Não há resultados filtrados para baixar.');
      return;
    }
    const dadosParaBaixar = this.bioinsumosFiltradosPrincipal.map(bio => bio.originalData);
    const nomeArquivo = 'bioinsumos_filtrados.json';
    const tipoArquivo = 'application/json;charset=utf-8;';
    const dadosString = JSON.stringify(dadosParaBaixar, null, 2);
    const blob = new Blob([dadosString], { type: tipoArquivo });
    const url = URL.createObjectURL(blob);
    const linkDownload = document.createElement('a');
    linkDownload.href = url;
    linkDownload.setAttribute('download', nomeArquivo);
    document.body.appendChild(linkDownload);
    linkDownload.click();
    document.body.removeChild(linkDownload);
    URL.revokeObjectURL(url);
  }

  baixarResultadosFiltradosTXT(): void {
    if (this.bioinsumosFiltradosPrincipal.length === 0) {
      alert('Não há resultados filtrados para baixar.');
      return;
    }

    let conteudoTXT = `Relatório de Produtos Biológicos Filtrados\n`;
    conteudoTXT += `Total de Produtos Encontrados: ${this.bioinsumosFiltradosPrincipal.length}\n`;
    conteudoTXT += `Filtros Aplicados:\n`;
    conteudoTXT += `  Busca Geral: "${this.termoBusca || 'N/A'}"\n`;
    conteudoTXT += `  Categoria: "${this.filtroCategoria || 'Todas'}"\n`;
    conteudoTXT += `  Praga (Nome Científico): "${this.filtroPragaCientifica || 'Todas'}"\n`;
    conteudoTXT += `  Praga (Nome Comum): "${this.filtroPragaComum || 'Todas'}"\n`;
    conteudoTXT += `  Apenas Orgânicos: ${this.filtroApenasOrganicos ? 'Sim' : 'Não'}\n`;
    conteudoTXT += `Data da Geração: ${new Date().toLocaleString('pt-BR')}\n`;
    conteudoTXT += "==================================================\n\n";

    this.bioinsumosFiltradosPrincipal.forEach((bio, index) => {
      const original = bio.originalData as ApiBioinsumo;
      conteudoTXT += `Produto ${index + 1}:\n`;
      conteudoTXT += `  Nome Comercial: ${bio.nome}\n`;
      conteudoTXT += `  Categoria(s): ${bio.categorias.join(', ')}\n`;
      if (original.numero_registro) {
        conteudoTXT += `  Registro MAPA: ${original.numero_registro}\n`;
      }
      if (original.titular_registro) {
        conteudoTXT += `  Titular do Registro: ${original.titular_registro}\n`;
      }
      if (original.produto_agricultura_organica !== undefined) {
        conteudoTXT += `  Agricultura Orgânica: ${original.produto_agricultura_organica ? 'Sim' : 'Não'}\n`;
      }
      if (bio.cultura && bio.cultura !== 'Não especificada') {
        conteudoTXT += `  Culturas Indicadas: ${bio.cultura}\n`;
      }
      if (bio.alvo && bio.alvo !== 'Não especificado') {
        conteudoTXT += `  Alvo(s) Biológico(s): ${bio.alvo}\n`;
      }
      if (original.ingrediente_ativo && original.ingrediente_ativo.length > 0) {
        conteudoTXT += `  Ingrediente(s) Ativo(s) Principal(is): ${original.ingrediente_ativo.join('; ')}\n`;
      }
      if (original.url_agrofit) {
        conteudoTXT += `  Link Agrofit: ${original.url_agrofit}\n`;
      }
      conteudoTXT += "--------------------------------------------------\n\n";
    });

    const nomeArquivo = 'bioinsumos_filtrados_texto.txt';
    const tipoArquivo = 'text/plain;charset=utf-8;';
    const blob = new Blob([conteudoTXT], { type: tipoArquivo });
    const url = URL.createObjectURL(blob);
    const linkDownload = document.createElement('a');
    linkDownload.href = url;
    linkDownload.setAttribute('download', nomeArquivo);
    document.body.appendChild(linkDownload);
    linkDownload.click();
    document.body.removeChild(linkDownload);
    URL.revokeObjectURL(url);
  }
}