import { Component, OnInit, Inject, PLATFORM_ID, ViewChildren, QueryList, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions, Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { BioCategoriasChartComponent } from '../bio-categorias-chart/bio-categorias-chart.component';
import { BioCatIngredChartComponent } from '../bio-cat-ingred-chart/bio-cat-ingred-chart.component';

Chart.register(ChartDataLabels);

// Interface para estruturar os dados extraídos de cada ingrediente
interface InfoIngrediente {
  nomeLimpo: string;    // Ex: Trichoderma harzianum
  variacao: string;     // Ex: Cepa CCT 2160 (ou string vazia se não houver)
  nomeCompleto: string; // Texto original limpo para referência
}

@Component({
  selector: 'app-graficos',
  standalone: true,
  imports: [CommonModule, NgChartsModule, FormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule, BioCategoriasChartComponent, BioCatIngredChartComponent],
  templateUrl: './graficos.component.html',
  styleUrl: './graficos.component.scss'
})
export class GraficosComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>;

  // --- DADOS DOS GRÁFICOS ---
  public inocChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public especieChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public ingredienteChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  

  // --- OPÇÕES DOS GRÁFICOS ---
  public inocChartOptions!: ChartOptions<'bar'>;
  public especieChartOptions!: ChartOptions<'bar'>;
  public ingredienteChartOptions!: ChartOptions<'bar'>;

  // --- VARIÁVEIS DE CONTROLE ---
  public isBrowser: boolean;
  public isMobile: boolean = false;
  private observer!: IntersectionObserver;

  // --- DADOS BRUTOS ---
  public dadosInoculantes: any[] = [];
  public dadosBioinsumos: any[] = [];


  // --- FILTROS DE ESPÉCIE (INOCULANTES) ---
  public tiposDisponiveis: string[] = [];
  public tipoSelecionado: string = '';

  // --- FILTROS HIERÁRQUICOS (INGREDIENTES BIOINSUMOS) ---
  public ingredientesDisponiveis: string[] = []; // Lista de nomes limpos (Gênero + Espécie)
  public subtiposDisponiveis: string[] = [];     // Lista de cepas/isolados do ingrediente selecionado
  
  public ingredienteSelecionado: string = '';
  public subtipoSelecionado: string = '';        // '' significa "Todos os subtipos"

  // Mapa: Chave = Nome Limpo, Valor = Set de Variações (Subtipos)
  private mapaIngredientes = new Map<string, Set<string>>();

  // --- CONFIGURAÇÃO VISUAL ---
  private readonly borderRadiusConfig = { topLeft: 8, topRight: 8, bottomLeft: 0, bottomRight: 0 };
  private readonly chartColor = '#78C655';

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    if (this.isBrowser) {
      this.isMobile = window.innerWidth < 768;
    }
  }

  /**
   * Gera opções comuns para os gráficos, incluindo lógica de rotação mobile.
   */
  private getCommonOptions(applyRotation: boolean): ChartOptions<'bar'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 200,
      animation: false,
      layout: {
        padding: {
          top: 40,
          bottom: (applyRotation && this.isMobile) ? 80 : 40
        }
      },
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: '#000',
          rotation: (applyRotation && this.isMobile) ? -90 : 0,
          offset: (applyRotation && this.isMobile) ? 0 : 4,
          font: { weight: 'bold', family: 'Roboto, "Helvetica Neue", sans-serif' },
          clip: false,
          formatter: (value: number) => value.toLocaleString('pt-BR')
        }
      },
      scales: {
        x: {
          ticks: {
            autoSkip: false,
            maxRotation: (applyRotation && this.isMobile) ? 90 : 0,
            minRotation: (applyRotation && this.isMobile) ? 90 : 0,
            padding: 6,
            font: { size: 11, family: 'Roboto, "Helvetica Neue", sans-serif' },
            callback: function (value) {
              const label = String(this.getLabelForValue(Number(value)));
              if (applyRotation && window.innerWidth < 768) {
                return label.length > 25 ? label.substring(0, 22) + '...' : label;
              }
              const maxLen = 18;
              const words = label.split(' ');
              const lines: string[] = [];
              let line = '';
              for (const w of words) {
                const test = line ? line + ' ' + w : w;
                if (test.length <= maxLen) line = test;
                else { if (line) lines.push(line); line = w; }
              }
              if (line) lines.push(line);
              return lines;
            }
          }
        }
      }
    };
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.checkScreenSize();

    // ============================================================
    // 1. CARREGAMENTO BIOINSUMOS
    // ============================================================
    this.http.get<any[]>('assets/todos_bioinsumos.json').subscribe({
      next: (data) => {
        this.dadosBioinsumos = data; 

        // --- Gráfico 1: Distribuição Geral por Categoria ---
        const contagem: Record<string, number> = {};
        data.forEach(item => {
          if (item.classe_categoria_agronomica?.length) {
            item.classe_categoria_agronomica.forEach((cat: string) => {
              contagem[cat] = (contagem[cat] || 0) + 1;
            });
          }
        });

        const valores = Object.values(contagem);
        const maxY = Math.ceil(Math.max(...valores) * 1.2);

        // Prepara o filtro hierárquico para o gráfico de ingredientes
        this.prepararFiltrosHierarquicos();
      },
      error: (err) => console.error('[DEBUG] Erro ao carregar JSON Bioinsumos:', err)
    });

    // ============================================================
    // 2. CARREGAMENTO INOCULANTES
    // ============================================================
    this.http.get<any[]>('assets/todos_inoculantes.json').subscribe(data => {
      this.dadosInoculantes = data; 
      
      // --- Gráfico 3: Distribuição por Tipo ---
      const contagem: Record<string, number> = {};
      data.forEach(item => {
        if (item.tipo) contagem[item.tipo] = (contagem[item.tipo] || 0) + 1;
      });

      const valores = Object.values(contagem);
      const maxY = Math.ceil(Math.max(...valores) * 1.2);

      this.inocChartData = {
        labels: Object.keys(contagem),
        datasets: [{
          data: valores,
          backgroundColor: this.chartColor,
          borderRadius: this.borderRadiusConfig,
          borderSkipped: false
        }]
      };

      const options = this.getCommonOptions(false);
      this.inocChartOptions = {
        ...options,
        scales: {
          ...options.scales,
          y: {
            type: 'linear',
            beginAtZero: true,
            max: maxY,
            title: { display: true, text: 'Quantidade', font: { family: 'Roboto' } }
          }
        }
      };

      this.tiposDisponiveis = Array.from(new Set(data.map(item => item.tipo))).sort();
      this.atualizarEspecieChart();
    });
  }

  // ============================================================
  // LÓGICA DE EXTRAÇÃO E HIERARQUIA (INGREDIENTES)
  // ============================================================

  /**
   * Processa um item (produto) e extrai todos os ingredientes ativos,
   * separando o nome científico base de suas variações (cepas/isolados).
   */
  private extrairInfoIngredientes(item: any): InfoIngrediente[] {
    const resultados: InfoIngrediente[] = [];
    
    // 1. Prioriza o campo 'ingrediente_ativo_detalhado' se existir (mais limpo)
    let listaParaProcessar: string[] = [];
    
    if (item.ingrediente_ativo_detalhado && Array.isArray(item.ingrediente_ativo_detalhado) && item.ingrediente_ativo_detalhado.length > 0) {
       listaParaProcessar = item.ingrediente_ativo_detalhado
         .map((d: any) => d && d.ingrediente_ativo ? String(d.ingrediente_ativo) : '')
         .filter((s: string) => !!s);
    } else {
       // 2. Fallback para o campo bruto 'ingrediente_ativo'
       const raw = item.ingrediente_ativo;
       if (raw !== null && raw !== undefined) {
          const listaBruta = Array.isArray(raw) ? raw : [raw];
          // Limpeza básica de parênteses de concentração e grupos
          listaParaProcessar = listaBruta.map(str => {
            let txt = String(str);
            // Remove concentrações numéricas entre parênteses: (200 g/L), (.004 g/kg)
            txt = txt.replace(/\s*\(\s*[\d\.,]+\s*.*?\)/g, ''); 
            // Remove grupos descritivos irrelevantes, mas PRESERVA parênteses químicos curtos
            txt = txt.replace(/\s*\((?:Produto|Biológico|aldeído|isolado|inseticida|fungicida|bactericida|microbiológico).*?\)/gi, '');
            return txt.trim();
          });
       }
    }

    // Processa cada string limpa para separar Nome Base vs Variação
    listaParaProcessar.forEach(fullText => {
      if (!fullText || fullText.length < 2) return;

      // Regex que procura o ponto de corte onde começa a variação
      // Procura por vírgula ou espaço seguidos de palavras chave (Cepa, Isolado, etc)
      const regexCorte = /(?:,|\s+)(?:cepa|isolado|estirpe|strain|variedade).*$/i;
      
      let nomeLimpo = fullText.replace(regexCorte, '').trim();
      
      // Remove vírgula residual no final, se houver
      if (nomeLimpo.endsWith(',')) nomeLimpo = nomeLimpo.slice(0, -1).trim();

      let variacao = '';
      // Se o nome limpo for diferente do texto completo, a diferença é a variação
      if (nomeLimpo !== fullText) {
        // Extrai a parte da variação e remove caracteres de ligação do início
        variacao = fullText.substring(nomeLimpo.length).replace(/^[, \-]+/, '').trim();
      }

      resultados.push({
        nomeLimpo: nomeLimpo,
        variacao: variacao,
        nomeCompleto: fullText
      });
    });

    return resultados;
  }

  prepararFiltrosHierarquicos(): void {
    if (!this.dadosBioinsumos) return;

    this.mapaIngredientes.clear();

    this.dadosBioinsumos.forEach(item => {
      const infos = this.extrairInfoIngredientes(item);
      
      infos.forEach(info => {
        if (!this.mapaIngredientes.has(info.nomeLimpo)) {
          this.mapaIngredientes.set(info.nomeLimpo, new Set());
        }
        // Se houver variação, adiciona ao conjunto de variações deste ingrediente
        if (info.variacao) {
          this.mapaIngredientes.get(info.nomeLimpo)?.add(info.variacao);
        }
      });
    });

    // Converte as chaves do mapa para a lista do dropdown
    this.ingredientesDisponiveis = Array.from(this.mapaIngredientes.keys()).sort();
  }

  // Evento: Quando o usuário seleciona o ingrediente principal
  aoSelecionarIngrediente(): void {
    this.subtipoSelecionado = ''; // Reseta o subtipo
    this.subtiposDisponiveis = [];

    if (this.ingredienteSelecionado) {
      const setSubtipos = this.mapaIngredientes.get(this.ingredienteSelecionado);
      if (setSubtipos && setSubtipos.size > 0) {
        this.subtiposDisponiveis = Array.from(setSubtipos).sort();
      }
    }

    this.atualizarIngredienteChart();
  }

  // Evento: Quando o usuário seleciona um subtipo específico
  aoSelecionarSubtipo(): void {
    this.atualizarIngredienteChart();
  }

  atualizarIngredienteChart(): void {
    if (!this.ingredienteSelecionado) return;

    const contagem: Record<string, number> = {};

    this.dadosBioinsumos.forEach(item => {
      const infos = this.extrairInfoIngredientes(item);

      // Verifica se algum dos ingredientes deste produto corresponde à seleção
      const match = infos.some(info => {
        const mesmoIngrediente = info.nomeLimpo === this.ingredienteSelecionado;
        
        if (!mesmoIngrediente) return false;

        // Se nenhum subtipo foi selecionado (filtro vazio), aceita todos (agregação)
        if (!this.subtipoSelecionado) return true;

        // Se um subtipo foi selecionado, exige correspondência exata da variação
        return info.variacao === this.subtipoSelecionado;
      });

      if (match && item.classe_categoria_agronomica?.length) {
        item.classe_categoria_agronomica.forEach((cat: string) => {
          contagem[cat] = (contagem[cat] || 0) + 1;
        });
      }
    });

    const entries = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
    const labels = entries.map(([k]) => k);
    const valores = entries.map(([, v]) => v);
    const maxY = valores.length ? Math.ceil(Math.max(...valores) * 1.2) : 5;

    this.ingredienteChartData = {
      labels: labels,
      datasets: [{
        data: valores,
        backgroundColor: this.chartColor,
        borderRadius: this.borderRadiusConfig,
        borderSkipped: false
      }]
    };

    const options = this.getCommonOptions(true);
    this.ingredienteChartOptions = {
      ...options,
      scales: {
        ...options.scales,
        y: {
          type: 'linear',
          beginAtZero: true,
          max: maxY,
          title: { display: true, text: 'Quantidade', font: { family: 'Roboto' } }
        }
      }
    };
    setTimeout(() => {
      if (this.charts) {
        this.charts.forEach(child => {
          // Verifica se o gráfico existe e possui datasets (para não quebrar os outros)
          if (child.chart) {
             child.chart.update();
          }
        });
      }
    }, 0);
  }

  // ============================================================
  // GRÁFICO 4: INOCULANTES POR ESPÉCIE (MANTIDO)
  // ============================================================

  atualizarEspecieChart(): void {
    const contagem: Record<string, number> = {};

    const normalizar = (nome: string): string => {
      if (!nome) return nome;
      const partes = nome.trim().split(/\s+/);
      const genero = partes[0].charAt(0).toUpperCase() + partes[0].slice(1).toLowerCase();
      const resto = partes.slice(1).map(p => p.toLowerCase());
      return [genero, ...resto].join(' ');
    };

    this.dadosInoculantes
      .filter(item => !this.tipoSelecionado || item.tipo === this.tipoSelecionado)
      .forEach(item => {
        if (Array.isArray(item.especie) && item.especie.length) {
          item.especie.forEach((esp: string) => {
            const nome = normalizar(esp);
            contagem[nome] = (contagem[nome] || 0) + 1;
          });
        }
      });

    const entries = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
    const labels = entries.map(([k]) => k);
    const valores = entries.map(([, v]) => v);
    const maxY = valores.length ? Math.ceil(Math.max(...valores) * 1.2) : 10;

    this.especieChartData = {
      labels,
      datasets: [{
        data: valores,
        backgroundColor: this.chartColor,
        borderRadius: this.borderRadiusConfig,
        borderSkipped: false
      }]
    };

    // Configuração específica: sempre rotaciona X em 90 graus devido aos nomes longos
    this.especieChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 20, bottom: 120 } },
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: '#000',
          rotation: this.isMobile ? -90 : 0,
          offset: this.isMobile ? 0 : 4,
          font: { weight: 'bold', family: 'Roboto, "Helvetica Neue", sans-serif' },
          clip: false,
          formatter: (value: number) => value.toLocaleString('pt-BR')
        }
      },
      scales: {
        x: {
          ticks: {
            autoSkip: false,
            maxRotation: 90,
            minRotation: 90,
            font: { size: 11, family: 'Roboto, "Helvetica Neue", sans-serif' }
          }
        },
        y: {
          type: 'linear',
          beginAtZero: true,
          max: maxY,
          title: { display: true, text: 'Quantidade', font: { family: 'Roboto' } }
        }
      }
    };
  }

  // ============================================================
  // INTERSECTION OBSERVER (LAZY LOAD / RESIZE FIX)
  // ============================================================

  ngAfterViewInit(): void {
    if (!this.isBrowser || !('IntersectionObserver' in window)) return;
    const redrawChart = (chartDirective: BaseChartDirective) => {
      if (chartDirective.chart) {
        chartDirective.chart.resize();
        chartDirective.chart.update();
      }
    };
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const chartDirective = this.charts.find(c => c.chart!.canvas === element);
          if (chartDirective) {
            setTimeout(() => redrawChart(chartDirective), 100);
            this.observer.unobserve(element);
          }
        }
      });
    }, { rootMargin: '0px', threshold: 0.01 });
    this.charts.forEach(chartDirective => {
      if (chartDirective.chart && chartDirective.chart.canvas) {
        this.observer.observe(chartDirective.chart.canvas);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.observer) this.observer.disconnect();
  }
}