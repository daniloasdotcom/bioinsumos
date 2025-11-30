import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ApiBioinsumo {
  marca_comercial?: string[];
  classe_categoria_agronomica?: string[];
  indicacao_uso?: {
    cultura?: string;
    praga_nome_cientifico?: string;
    praga_nome_comum?: string[] | string;
    [key: string]: any;
  }[];
  [key: string]: any; 
}

interface BioinsumoDisplay {
  nome: string;
  categorias: string[];
  cultura: string;
  alvo: string;
  originalData: ApiBioinsumo;
  expandido?: boolean;
}

interface PragaDisplay {
  nome: string;
  cientifico?: string;
}

@Component({
  selector: 'app-busca-guiada',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './busca-guiada.component.html',
  styleUrls: ['./busca-guiada.component.scss']
})
export class BuscaGuiadaComponent implements OnInit {
  
  todosProdutos: BioinsumoDisplay[] = [];
  passoAtual: number = 1;
  isLoading: boolean = true;

  // Listas de Seleção
  culturasDisponiveis: string[] = [];
  pragasEspecificas: PragaDisplay[] = [];
  pragasGerais: PragaDisplay[] = [];

  // Listas de Produtos
  produtosEspecificos: BioinsumoDisplay[] = [];
  produtosGerais: BioinsumoDisplay[] = [];

  // Seleções e Filtros
  culturaSelecionada: string = '';
  pragaSelecionada: string = '';
  filtroTextoBotao: string = ''; 

  // --- CONTROLE DOS ACORDEÕES (PASSO 2) ---
  exibirPragasEspecificas: boolean = true; // Padrão: Aberto
  exibirPragasGerais: boolean = false;     // Padrão: Fechado
  // ----------------------------------------

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados() {
    this.isLoading = true;
    this.http.get<ApiBioinsumo[]>('assets/todos_bioinsumos.json').subscribe({
      next: (data) => {
        this.todosProdutos = data.map(item => this.mapearParaDisplay(item));
        this.extrairCulturasUnicas();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar JSON:', err);
        this.isLoading = false;
      }
    });
  }

  private mapearParaDisplay(apiItem: ApiBioinsumo): BioinsumoDisplay {
    const nome = apiItem.marca_comercial?.[0] || 'Nome Indisponível';
    const categorias = (apiItem.classe_categoria_agronomica && apiItem.classe_categoria_agronomica.length > 0) ? [...apiItem.classe_categoria_agronomica] : ['Geral'];
    
    let cultura = 'Não especificada';
    if (apiItem.indicacao_uso && apiItem.indicacao_uso.length > 0) {
      const culturasUnicas = [...new Set(apiItem.indicacao_uso.map(iu => iu.cultura).filter(c => !!c))];
      cultura = culturasUnicas.length > 0 ? culturasUnicas.join(', ') : 'Todas as culturas';
    }

    let alvo = 'Não especificado';
    if (apiItem.indicacao_uso && apiItem.indicacao_uso.length > 0) {
      const alvosUnicos = new Set<string>();
      apiItem.indicacao_uso.forEach(iu => {
        let nomesComuns: string[] = [];
        if (iu.praga_nome_comum) {
          if (Array.isArray(iu.praga_nome_comum)) nomesComuns = iu.praga_nome_comum;
          else if (typeof iu.praga_nome_comum === 'string') nomesComuns = [iu.praga_nome_comum];
        }
        nomesComuns.forEach(pnc => { if (pnc) alvosUnicos.add(pnc); });
        if (nomesComuns.length === 0 && iu.praga_nome_cientifico) alvosUnicos.add(iu.praga_nome_cientifico);
      });
      alvo = alvosUnicos.size > 0 ? Array.from(alvosUnicos).join(', ') : 'Diversos';
    }

    return { nome, categorias, cultura, alvo, originalData: apiItem, expandido: false };
  }

  extrairCulturasUnicas() {
    const setCulturas = new Set<string>();
    this.todosProdutos.forEach(p => {
      p.originalData.indicacao_uso?.forEach(uso => {
        if (uso.cultura) setCulturas.add(uso.cultura.trim());
      });
    });
    this.culturasDisponiveis = Array.from(setCulturas).sort((a, b) => a.localeCompare(b));
  }

  escolherCultura(cultura: string) {
    this.culturaSelecionada = cultura;
    this.extrairPragasDaCultura(cultura);
    this.filtroTextoBotao = ''; 
    this.passoAtual = 2;
    
    // Resetar estados dos acordeões ao entrar na tela
    this.exibirPragasEspecificas = true;
    this.exibirPragasGerais = false;
    
    window.scrollTo(0, 0);
  }

