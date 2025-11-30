import { Component, Input, OnInit, OnChanges, SimpleChanges, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions, Chart } from 'chart.js';
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
  
  public hasData = false;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: any) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Inicialização básica se necessário
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
          const cleanCat = cat.trim();
          contagem[cleanCat] = (contagem[cleanCat] || 0) + 1;
        });
      }
    });

    const sortedEntries = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
    
    // Filtro de segurança (opcional, igual ao outro gráfico)
    // const topEntries = sortedEntries.slice(0, 15); 
    
    this.hasData = sortedEntries.length > 0;

    if (this.hasData) {
        const labels = sortedEntries.map(e => e[0]);
        const valores = sortedEntries.map(e => e[1]);

        this.chartData = {
          labels: labels,
          datasets: [{
            data: valores,
            // Cor sólida igual ao estilo do gráfico azul, mas em verde
            backgroundColor: '#4CAF50', 
            hoverBackgroundColor: '#43A047',
            // Borda arredondada apenas na direita (igual ao outro)
            borderRadius: { topRight: 4, bottomRight: 4, topLeft: 0, bottomLeft: 0 },
            barPercentage: 0.7, // Mantém a barra elegante
          }]
        };

        this.iniciarOpcoesGrafico();
    }
  }

  private iniciarOpcoesGrafico(): void {
    this.chartOptions = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      // --- O SEGREDO DA NITIDEZ ESTÁ AQUI ---
      devicePixelRatio: this.isBrowser ? window.devicePixelRatio : 1,
      // --------------------------------------
      layout: { 
        padding: { right: 40, left: 0 } 
      },
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
          color: '#000000', // Preto puro para máximo contraste
          font: { size: 11, weight: 'bold' },
          formatter: (value) => value
        }
      },
      scales: {
        x: { 
          display: false // Limpo, igual ao de ingredientes
        },
        y: { 
          grid: { display: false },
          ticks: { 
            color: '#000000', // Preto puro
            font: { size: 12, weight: 500, family: 'Roboto' }, // Peso 500 fica mais nítido que bold em alguns monitores
            autoSkip: false 
          }
        }
      }
    };
  }
}