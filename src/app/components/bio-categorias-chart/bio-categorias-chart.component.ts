import { Component, Input, OnInit, OnChanges, SimpleChanges, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
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

  @Input() dados: any[] = []; // Recebe os dados do componente pai

  public chartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public chartOptions!: ChartOptions<'bar'>;

  public isMobile = false;
  private isBrowser: boolean;

  private readonly chartColor = '#78C655';
  private readonly borderRadiusConfig = {
    topLeft: 8,
    topRight: 8,
    bottomLeft: 0,
    bottomRight: 0
  };

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
          contagem[cat] = (contagem[cat] || 0) + 1;
        });
      }
    });

    const valores = Object.values(contagem);
    const maxY = Math.ceil(Math.max(...valores) * 1.2);

    this.chartData = {
      labels: Object.keys(contagem),
      datasets: [{
        data: valores,
        backgroundColor: this.chartColor,
        borderRadius: this.borderRadiusConfig,
        borderSkipped: false
      }]
    };

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 600,
        easing: 'easeOutQuart'
      },
      layout: {
        padding: { top: 40, bottom: this.isMobile ? 90 : 40 }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          bodyFont: { size: 13 },
          titleFont: { size: 14, weight: 'bold' },
          padding: 10,
          displayColors: false
        },
        datalabels: {
          anchor: 'end',
          align: 'top',
          backgroundColor: 'rgba(0,0,0,0.65)',
          borderRadius: 6,
          padding: 4,
          color: '#fff',
          font: { size: 12, weight: 'bold' }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 11, family: 'Roboto' },
            padding: 6,
            autoSkip: false,
            maxRotation: this.isMobile ? 90 : 90,
            minRotation: this.isMobile ? 90 : 90,
            callback: function (value) {
              const label = String(this.getLabelForValue(Number(value)));
              const maxLen = 18;
              const words = label.split(" ");
              let lines = [];
              let line = "";
              for (const w of words) {
                const test = line ? line + " " + w : w;
                if (test.length <= maxLen) line = test;
                else { if (line) lines.push(line); line = w; }
              }
              if (line) lines.push(line);
              return lines;
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.08)' },
          ticks: {
            font: { size: 12 }
          },
          title: {
            display: true,
            text: 'Quantidade',
            font: { size: 14, weight: 'bold' }
          }
        }
      }
    };
  }
}