  extrairPragasDaCultura(culturaAlvo: string) {
    const mapPragasEsp = new Map<string, string>();
    const mapPragasGer = new Map<string, string>();
    
    const culturaAlvoNormalizada = culturaAlvo.toLowerCase().trim();

    this.todosProdutos.forEach(p => {
      p.originalData.indicacao_uso?.forEach(uso => {
        
        const culturaProduto = uso.cultura ? uso.cultura.toLowerCase().trim() : '';
        const ehEspecifico = culturaProduto === culturaAlvoNormalizada;
        const ehGeral = culturaProduto === 'todas as culturas';

        if (ehEspecifico || ehGeral) {
          let nomes: string[] = Array.isArray(uso.praga_nome_comum) ? uso.praga_nome_comum : (uso.praga_nome_comum ? [uso.praga_nome_comum] : []);
          
          nomes.forEach(nomePraga => {
            if (nomePraga) {
               if (ehEspecifico) {
                 if (!mapPragasEsp.has(nomePraga)) mapPragasEsp.set(nomePraga, uso.praga_nome_cientifico || '');
               } else if (ehGeral) {
                 if (!mapPragasGer.has(nomePraga)) mapPragasGer.set(nomePraga, uso.praga_nome_cientifico || '');
               }
            }
          });
        }
      });
    });

    this.pragasEspecificas = Array.from(mapPragasEsp.entries())
      .map(([nome, cientifico]) => ({ nome, cientifico }))
      .sort((a, b) => a.nome.localeCompare(b.nome));

    this.pragasGerais = Array.from(mapPragasGer.entries())
      .map(([nome, cientifico]) => ({ nome, cientifico }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }

  escolherPraga(nomePraga: string) {
    this.pragaSelecionada = nomePraga;
    this.filtrarProdutosFinais();
    this.passoAtual = 3;
    window.scrollTo(0, 0);
  }

  filtrarProdutosFinais() {
    this.produtosEspecificos = [];
    this.produtosGerais = [];
    const culturaSelecionadaNorm = this.culturaSelecionada.toLowerCase().trim();

    this.todosProdutos.forEach(p => {
      let ehEspecifico = false;
      let ehGeral = false;

      p.originalData.indicacao_uso?.forEach(uso => {
        const culturaUso = uso.cultura ? uso.cultura.toLowerCase().trim() : '';
        
        let batePraga = false;
        if (Array.isArray(uso.praga_nome_comum)) {
          batePraga = uso.praga_nome_comum.includes(this.pragaSelecionada);
        } else {
          batePraga = uso.praga_nome_comum === this.pragaSelecionada;
        }

        if (batePraga) {
          if (culturaUso === culturaSelecionadaNorm) ehEspecifico = true;
          else if (culturaUso === 'todas as culturas') ehGeral = true;
        }
      });

      if (ehEspecifico) this.produtosEspecificos.push(p);
      else if (ehGeral) this.produtosGerais.push(p);
    });
  }

  toggleExpandir(bio: BioinsumoDisplay): void {
    bio.expandido = !bio.expandido;
  }

  // Métodos de Controle dos Acordeões (Passo 2)
  toggleEspecificos() {
    this.exibirPragasEspecificas = !this.exibirPragasEspecificas;
  }
  
  toggleGerais() {
    this.exibirPragasGerais = !this.exibirPragasGerais;
  }

  // UX: Ao digitar, abre tudo para facilitar a busca
  aoDigitarFiltro() {
    if (this.filtroTextoBotao.length > 0) {
        this.exibirPragasEspecificas = true;
        this.exibirPragasGerais = true;
    } else {
        // Se limpar, volta ao padrão
        this.exibirPragasEspecificas = true;
        this.exibirPragasGerais = false;
    }
  }

  voltar() {
    if (this.passoAtual > 1) {
      this.passoAtual--;
      this.filtroTextoBotao = '';
      
      // Se voltar para o passo 2, reseta os acordeões
      if (this.passoAtual === 2) {
          this.exibirPragasEspecificas = true;
          this.exibirPragasGerais = false;
      }
    }
  }

  reiniciar() {
    this.passoAtual = 1;
    this.culturaSelecionada = '';
    this.pragaSelecionada = '';
    this.filtroTextoBotao = '';
    this.produtosEspecificos = [];
    this.produtosGerais = [];
  }

  // --- GETTERS PARA FILTRAR OS BOTÕES ---
  get culturasFiltradasDisplay(): string[] {
    const termo = this.filtroTextoBotao.toLowerCase().trim();
    if (!termo) return this.culturasDisponiveis;
    return this.culturasDisponiveis.filter(c => c.toLowerCase().includes(termo));
  }

  get pragasEspecificasFiltradas(): PragaDisplay[] {
    const termo = this.filtroTextoBotao.toLowerCase().trim();
    if (!termo) return this.pragasEspecificas;
    return this.pragasEspecificas.filter(p => p.nome.toLowerCase().includes(termo));
  }

  get pragasGeraisFiltradas(): PragaDisplay[] {
    const termo = this.filtroTextoBotao.toLowerCase().trim();
    if (!termo) return this.pragasGerais;
    return this.pragasGerais.filter(p => p.nome.toLowerCase().includes(termo));
  }
}