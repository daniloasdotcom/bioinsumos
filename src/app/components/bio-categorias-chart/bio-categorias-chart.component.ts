import { Component, Input, OnInit, OnChanges, SimpleChanges, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions, Chart, ScriptableContext } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(ChartDataLabels);

@Component({
  selector: 'bio-categorias-chart',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './bio-categorias-chart.component.html',
  styleUrls: ['./bio-categorias-chart.component.scss']
})
export class BioCategoriasChartComponent implements OnInit, OnChanges {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
  @Input() dados: any[] = [];

  public chartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public chartOptions!: ChartOptions<'bar'>;

  public isMobile = false;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: any) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.isMobile = window.innerWidth < 768;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dados'] && this.dados && this.dados.length > 0) {
      this.prepararGrafico();
    }
  }

  private prepararGrafico(): void {
    const contagem: Record<string, number> = {};

    this.dados.forEach(item => {
      if (item.classe_categoria_agronomica?.length) {
        item.classe_categoria_agronomica.forEach((cat: string) => {
          // Remove espaços extras e padroniza
          const cleanCat = cat.trim(); 
          contagem[cleanCat] = (contagem[cleanCat] || 0) + 1;
        });
      }
    });

    // 1. ORDENAÇÃO: Transforma em array e ordena do maior para o menor
    const sortedEntries = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
    
    const labels = sortedEntries.map(e => e[0]);
    const valores = sortedEntries.map(e => e[1]);

    // Configuração para Gradiente (Opcional, mas bonito)
    const getGradient = (context: ScriptableContext<'bar'>) => {
      const ctx = context.chart.ctx;
      const gradient = ctx.createLinearGradient(0, 0, context.chart.width, 0);
      gradient.addColorStop(0, '#78C655'); // Cor original
      gradient.addColorStop(1, '#5da63e'); // Um tom um pouco mais escuro
      return gradient;
    };

    this.chartData = {
      labels: labels,
      datasets: [{
        data: valores,
        backgroundColor: getGradient, // Usa gradiente ou volte para '#78C655'
        hoverBackgroundColor: '#4a8f30',
        // Ajusta borda para barras horizontais (arredonda a ponta direita)
        borderRadius: { topLeft: 0, bottomLeft: 0, topRight: 6, bottomRight: 6 },
        borderSkipped: false,
        barPercentage: 0.7, // Barras um pouco mais finas e elegantes
        categoryPercentage: 0.9
      }]
    };

    this.chartOptions = {
      // 2. MUDANÇA ESTRUTURAL: Eixo Y vira o índice (Barra Horizontal)
      indexAxis: 'y', 
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { right: 30, left: 0 } // Espaço para o label do valor
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#333',
          bodyColor: '#666',
          borderColor: '#ddd',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            title: (items) => items[0].label, // Mostra o nome completo
          }
        },
        datalabels: {
          anchor: 'end',
          align: 'end', // Coloca o número DEPOIS da barra
          offset: 4,
          backgroundColor: '#ebf5e6', // Fundo claro para contraste
          borderRadius: 4,
          padding: { top: 2, bottom: 2, left: 6, right: 6 },
          color: '#000000',
          font: { size: 11, weight: 'bold' },
          formatter: (value) => value // Apenas o número
        }
      },
      scales: {
        x: {
          position: 'top', // Opcional: coloca a régua numérica em cima ou tira
          display: false, // Oculta o eixo X numérico (limpa o visual)
          grid: { display: false }
        },
        y: {
          grid: { 
            display: false // Remove linhas de grade horizontais
          },
          ticks: {
            font: { size: 12, family: 'Roboto', weight: 500 },
            color: '#000000',
            autoSkip: false,
            // Não precisa mais daquela função complexa de quebra de linha!
            mirror: false 
          }
        }
      }
    };
  }
}