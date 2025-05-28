// src/app/components/inoculantes/inoculantes.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Interface para a estrutura de dados do JSON de inoculantes
interface ApiInoculante {
  uf?: string;
  razao_social?: string;
  registro_produto?: string;
  atividade?: string;
  tipo?: string;
  especie?: string[];
  data_registro?: string;
  garantia?: string;
  natureza_fisica?: string;
  cultura?: string;
  cultura_nome_cientifico?: string;
  [key: string]: any;
}

// Interface para a estrutura de dados que será usada no template HTML
interface InoculanteDisplay {
  nomePrincipal: string;
  razaoSocial: string;
  tipoProduto: string;
  especiesCompletas: string[];
  registro: string;
  culturas: string;
  originalData: ApiInoculante;
  expandido?: boolean;
}

@Component({
  selector: 'app-inoculantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inoculantes.component.html',
  styleUrls: ['./inoculantes.component.scss']
})
export class InoculantesComponent implements OnInit {
  private inoculantesTodos: InoculanteDisplay[] = [];
  inoculantesFiltradosPrincipal: InoculanteDisplay[] = [];
  inoculantesParaExibir: InoculanteDisplay[] = [];

  termoBusca: string = '';
  filtroTipo: string = ''; // string vazia significa "Todos os Tipos"

  tiposUnicos: string[] = [];

  paginaAtual: number = 1;
  itensPorPagina: number = 50;
  totalPaginasCalculado: number = 0;

