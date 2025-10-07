import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { DataService, ForecastData, ForecastAnalysis } from '../services/data.service';

@Component({
  selector: 'app-previsao',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, RouterModule],
  templateUrl: './previsao.component.html',
  styleUrls: ['./previsao.component.css']
})
export class PrevisaoComponent implements OnInit, AfterViewInit {
  loading = false;
  error: string | null = null;
  
  companyIds: string[] = [];
  selectedCompanyId: string = '';
  selectedMonths: number = 6;
  forecastAnalysis: ForecastAnalysis | null = null;

  // Chart configurations
  forecastChartType = 'line' as const;
  forecastChartData: ChartData<'line'> = { labels: [], datasets: [] };
  forecastChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: window.devicePixelRatio || 2,
    animation: {
      duration: 0 // Disable animations to prevent tremor
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: { 
        display: true,
        position: 'bottom',
        labels: {
          color: '#666',
          font: { size: 12, weight: 'bold' },
          usePointStyle: true,
          padding: 20
        }
      },
      title: { 
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#d32f2f',
        borderWidth: 1,
        displayColors: true,
        callbacks: {
          title: (context) => context[0].label,
          label: (context) => {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${value.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0
            })}`;
          }
        }
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 5, // Minimal difference to reduce tremor
        borderWidth: 2,
        hoverBorderWidth: 2
      }
    },
    scales: {
      x: { 
        title: { 
          display: true, 
          text: 'Período',
          color: '#666',
          font: { size: 14, weight: 'bold' }
        },
        grid: { color: '#e8eaed' },
        ticks: { color: '#666' }
      },
      y: { 
        title: { 
          display: true, 
          text: 'Valor (R$)',
          color: '#666',
          font: { size: 14, weight: 'bold' }
        },
        grid: { color: '#e8eaed' },
        ticks: { 
          color: '#666',
          callback: function(value) {
            return (value as number).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0
            });
          }
        }
      }
    }
  };

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.loadCompanyIds();
    // Initialize with sample data immediately
    this.initializeWithSampleData();
  }

  ngAfterViewInit(): void {
    // Force chart update after view initialization to ensure proper rendering
    setTimeout(() => {
      this.updateCharts();
    }, 100);
  }

  private initializeWithSampleData(): void {
    // Show sample forecast data immediately
    const sampleData = this.generateSampleForecastData();
    this.forecastChartData = {
      labels: sampleData.labels,
      datasets: [
        {
          label: 'Receita Histórica',
          data: sampleData.receitaHistorica,
          borderColor: '#ffcdd2',
          backgroundColor: 'rgba(255, 205, 210, 0.1)',
          borderWidth: 3,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 5,
          pointBorderWidth: 2,
          pointHoverBorderWidth: 2
        },
        {
          label: 'Despesa Histórica',
          data: sampleData.despesaHistorica,
          borderColor: '#ef5350',
          backgroundColor: 'rgba(239, 83, 80, 0.1)',
          borderWidth: 3,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 5,
          pointBorderWidth: 2,
          pointHoverBorderWidth: 2
        },
        {
          label: 'Receita Prevista',
          data: sampleData.receitaPrevista,
          borderColor: '#a5d6a7',
          backgroundColor: 'rgba(165, 214, 167, 0.1)',
          borderWidth: 3,
          borderDash: [5, 5],
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 5,
          pointBorderWidth: 2,
          pointHoverBorderWidth: 2
        },
        {
          label: 'Despesa Prevista',
          data: sampleData.despesaPrevista,
          borderColor: '#ffab91',
          backgroundColor: 'rgba(255, 171, 145, 0.1)',
          borderWidth: 3,
          borderDash: [5, 5],
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 5,
          pointBorderWidth: 2,
          pointHoverBorderWidth: 2
        }
      ]
    };
  }

  loadCompanyIds(): void {
    this.loading = true;
    this.dataService.getCompanyIds().subscribe({
      next: (ids: string[]) => {
        this.companyIds = ids.sort();
        this.loading = false;
        if (this.companyIds.length > 0) {
          this.selectedCompanyId = this.companyIds[0];
          this.loadForecastAnalysis();
        }
      },
      error: (error: any) => {
        this.error = 'Erro ao carregar lista de empresas';
        this.loading = false;
        console.error('Error loading company IDs:', error);
      }
    });
  }

  onSelectionChange(): void {
    if (this.selectedCompanyId) {
      // Clear current analysis to force loading state
      this.forecastAnalysis = null;
      this.loadForecastAnalysis();
    }
  }

  loadForecastAnalysis(): void {
    if (!this.selectedCompanyId) return;
    
    this.loading = true;
    this.error = null;
    
    this.dataService.getForecastAnalysis(this.selectedCompanyId, this.selectedMonths).subscribe({
      next: (analysis: ForecastAnalysis) => {
        console.log('Forecast analysis received:', analysis);
        this.forecastAnalysis = analysis;
        this.updateCharts();
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Erro ao carregar análise de previsão';
        this.loading = false;
        console.error('Error loading forecast analysis:', error);
      }
    });
  }

  private updateCharts(): void {
    if (!this.forecastAnalysis) return;

    this.updateForecastChart();
  }

  private updateForecastChart(): void {
    const historico = this.forecastAnalysis!.forecast_data.historico;
    const previsao = this.forecastAnalysis!.forecast_data.previsao;
    
    // Debug: log the data to see what we're getting
    console.log('Historical data:', historico);
    console.log('Forecast data:', previsao);
    
    // Handle empty data case - use sample data for demonstration
    if (!historico || historico.length === 0) {
      const sampleData = this.generateSampleForecastData();
      this.forecastChartData = {
        labels: sampleData.labels,
        datasets: [
          {
            label: 'Receita Histórica (Dados de Exemplo)',
            data: sampleData.receitaHistorica,
            borderColor: '#ffcdd2',
            backgroundColor: 'rgba(255, 205, 210, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 5,
            pointBorderWidth: 2,
            pointHoverBorderWidth: 2
          },
          {
            label: 'Despesa Histórica (Dados de Exemplo)',
            data: sampleData.despesaHistorica,
            borderColor: '#ef5350',
            backgroundColor: 'rgba(239, 83, 80, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 5,
            pointBorderWidth: 2,
            pointHoverBorderWidth: 2
          },
          {
            label: 'Receita Prevista (Dados de Exemplo)',
            data: sampleData.receitaPrevista,
            borderColor: '#a5d6a7',
            backgroundColor: 'rgba(165, 214, 167, 0.1)',
            borderWidth: 3,
            borderDash: [5, 5],
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 5,
            pointBorderWidth: 2,
            pointHoverBorderWidth: 2
          },
          {
            label: 'Despesa Prevista (Dados de Exemplo)',
            data: sampleData.despesaPrevista,
            borderColor: '#ffab91',
            backgroundColor: 'rgba(255, 171, 145, 0.1)',
            borderWidth: 3,
            borderDash: [5, 5],
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 5,
            pointBorderWidth: 2,
            pointHoverBorderWidth: 2
          }
        ]
      };
      return;
    }
    
    // Combine historical and forecast data
    const allLabels = [
      ...historico.map(item => this.formatDate(item.ano_mes)),
      ...previsao.map(item => this.formatDate(item.ano_mes))
    ];
    
    const receitaHistorica = [...historico.map(item => item.receita), ...Array(previsao.length).fill(null)];
    const despesaHistorica = [...historico.map(item => item.despesa), ...Array(previsao.length).fill(null)];
    const receitaPrevista = [...Array(historico.length).fill(null), ...previsao.map(item => item.receita)];
    const despesaPrevista = [...Array(historico.length).fill(null), ...previsao.map(item => item.despesa)];
    
    this.forecastChartData = {
      labels: allLabels,
      datasets: [
        {
          label: 'Receita Histórica',
          data: receitaHistorica,
          borderColor: '#ffcdd2',
          backgroundColor: 'rgba(255, 205, 210, 0.1)',
          borderWidth: 3,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 5,
          pointBorderWidth: 2,
          pointHoverBorderWidth: 2,
          spanGaps: false
        },
        {
          label: 'Despesa Histórica',
          data: despesaHistorica,
          borderColor: '#ef5350',
          backgroundColor: 'rgba(239, 83, 80, 0.1)',
          borderWidth: 3,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 5,
          pointBorderWidth: 2,
          pointHoverBorderWidth: 2,
          spanGaps: false
        },
        {
          label: 'Receita Prevista',
          data: receitaPrevista,
          borderColor: '#a5d6a7',
          backgroundColor: 'rgba(165, 214, 167, 0.1)',
          borderWidth: 3,
          borderDash: [5, 5],
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 5,
          pointBorderWidth: 2,
          pointHoverBorderWidth: 2,
          spanGaps: false
        },
        {
          label: 'Despesa Prevista',
          data: despesaPrevista,
          borderColor: '#ffab91',
          backgroundColor: 'rgba(255, 171, 145, 0.1)',
          borderWidth: 3,
          borderDash: [5, 5],
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 5,
          pointBorderWidth: 2,
          pointHoverBorderWidth: 2,
          spanGaps: false
        }
      ]
    };
  }

  private formatDate(dateString: string): string {
    // Format: YYYY-MM ou YYYY-MM-DD
    const parts = dateString.split('-');
    if (parts.length >= 2) {
      const year = parts[0];
      const month = parseInt(parts[1]);
      const monthNames = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
      ];
      return `${monthNames[month - 1]} ${year}`;
    }
    return dateString;
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  formatPercentage(value: number): string {
    return (value * 100).toFixed(1) + '%';
  }

  getTrendIcon(current: number, previous: number): string {
    if (current > previous) return '↗';
    if (current < previous) return '↘';
    return '→';
  }

  getTrendClass(current: number, previous: number): string {
    if (current > previous) return 'positive';
    if (current < previous) return 'negative';
    return 'neutral';
  }

  private generateSampleForecastData() {
    const historicalMonths = ['Jan 2024', 'Fev 2024', 'Mar 2024', 'Abr 2024', 'Mai 2024', 'Jun 2024'];
    const forecastMonths = ['Jul 2024', 'Ago 2024', 'Set 2024', 'Out 2024', 'Nov 2024', 'Dez 2024'];
    const allMonths = [...historicalMonths, ...forecastMonths];
    
    const baseReceita = 50000;
    const baseDespesa = 35000;
    
    return {
      labels: allMonths,
      receitaHistorica: [...historicalMonths.map((_, i) => baseReceita + (Math.random() - 0.5) * 10000 + i * 2000), ...Array(forecastMonths.length).fill(null)],
      despesaHistorica: [...historicalMonths.map((_, i) => baseDespesa + (Math.random() - 0.5) * 8000 + i * 1500), ...Array(forecastMonths.length).fill(null)],
      receitaPrevista: [...Array(historicalMonths.length).fill(null), ...forecastMonths.map((_, i) => baseReceita + 12000 + i * 2500 + (Math.random() - 0.5) * 5000)],
      despesaPrevista: [...Array(historicalMonths.length).fill(null), ...forecastMonths.map((_, i) => baseDespesa + 10000 + i * 1800 + (Math.random() - 0.5) * 4000)]
    };
  }
}