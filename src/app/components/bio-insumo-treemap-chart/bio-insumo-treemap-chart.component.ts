import { Component, Input, OnChanges, SimpleChanges, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions, Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Interface para organizar nossos múltiplos gráficos
interface GraficoConfig {
  titulo: string;
  dados: ChartData<'bar'>;
  opcoes: ChartOptions<'bar'>;
  altura: string; // Ex: '400px' (Calculada dinamicamente)
}

@Component({
  selector: 'bio-insumo-treemap-chart', // Pode manter o seletor ou mudar se quiser
  standalone: true,
  imports: [
    CommonModule,
    NgChartsModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './bio-insumo-treemap-chart.component.html',
  styleUrls: ['./bio-insumo-treemap-chart.component.scss']
})
export class BioInsumoTreemapChartComponent implements OnChanges {

  @Input() dados: any[] = [];

  public culturasDisponiveis: string[] = [];
  public culturaSelecionada: string = '';

  // LISTA DE GRÁFICOS QUE SERÃO RENDERIZADOS
  public listaGraficos: GraficoConfig[] = [];

  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: any) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dados'] && this.dados && this.dados.length > 0) {
      this.extrairCulturas();

      if (this.culturasDisponiveis.length > 0 && !this.culturaSelecionada) {
        this.culturaSelecionada = this.culturasDisponiveis[0];
        this.gerarGraficos();
      }
    }
  }

  private extrairCulturas(): void {
    const setCulturas = new Set<string>();
    this.dados.forEach(item => {
      if (item.cultura) setCulturas.add(item.cultura.trim().toUpperCase());
    });
    this.culturasDisponiveis = Array.from(setCulturas).sort();
  }

  public onCulturaChange(): void {
    this.gerarGraficos();
  }

  private gerarGraficos(): void {
    this.listaGraficos = []; // Limpa anteriores
    if (!this.culturaSelecionada) return;

    // 1. Filtra tudo da Cultura selecionada
    const dadosCultura = this.dados.filter(item =>
      item.cultura && item.cultura.trim().toUpperCase() === this.culturaSelecionada
    );

    if (dadosCultura.length === 0) return;

    // 2. Agrupa por TIPO (ex: Fixadora, Promotora, etc.)
    const mapaTipos = new Map<string, any[]>();

    dadosCultura.forEach(item => {
      const tipo = item.tipo ? item.tipo.trim() : 'OUTROS';
      if (!mapaTipos.has(tipo)) mapaTipos.set(tipo, []);
      mapaTipos.get(tipo)?.push(item);
    });

    // 3. Para cada TIPO, gera uma configuração de gráfico
    mapaTipos.forEach((itensDoTipo, nomeTipo) => {
      const config = this.criarConfigGrafico(nomeTipo, itensDoTipo);
      this.listaGraficos.push(config);
    });

    // Opcional: Ordenar os gráficos para que "Fixadora" apareça sempre primeiro, etc.
    this.listaGraficos.sort((a, b) => a.titulo.localeCompare(b.titulo));
  }

  private criarConfigGrafico(titulo: string, itens: any[]): GraficoConfig {
    // A. Contagem de Espécies
    const contagem = new Map<string, number>();
    itens.forEach(item => {
      let especies: string[] = Array.isArray(item.especie) ? item.especie : [item.especie];
      especies.forEach(esp => {
        if (!esp) return;
        const nome = esp.toUpperCase().trim();
        contagem.set(nome, (contagem.get(nome) || 0) + 1);
      });
    });

    // B. Ordenação (Maior para menor)
    const sortedEntries = Array.from(contagem.entries()).sort((a, b) => b[1] - a[1]);
    const labels = sortedEntries.map(e => e[0]);
    const values = sortedEntries.map(e => e[1]);

    // --- NOVO: CÁLCULO DO TOTAL ---
    // Somamos todos os valores das barras para saber o total daquele tipo
    const totalDesteTipo = values.reduce((acc, valor) => acc + valor, 0);

    // C. Cálculo de Altura Dinâmica
    const alturaCalculada = Math.max(200, (labels.length * 35) + 60) + 'px';

    // D. Configuração do Chart.js
    const chartData: ChartData<'bar'> = {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: this.getCorPorTipo(titulo),
        borderRadius: 4,
        barPercentage: 0.7,
        categoryPercentage: 0.9
      }]
    };

    const chartOptions: ChartOptions<'bar'> = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { right: 50 } }, // Mantendo o ajuste que fizemos antes
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: '#333',
          font: { weight: 'bold' },
          formatter: (val) => val,
          clip: false
        },
        tooltip: { enabled: true }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { display: false },
          grace: '10%'
        },
        y: {
          ticks: { font: { size: 11, family: 'Roboto' }, autoSkip: false },
          grid: { display: false }
        }
      }
    };

    return {
      // --- ALTERAÇÃO AQUI: Adicionamos o total ao título ---
      titulo: `${titulo} (Total: ${totalDesteTipo})`,
      dados: chartData,
      opcoes: chartOptions,
      altura: alturaCalculada
    };
  }

  // Define cores temáticas baseadas no tipo de microrganismo
  private getCorPorTipo(tipo: string): string {
    if (tipo.includes('NITROGÊNIO')) return '#2e7d32'; // Verde
    if (tipo.includes('CRESCIMENTO')) return '#f9a825'; // Amarelo/Ouro
    if (tipo.includes('ASSOCIATIVAS')) return '#0277bd'; // Azul
    return '#78909c'; // Cinza padrão
  }
}