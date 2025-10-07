import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { DataService, CompanyAnalysis, CompanyProfile, SectorBenchmark, CashflowHistory, TransactionDistribution } from '../services/data.service';

@Component({
  selector: 'app-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, RouterModule],
  templateUrl: './empresa.component.html',
  styleUrls: ['./empresa.component.css']
})
export class EmpresaComponent implements OnInit, AfterViewInit {
  loading = false;
  error: string | null = null;
  
  companyIds: string[] = [];
  selectedCompanyId: string = '';
  companyAnalysis: CompanyAnalysis | null = null;

  // Chart configurations
  cashflowChartType = 'line' as const;
  cashflowChartData: ChartData<'line'> = { labels: [], datasets: [] };
  cashflowChartOptions: ChartConfiguration<'line'>['options'] = {
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

  revenueChartType = 'bar' as const;
  revenueChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  revenueChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.5,
    devicePixelRatio: 2,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      title: { display: false }
    },
    scales: {
      x: { 
        title: { 
          display: true, 
          text: 'Valor (R$)',
          color: '#666',
          font: { size: 14, weight: 'bold' }
        },
        grid: { color: '#e8eaed' },
        ticks: { color: '#666' }
      },
      y: { 
        title: { 
          display: true, 
          text: 'Origem',
          color: '#666',
          font: { size: 14, weight: 'bold' }
        },
        grid: { display: false },
        ticks: { 
          color: '#666',
          font: { size: 11 }
        }
      }
    }
  };

  expenseChartType = 'bar' as const;
  expenseChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  expenseChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.5,
    devicePixelRatio: 2,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      title: { display: false }
    },
    scales: {
      x: { 
        title: { 
          display: true, 
          text: 'Valor (R$)',
          color: '#666',
          font: { size: 14, weight: 'bold' }
        },
        grid: { color: '#e8eaed' },
        ticks: { color: '#666' }
      },
      y: { 
        title: { 
          display: true, 
          text: 'Categoria',
          color: '#666',
          font: { size: 14, weight: 'bold' }
        },
        grid: { display: false },
        ticks: { 
          color: '#666',
          font: { size: 11 }
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
    // Show sample cashflow data immediately
    const sampleData = this.generateSampleCashflowData();
    this.cashflowChartData = {
      labels: sampleData.labels,
      datasets: [
        {
          label: 'Receita (Dados de Exemplo)',
          data: sampleData.receita,
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
          label: 'Despesa (Dados de Exemplo)',
          data: sampleData.despesa,
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
          label: 'Fluxo Líquido (Dados de Exemplo)',
          data: sampleData.fluxo_liq,
          borderColor: '#d32f2f',
          backgroundColor: 'rgba(211, 47, 47, 0.1)',
          borderWidth: 3,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 5,
          pointBorderWidth: 2,
          pointHoverBorderWidth: 2
        }
      ]
    };
    
    // Initialize empty charts for revenue and expense
    this.revenueChartData = { labels: [], datasets: [] };
    this.expenseChartData = { labels: [], datasets: [] };
  }

  loadCompanyIds(): void {
    this.loading = true;
    this.dataService.getCompanyIds().subscribe({
      next: (ids: string[]) => {
        this.companyIds = ids.sort();
        this.loading = false;
        if (this.companyIds.length > 0) {
          this.selectedCompanyId = this.companyIds[0];
          this.loadCompanyAnalysis();
        }
      },
      error: (error: any) => {
        this.error = 'Erro ao carregar lista de empresas';
        this.loading = false;
        console.error('Error loading company IDs:', error);
      }
    });
  }

  onCompanyChange(): void {
    if (this.selectedCompanyId) {
      // Clear current analysis to force loading state
      this.companyAnalysis = null;
      this.loadCompanyAnalysis();
    }
  }

  loadCompanyAnalysis(): void {
    if (!this.selectedCompanyId) return;
    
    this.loading = true;
    this.error = null;
    
    this.dataService.getCompanyAnalysis(this.selectedCompanyId).subscribe({
      next: (analysis: CompanyAnalysis) => {
        console.log('Company analysis received:', analysis);
        this.companyAnalysis = analysis;
        this.updateCharts();
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Erro ao carregar análise da empresa';
        this.loading = false;
        console.error('Error loading company analysis:', error);
      }
    });
  }

  private updateCharts(): void {
    if (!this.companyAnalysis) return;

    this.updateCashflowChart();
    this.updateRevenueChart();
    this.updateExpenseChart();
  }

  private updateCashflowChart(): void {
    const history = this.companyAnalysis!.cashflow_history;
    
    // Debug: log the data to see what we're getting
    console.log('Cashflow history data:', history);
    
    // Handle empty data case - create sample data for demonstration
    if (!history || history.length === 0) {
      // Generate 6 months of sample data
      const sampleData = this.generateSampleCashflowData();
      this.cashflowChartData = {
        labels: sampleData.labels,
        datasets: [
          {
            label: 'Receita (Dados de Exemplo)',
            data: sampleData.receita,
            borderColor: '#ffcdd2',
            backgroundColor: 'rgba(255, 205, 210, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 7
          },
          {
            label: 'Despesa (Dados de Exemplo)',
            data: sampleData.despesa,
            borderColor: '#ef5350',
            backgroundColor: 'rgba(239, 83, 80, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 7
          },
          {
            label: 'Fluxo Líquido (Dados de Exemplo)',
            data: sampleData.fluxo_liq,
            borderColor: '#d32f2f',
            backgroundColor: 'rgba(211, 47, 47, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 7
          }
        ]
      };
      return;
    }
    
    this.cashflowChartData = {
      labels: history.map(item => this.formatDate(item.ano_mes)),
      datasets: [
        {
          label: 'Receita',
          data: history.map(item => item.receita),
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
          label: 'Despesa',
          data: history.map(item => item.despesa),
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
          label: 'Fluxo Líquido',
          data: history.map(item => item.fluxo_liq),
          borderColor: '#d32f2f',
          backgroundColor: 'rgba(211, 47, 47, 0.1)',
          borderWidth: 3,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 5,
          pointBorderWidth: 2,
          pointHoverBorderWidth: 2
        }
      ]
    };
  }

  private updateRevenueChart(): void {
    const revenueData = this.companyAnalysis!.revenue_distribution;
    
    // Cores da paleta vermelha para receitas
    const revenueColors = [
      '#ffcdd2', '#ef5350', '#d32f2f', '#b71c1c', 
      '#c62828', '#f44336', '#e53935', '#ffcdd2', 
      '#ef9a9a', '#8d1e1e'
    ];
    
    const revenueBorderColors = [
      '#f8bbd9', '#e53935', '#c62828', '#8d1e1e',
      '#b71c1c', '#d32f2f', '#c62828', '#f8bbd9',
      '#ef5350', '#6d1b1b'
    ];
    
    this.revenueChartData = {
      labels: revenueData.map(item => item.ds_tran),
      datasets: [{
        data: revenueData.map(item => item.vl),
        backgroundColor: revenueColors.slice(0, revenueData.length),
        borderColor: revenueBorderColors.slice(0, revenueData.length),
        borderWidth: 2
      }]
    };
  }

  private updateExpenseChart(): void {
    const expenseData = this.companyAnalysis!.expense_distribution;
    
    // Cores da paleta vermelha para despesas (tons mais escuros)
    const expenseColors = [
      '#d32f2f', '#b71c1c', '#c62828', '#8d1e1e',
      '#ef5350', '#f44336', '#e53935', '#ffcdd2',
      '#c8e6c9', '#6d1b1b'
    ];
    
    const expenseBorderColors = [
      '#c62828', '#8d1e1e', '#b71c1c', '#6d1b1b',
      '#e53935', '#d32f2f', '#c62828', '#f8bbd9',
      '#a5d6a7', '#5d1a1a'
    ];
    
    this.expenseChartData = {
      labels: expenseData.map(item => item.ds_tran),
      datasets: [{
        data: expenseData.map(item => item.vl),
        backgroundColor: expenseColors.slice(0, expenseData.length),
        borderColor: expenseBorderColors.slice(0, expenseData.length),
        borderWidth: 2
      }]
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

  getDelta(companyValue: number, sectorValue: number): number {
    return companyValue - sectorValue;
  }

  getDeltaPercentage(companyValue: number, sectorValue: number): number {
    return companyValue - sectorValue;
  }

  private generateSampleCashflowData() {
    const months = ['Jan 2024', 'Fev 2024', 'Mar 2024', 'Abr 2024', 'Mai 2024', 'Jun 2024'];
    const baseReceita = 50000;
    const baseDespesa = 35000;
    
    return {
      labels: months,
      receita: months.map((_, i) => baseReceita + (Math.random() - 0.5) * 10000 + i * 2000),
      despesa: months.map((_, i) => baseDespesa + (Math.random() - 0.5) * 8000 + i * 1500),
      fluxo_liq: months.map((_, i) => {
        const receita = baseReceita + (Math.random() - 0.5) * 10000 + i * 2000;
        const despesa = baseDespesa + (Math.random() - 0.5) * 8000 + i * 1500;
        return receita - despesa;
      })
    };
  }
}