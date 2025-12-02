import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- INTERFACES ---

interface ApiBioinsumo {
  marca_comercial?: string[];
  classe_categoria_agronomica?: string[];
  indicacao_uso?: {
    cultura?: string;
    praga_nome_cientifico?: string;
    praga_nome_comum?: string[] | string;
    [key: string]: any;
  }[];
  // Index Signature para permitir acesso dinâmico no HTML (ex: originalData['url_agrofit'])
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
  
  // Dados Brutos
  todosProdutos: BioinsumoDisplay[] = [];
  
  // Estado da Aplicação
  passoAtual: number = 1;
  isLoading: boolean = true;

  // Listas de Seleção (Passo 1 e 2)
  culturasDisponiveis: string[] = [];
  pragasEspecificas: PragaDisplay[] = [];
  pragasGerais: PragaDisplay[] = [];

  // Listas de Produtos (Passo 3)
  produtosEspecificos: BioinsumoDisplay[] = [];
  produtosGerais: BioinsumoDisplay[] = [];

  // Seleções do Usuário e Filtros
  culturaSelecionada: string = '';
  pragaSelecionada: string = '';
  filtroTextoBotao: string = ''; 

  // Controle dos Acordeões (Passo 2)
  exibirPragasEspecificas: boolean = true; // Padrão: Aberto
  exibirPragasGerais: boolean = false;     // Padrão: Fechado

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  // --- CARREGAMENTO DE DADOS ---
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
    
    // Formata string de culturas
    let cultura = 'Não especificada';
    if (apiItem.indicacao_uso && apiItem.indicacao_uso.length > 0) {
      const culturasUnicas = [...new Set(apiItem.indicacao_uso.map(iu => iu.cultura).filter(c => !!c))];
      cultura = culturasUnicas.length > 0 ? culturasUnicas.join(', ') : 'Todas as culturas';
    }

    // Formata string de alvos
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

  // --- LÓGICA PASSO 1: CULTURAS ---
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
    
    // Reset visual passo 2
    this.exibirPragasEspecificas = true;
    this.exibirPragasGerais = false;
    
    window.scrollTo(0, 0);
  }

  // --- LÓGICA PASSO 2: PRAGAS SEGMENTADAS ---
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

  // --- CONTROLE DOS ACORDEÕES PASSO 2 ---
  toggleEspecificos() {
    this.exibirPragasEspecificas = !this.exibirPragasEspecificas;
  }
  
  toggleGerais() {
    this.exibirPragasGerais = !this.exibirPragasGerais;
  }

  aoDigitarFiltro() {
    // Se digitou, expande tudo para encontrar. Se limpou, volta ao padrão.
    if (this.filtroTextoBotao.length > 0) {
        this.exibirPragasEspecificas = true;
        this.exibirPragasGerais = true;
    } else {
        this.exibirPragasEspecificas = true;
        this.exibirPragasGerais = false;
    }
  }

  // --- LÓGICA PASSO 3: RESULTADOS SEGMENTADOS ---
  filtrarProdutosFinais() {
    this.produtosEspecificos = [];
    this.produtosGerais = [];
    const culturaSelecionadaNorm = this.culturaSelecionada.toLowerCase().trim();

    this.todosProdutos.forEach(p => {
      let ehEspecifico = false;
      let ehGeral = false;

      p.originalData.indicacao_uso?.forEach(uso => {
        const culturaUso = uso.cultura ? uso.cultura.toLowerCase().trim() : '';
        
        // Verifica Praga
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

  // --- FUNCIONALIDADE DE DOWNLOAD (TXT) ---
  baixarRelatorioTXT(): void {
    const totalProdutos = this.produtosEspecificos.length + this.produtosGerais.length;
    if (totalProdutos === 0) {
      alert('Não há resultados para baixar.');
      return;
    }
  
    let conteudo = `==================================================\n`;
    conteudo += `   RELATÓRIO DE DIAGNÓSTICO - PORTAL BIOINSUMOS\n`;
    conteudo += `==================================================\n\n`;
    
    conteudo += `Data da Emissão: ${new Date().toLocaleString('pt-BR')}\n`;
    conteudo += `Cultura Selecionada: ${this.culturaSelecionada}\n`;
    conteudo += `Alvo/Praga: ${this.pragaSelecionada}\n`;
    conteudo += `Total de Soluções Encontradas: ${totalProdutos}\n\n`;
  
    // Helper para formatar string do produto
    const adicionarProdutoAoTexto = (bio: any, index: number) => {
      const original = bio.originalData;
      let texto = `[${index}] ${bio.nome}\n`;
      texto += `    Categoria: ${bio.categorias.join(', ')}\n`;
      
      if (original['titular_registro']) texto += `    Titular: ${original['titular_registro']}\n`;
      if (original['numero_registro']) texto += `    Registro MAPA: ${original['numero_registro']}\n`;
      if (original['ingrediente_ativo']) texto += `    Ingrediente Ativo: ${original['ingrediente_ativo'].join('; ')}\n`;
      if (original['produto_agricultura_organica']) texto += `    Produto Orgânico: Sim\n`;
      if (original['url_agrofit']) texto += `    Link Agrofit: ${original['url_agrofit']}\n`;
      
      texto += `--------------------------------------------------\n`;
      return texto;
    };
  
    if (this.produtosEspecificos.length > 0) {
      conteudo += `\n>>> SEÇÃO 1: SOLUÇÕES ESPECÍFICAS PARA ${this.culturaSelecionada.toUpperCase()}\n`;
      conteudo += `--------------------------------------------------\n`;
      this.produtosEspecificos.forEach((bio, i) => {
        conteudo += adicionarProdutoAoTexto(bio, i + 1);
      });
    }
  
    if (this.produtosGerais.length > 0) {
      conteudo += `\n\n>>> SEÇÃO 2: SOLUÇÕES MULTICULTURAS (USO GERAL)\n`;
      conteudo += `--------------------------------------------------\n`;
      this.produtosGerais.forEach((bio, i) => {
        conteudo += adicionarProdutoAoTexto(bio, i + 1);
      });
    }
  
    conteudo += `\nGerado automaticamente por Portal Bioinsumos.`;
  
    const nomeArquivo = `relatorio_${this.culturaSelecionada}_${this.pragaSelecionada}.txt`.replace(/\s+/g, '_').toLowerCase();
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // --- NAVEGAÇÃO E UTILS ---
  voltar() {
    if (this.passoAtual > 1) {
      this.passoAtual--;
      this.filtroTextoBotao = '';
      
      // Reseta estado dos acordeões se voltar pro passo 2
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

  // Getters para filtragem visual dos botões
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