import { Component, Input, OnChanges, SimpleChanges, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions, Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(ChartDataLabels);

type TipoOrdenacao = 'quantidade' | 'alfabetica';

@Component({
  selector: 'bio-cat-ingred-chart',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './bio-cat-ingred-chart.component.html',
  styleUrls: ['./bio-cat-ingred-chart.component.scss']
})
export class BioCatIngredChartComponent implements OnChanges {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
  @Input() dados: any[] = [];

  public categoriasDisponiveis: string[] = [];
  public categoriaSelecionada: string = '';
  
  // NOVA PROPRIEDADE DE CONTROLE
  public ordenacaoAtual: TipoOrdenacao = 'quantidade'; 

  public chartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public chartOptions!: ChartOptions<'bar'>;
  public hasData = false;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: any) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dados'] && this.dados && this.dados.length > 0) {
      this.extrairCategorias();
      this.iniciarOpcoesGrafico();

      if (this.categoriasDisponiveis.length > 0 && !this.categoriaSelecionada) {
        this.categoriaSelecionada = this.categoriasDisponiveis[0];
        this.processarDados();
      }
    }
  }

  // --- MÉTODOS DE EVENTO ---

  public onCategoriaChange(event: any): void {
    this.categoriaSelecionada = event.target.value;
    this.processarDados();
  }

  public onOrdenacaoChange(event: any): void {
    this.ordenacaoAtual = event.target.value as TipoOrdenacao;
    this.processarDados(); // Recalcula o gráfico com a nova ordem
  }

  // --- LÓGICA PRINCIPAL ---

  private processarDados(): void {
    if (!this.categoriaSelecionada) return;

    const contagem: Record<string, number> = {};

    // 1. Filtra e Conta
    const itensFiltrados = this.dados.filter(item => 
      item.classe_categoria_agronomica?.includes(this.categoriaSelecionada)
    );

    itensFiltrados.forEach(item => {
      const ingredientes = this.extrairIngredientesDoItem(item);
      ingredientes.forEach(nome => {
        contagem[nome] = (contagem[nome] || 0) + 1;
      });
    });

    let entries = Object.entries(contagem);

    // 2. APLICA A ORDENAÇÃO ESCOLHIDA
    if (this.ordenacaoAtual === 'quantidade') {
      // Maior para o menor (Numérico)
      entries.sort((a, b) => b[1] - a[1]);
    } else {
      // A a Z (Alfabético)
      entries.sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));
    }

    // 3. Pega os Top 15 (ou os primeiros 15 alfabéticos)
    // Se quiser mostrar TODOS quando for A-Z, aumente o slice ou remova-o condicionalmente.
    // Por enquanto, mantive 15 para não quebrar o layout.
    const sortedEntries = entries.slice(0, 15);

    this.hasData = sortedEntries.length > 0;

    if (this.hasData) {
      this.chartData = {
        labels: sortedEntries.map(e => e[0]),
        datasets: [{
          data: sortedEntries.map(e => e[1]),
          backgroundColor: '#36A2EB',
          hoverBackgroundColor: '#2486c9',
          borderRadius: { topRight: 4, bottomRight: 4, topLeft: 0, bottomLeft: 0 },
          barPercentage: 0.7
        }]
      };
      if (this.chart) this.chart.update();
    }
  }

  private extrairCategorias(): void {
    const mapContagem = new Map<string, number>();
    this.dados.forEach(item => {
      if (item.classe_categoria_agronomica?.length) {
        item.classe_categoria_agronomica.forEach((c: string) => {
          const cat = c.trim();
          mapContagem.set(cat, (mapContagem.get(cat) || 0) + 1);
        });
      }
    });
    this.categoriasDisponiveis = Array.from(mapContagem.keys())
      .sort((a, b) => (mapContagem.get(b) || 0) - (mapContagem.get(a) || 0));
  }

  private extrairIngredientesDoItem(item: any): string[] {
    let listaBruta: any[] = [];
    if (item.ingrediente_ativo_detalhado && Array.isArray(item.ingrediente_ativo_detalhado) && item.ingrediente_ativo_detalhado.length > 0) {
       listaBruta = item.ingrediente_ativo_detalhado.map((d: any) => d?.ingrediente_ativo);
    } else if (item.ingrediente_ativo) {
       listaBruta = Array.isArray(item.ingrediente_ativo) ? item.ingrediente_ativo : [item.ingrediente_ativo];
    }
    return listaBruta
      .map(str => String(str || ''))
      .map(txt => {
        let clean = txt.replace(/\s*\(\s*[\d\.,]+\s*.*?\)/g, '');
        clean = clean.replace(/\s*\((?:Produto|Biológico|aldeído|isolado|inseticida|fungicida|bactericida|microbiológico).*?\)/gi, '');
        clean = clean.replace(/(?:,|\s+)(?:cepa|isolado|estirpe|strain|variedade).*$/i, '').trim();
        if (clean.endsWith(',')) clean = clean.slice(0, -1).trim();
        return clean;
      })
      .filter(s => s && s.length > 2);
  }

  private iniciarOpcoesGrafico(): void {
    this.chartOptions = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: this.isBrowser ? window.devicePixelRatio : 1,
      layout: { padding: { right: 40, left: 0 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#000',
          bodyColor: '#444',
          borderColor: '#ddd',
          borderWidth: 1,
          displayColors: false
        },
        datalabels: {
          anchor: 'end',
          align: 'end',
          offset: 4,
          color: '#000000',
          font: { size: 11, weight: 'bold' },
          formatter: (value) => value
        }
      },
      scales: {
        x: { display: false },
        y: { 
          grid: { display: false },
          ticks: { color: '#000000', font: { size: 12, weight: 500, family: 'Roboto' }, autoSkip: false }
        }
      }
    };
  }
}