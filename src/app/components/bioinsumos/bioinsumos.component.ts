// src/app/components/bioinsumos/bioinsumos.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Interface para a estrutura de dados esperada pelo seu HTML
interface BioinsumoDisplay {
  nome: string;
  categorias: string[];
  cultura: string;
  alvo: string;
  descricao: string;
  originalData: any; // Para manter os dados originais se necessário para exibição detalhada
  expandido?: boolean;
}

// Interface para a estrutura de um item do seu todos_bioinsumos.json
interface ApiBioinsumo {
  marca_comercial?: string[];
  classe_categoria_agronomica?: string[];
  indicacao_uso?: { cultura: string; praga_nome_comum: string[]; praga_nome_cientifico: string }[];
  formulacao?: string;
  ingrediente_ativo?: string[];
  ingrediente_ativo_detalhado?: any[];
  url_agrofit?: string;
  // As propriedades acessadas com colchetes (ex: numero_registro) são cobertas pela assinatura de índice
  [key: string]: any; // Permite outras propriedades
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

  termoBusca: string = '';
  filtroCategoria: string = '';

  categoriasUnicas: string[] = [];

  paginaAtual: number = 1;
  itensPorPagina: number = 50;
  totalPaginasCalculado: number = 0;

  isLoading: boolean = true;
  erroApi: string | null = null;
  primeiraBuscaRealizada: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.carregarBioinsumosLocais();
  }

  carregarBioinsumosLocais(): void {
    this.isLoading = true;
    this.http.get<ApiBioinsumo[]>('assets/todos_bioinsumos.json').subscribe(
      (dataFromApi) => {
        this.bioinsumosTodos = dataFromApi.map(apiItem => this.mapearParaDisplay(apiItem));
        this.extrairCategoriasUnicas();
        this.isLoading = false;
        console.log('Bioinsumos locais carregados:', this.bioinsumosTodos.length);
      },
      (error) => {
        console.error('Erro ao carregar o arquivo JSON de bioinsumos:', error);
        this.erroApi = 'Falha ao carregar dados dos bioinsumos.';
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
      const culturasUnicas = [...new Set(apiItem.indicacao_uso.map(iu => iu.cultura).filter(c => c))];
      cultura = culturasUnicas.length > 0 ? culturasUnicas.join(', ') : 'Não especificada';
    }
    let alvo = 'Não especificado';
    if (apiItem.indicacao_uso && apiItem.indicacao_uso.length > 0) {
      const alvosUnicos = new Set<string>();
      apiItem.indicacao_uso.forEach(iu => {
        (iu.praga_nome_comum && iu.praga_nome_comum.length > 0 ? iu.praga_nome_comum : [iu.praga_nome_cientifico]).forEach(pnc => {
            if(pnc) alvosUnicos.add(pnc);
        });
      });
      alvo = alvosUnicos.size > 0 ? Array.from(alvosUnicos).join(', ') : 'Não especificado';
    }
    const descricao = apiItem.formulacao || `Detalhes sobre ${nome}.`;
    return { nome, categorias, cultura, alvo, descricao, originalData: apiItem, expandido: false };
  }

  private extrairCategoriasUnicas(): void {
    const todasAsCategoriasSet = new Set<string>();
    this.bioinsumosTodos.forEach(bio => {
      bio.categorias.forEach(cat => {
        if (cat && cat !== 'Categoria Indisponível') {
          todasAsCategoriasSet.add(cat);
        }
      });
    });
    this.categoriasUnicas = [...todasAsCategoriasSet].sort((a, b) => a.localeCompare(b));
  }

  onFiltroChange(): void {
    if (this.termoBusca.trim() || this.filtroCategoria) {
      this.primeiraBuscaRealizada = true;
    }
    this.paginaAtual = 1;
    this.aplicarFiltrosEPopularPagina();
  }

  aplicarFiltrosEPopularPagina(): void {
    const termoBuscaLower = this.termoBusca.toLowerCase().trim();
    const categoriaSelecionada = this.filtroCategoria;

    if ((!this.primeiraBuscaRealizada && !termoBuscaLower && !categoriaSelecionada) ||
        (this.primeiraBuscaRealizada && !termoBuscaLower && !categoriaSelecionada)) {
      this.bioinsumosFiltradosPrincipal = [];
    } else {
      this.bioinsumosFiltradosPrincipal = this.bioinsumosTodos.filter(bio => {
        const matchTermoBusca = termoBuscaLower ?
          (bio.nome.toLowerCase().includes(termoBuscaLower) ||
           bio.cultura.toLowerCase().includes(termoBuscaLower) ||
           bio.alvo.toLowerCase().includes(termoBuscaLower) ||
           bio.categorias.some(cat => cat.toLowerCase().includes(termoBuscaLower)) ||
           (bio.originalData['ingrediente_ativo'] as string[])?.some(ia => ia.toLowerCase().includes(termoBuscaLower)) ||
           bio.descricao.toLowerCase().includes(termoBuscaLower)
          ) : true;
        const matchCategoria = categoriaSelecionada ?
          bio.categorias.includes(categoriaSelecionada)
          : true;
        return matchTermoBusca && matchCategoria;
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
    this.primeiraBuscaRealizada = false;
    this.paginaAtual = 1;
    this.aplicarFiltrosEPopularPagina();
  }

  get algumFiltroAtivo(): boolean {
    return !!this.termoBusca.trim() || !!this.filtroCategoria;
  }

  baixarResultadosFiltrados(): void { // Para JSON
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
    conteudoTXT += `Total de Produtos: ${this.bioinsumosFiltradosPrincipal.length}\n`;
    conteudoTXT += `Filtros Aplicados: Busca Geral="${this.termoBusca}", Categoria="${this.filtroCategoria || 'Todas'}"\n`;
    conteudoTXT += `Data da Geração: ${new Date().toLocaleString('pt-BR')}\n`;
    conteudoTXT += "==================================================\n\n";

    this.bioinsumosFiltradosPrincipal.forEach((bio, index) => {
      const original = bio.originalData as ApiBioinsumo;
      conteudoTXT += `Produto ${index + 1}:\n`;
      conteudoTXT += `  Nome Comercial: ${bio.nome}\n`;
      conteudoTXT += `  Categoria(s): ${bio.categorias.join(', ')}\n`;

      // Usando notação de colchetes para propriedades que podem não estar explícitas na interface ApiBioinsumo
      if (original['numero_registro']) {
        conteudoTXT += `  Registro MAPA: ${original['numero_registro']}\n`;
      }
      if (original['titular_registro']) {
        conteudoTXT += `  Titular do Registro: ${original['titular_registro']}\n`;
      }
      if (bio.descricao) {
        conteudoTXT += `  Descrição/Formulação: ${bio.descricao}\n`; // 'descricao' vem do objeto 'bio'
      }
      if (bio.cultura && bio.cultura !== 'Não especificada') {
        conteudoTXT += `  Culturas Indicadas: ${bio.cultura}\n`;
      }
      if (bio.alvo && bio.alvo !== 'Não especificado') {
        conteudoTXT += `  Alvo(s) Biológico(s): ${bio.alvo}\n`;
      }

      // 'ingrediente_ativo' está explícito na interface ApiBioinsumo, então original.ingrediente_ativo funcionaria,
      // mas usar colchetes é mais seguro se a interface mudar e ele cair sob o index signature.
      if (original['ingrediente_ativo'] && (original['ingrediente_ativo'] as string[]).length > 0) {
        conteudoTXT += `  Ingrediente(s) Ativo(s) Principal(is): ${(original['ingrediente_ativo'] as string[]).join('; ')}\n`;
      }

      if (original.ingrediente_ativo_detalhado && original.ingrediente_ativo_detalhado.length > 0) {
        conteudoTXT += `  Detalhes Específicos do(s) Ingrediente(s) Ativo(s):\n`;
        original.ingrediente_ativo_detalhado.forEach((det: any) => { // det pode ser tipado melhor se tivermos sua interface
          conteudoTXT += `    - ${det.ingrediente_ativo || 'N/A'}`; // Assumindo que 'det' tem 'ingrediente_ativo'
          if (det.concentracao && det.unidade_medida) {
            conteudoTXT += ` (${det.concentracao} ${det.unidade_medida})`;
          }
          if (det.percentual) {
            conteudoTXT += ` - ${det.percentual}%`;
          }
          if (det.grupo_quimico) {
            conteudoTXT += ` (Grupo Químico: ${det.grupo_quimico})`;
          }
          conteudoTXT += `\n`;
        });
      }
      if (original.url_agrofit) { // url_agrofit está explícito na interface
        conteudoTXT += `  Link Agrofit: ${original.url_agrofit}\n`;
      }
      conteudoTXT += "--------------------------------------------------\n\n";
    });

    const nomeArquivo = 'bioinsumos_filtrados.txt';
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