  isLoading: boolean = true;
  erroCarregamento: string | null = null;
  primeiraBuscaRealizada: boolean = false; // Ainda útil para a mensagem "Nenhum inoculante encontrado..."

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.carregarInoculantesLocais();
  }

  carregarInoculantesLocais(): void {
    this.isLoading = true;
    this.http.get<ApiInoculante[]>('assets/todos_inoculantes.json').subscribe(
      (dataFromApi) => {
        this.inoculantesTodos = dataFromApi.map(apiItem => this.mapearParaDisplay(apiItem));
        this.extrairTiposUnicos();
        this.isLoading = false;
        // Chama para exibir todos os itens inicialmente e calcular paginação
        this.aplicarFiltrosEPopularPagina();
        // Como agora mostramos resultados no início, podemos considerar que a "primeira busca" já aconteceu
        // ou que não é mais necessário para controlar a visibilidade inicial da lista.
        // A flag ainda pode ser útil para a mensagem "Nenhum inoculante encontrado..."
        // this.primeiraBuscaRealizada = true; // Descomente se quiser que a seção de resultados apareça imediatamente
      },
      (error) => {
        console.error('Erro ao carregar o arquivo JSON de inoculantes:', error);
        this.erroCarregamento = 'Falha ao carregar dados dos inoculantes.';
        this.isLoading = false;
      }
    );
  }

  private mapearParaDisplay(apiItem: ApiInoculante): InoculanteDisplay {
    const especiesArray = (apiItem.especie && apiItem.especie.length > 0) ?
                          [...apiItem.especie] : ['Espécie não informada'];
    const nomePrincipal = especiesArray.join(' + ');
    const razaoSocial = apiItem.razao_social || 'Empresa não informada';
    const tipoProduto = apiItem.tipo || 'Tipo Indisponível';
    const cultura = apiItem.cultura || 'Não especificada';

    return {
      nomePrincipal,
      razaoSocial,
      tipoProduto,
      especiesCompletas: especiesArray,
      registro: apiItem.registro_produto || 'N/A',
      culturas: cultura,
      originalData: apiItem,
      expandido: false
    };
  }

  private extrairTiposUnicos(): void {
    const todosOsTiposSet = new Set<string>();
    this.inoculantesTodos.forEach(inoc => {
      if (inoc.tipoProduto && inoc.tipoProduto !== 'Tipo Indisponível') {
        todosOsTiposSet.add(inoc.tipoProduto);
      }
    });
    this.tiposUnicos = [...todosOsTiposSet].sort((a, b) => a.localeCompare(b));
  }

  onFiltroChange(): void {
    this.primeiraBuscaRealizada = true; // Qualquer interação com filtros marca que uma busca foi tentada
    this.paginaAtual = 1;
    this.aplicarFiltrosEPopularPagina();
  }

  aplicarFiltrosEPopularPagina(): void {
    const termoBuscaLower = this.termoBusca.toLowerCase().trim();
    const tipoSelecionado = this.filtroTipo; // string vazia para "Todos"

    // Começa com todos os inoculantes e vai aplicando os filtros
    let itensFiltrados = [...this.inoculantesTodos];

    // Aplica filtro de termo de busca geral
    if (termoBuscaLower) {
      itensFiltrados = itensFiltrados.filter(inoc =>
        (inoc.nomePrincipal.toLowerCase().includes(termoBuscaLower) ||
         inoc.razaoSocial.toLowerCase().includes(termoBuscaLower) ||
         inoc.registro.toLowerCase().includes(termoBuscaLower) ||
         inoc.culturas.toLowerCase().includes(termoBuscaLower) ||
         inoc.especiesCompletas.some(esp => esp.toLowerCase().includes(termoBuscaLower))
        )
      );
    }

    // Aplica filtro de tipo
    if (tipoSelecionado) { // Só filtra se um tipo específico for selecionado
      itensFiltrados = itensFiltrados.filter(inoc => inoc.tipoProduto === tipoSelecionado);
    }

    this.inoculantesFiltradosPrincipal = itensFiltrados;
    this.totalPaginasCalculado = Math.ceil(this.inoculantesFiltradosPrincipal.length / this.itensPorPagina);
    this.atualizarPaginaParaExibicao();
  }

  atualizarPaginaParaExibicao(): void {
    const startIndex = (this.paginaAtual - 1) * this.itensPorPagina;
    const endIndex = startIndex + this.itensPorPagina;
    this.inoculantesParaExibir = this.inoculantesFiltradosPrincipal.slice(startIndex, endIndex);
  }

  mudarPagina(novaPagina: number): void {
    if (novaPagina >= 1 && novaPagina <= this.totalPaginasCalculado) {
      this.paginaAtual = novaPagina;
      this.atualizarPaginaParaExibicao();
    }
  }

  toggleExpandir(inoc: InoculanteDisplay): void {
    inoc.expandido = !inoc.expandido;
  }

  limparTodosOsFiltros(): void {
    this.termoBusca = '';
    this.filtroTipo = '';
    this.primeiraBuscaRealizada = false; // Para que a mensagem "Nenhum resultado" não apareça indevidamente
                                       // e a mensagem "Utilize os filtros..." possa reaparecer se a lista ficar vazia.
                                       // No entanto, como queremos mostrar todos, vamos re-filtrar.
    this.paginaAtual = 1;
    this.aplicarFiltrosEPopularPagina(); // Com os filtros limpos, mostrará todos os inoculantes
  }

  get algumFiltroAtivo(): boolean {
    return !!this.termoBusca.trim() || !!this.filtroTipo;
  }

  // Métodos de download (baixarResultadosFiltradosJSON e baixarResultadosFiltradosTXT)
  // Adaptados para inoculantes.
  baixarResultadosFiltradosJSON(): void {
    if (this.inoculantesFiltradosPrincipal.length === 0) {
      alert('Não há inoculantes filtrados para baixar.');
      return;
    }
    const dadosParaBaixar = this.inoculantesFiltradosPrincipal.map(inoc => inoc.originalData);
    const nomeArquivo = 'inoculantes_filtrados.json';
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
    if (this.inoculantesFiltradosPrincipal.length === 0) {
      alert('Não há inoculantes filtrados para baixar.');
      return;
    }

    let conteudoTXT = `Relatório de Inoculantes Filtrados\n`;
    conteudoTXT += `Total de Inoculantes Encontrados: ${this.inoculantesFiltradosPrincipal.length}\n`;
    conteudoTXT += `Filtros Aplicados:\n`;
    conteudoTXT += `  Busca Geral: "${this.termoBusca || 'N/A'}"\n`;
    conteudoTXT += `  Tipo: "${this.filtroTipo || 'Todos'}"\n`;
    conteudoTXT += `Data da Geração: ${new Date().toLocaleString('pt-BR')}\n`;
    conteudoTXT += "==================================================\n\n";

    this.inoculantesFiltradosPrincipal.forEach((inoc, index) => {
      const original = inoc.originalData as ApiInoculante;
      conteudoTXT += `Inoculante ${index + 1}:\n`;
      conteudoTXT += `  Espécie(s) (Nome Principal): ${inoc.nomePrincipal}\n`;
      conteudoTXT += `  Empresa (Razão Social): ${inoc.razaoSocial}\n`;
      conteudoTXT += `  Tipo: ${inoc.tipoProduto}\n`;
      if (inoc.registro) {
        conteudoTXT += `  Registro do Produto: ${inoc.registro}\n`;
      }
      if (inoc.culturas && inoc.culturas !== 'Não especificada') {
        conteudoTXT += `  Cultura(s) Indicada(s): ${inoc.culturas}\n`;
      }
      if (original.uf) {
        conteudoTXT += `  UF: ${original.uf}\n`;
      }
      if (original.atividade) {
        conteudoTXT += `  Atividade: ${original.atividade}\n`;
      }
      if (original.data_registro) {
        conteudoTXT += `  Data de Registro: ${new Date(original.data_registro).toLocaleDateString('pt-BR')}\n`;
      }
      if (original.garantia) {
        conteudoTXT += `  Garantia: ${original.garantia}\n`;
      }
      if (original.natureza_fisica) {
        conteudoTXT += `  Natureza Física: ${original.natureza_fisica}\n`;
      }
      if (original.cultura_nome_cientifico) {
        conteudoTXT += `  Nome Científico da Cultura: ${original.cultura_nome_cientifico}\n`;
      }
      conteudoTXT += "--------------------------------------------------\n\n";
    });

    const nomeArquivo = 'inoculantes_filtrados.txt';
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