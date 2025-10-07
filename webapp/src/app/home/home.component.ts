import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { DataService, DashboardData, Sector } from '../services/data.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, BaseChartDirective, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  dashboardData: DashboardData | null = null;
  sectors: Sector[] = [];
  selectedSector = 'Todos os Setores';
  loading = false;
  error: string | null = null;

  // Chart configurations
  momentChartType = 'bar' as const;
  momentChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  momentChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2.5,
    devicePixelRatio: 2,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      title: { 
        display: false
      }
    },
    scales: {
      x: { 
        title: { 
          display: true, 
          text: 'Nº de Empresas',
          color: '#666',
          font: { size: 14, weight: 'bold' }
        },
        grid: { color: '#e8eaed' },
        ticks: { color: '#666' }
      },
      y: { 
        title: { 
          display: true, 
          text: 'Momento da Empresa',
          color: '#666',
          font: { size: 14, weight: 'bold' }
        },
        grid: { display: false },
        ticks: { color: '#666' }
      }
    }
  };

  scatterChartType = 'scatter' as const;
  scatterChartData: ChartData<'scatter'> = { datasets: [] };
  scatterChartOptions: ChartConfiguration<'scatter'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2.5, // Aumentar aspectRatio para diminuir altura (mais largo, menos alto)
    devicePixelRatio: 2,
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
      }
    },
    scales: {
      x: { 
        title: { 
          display: true, 
          text: 'Receita Média (R$)',
          color: '#666',
          font: { size: 14, weight: 'bold' }
        },
        grid: { color: '#e8eaed' },
        ticks: { color: '#666' }
      },
      y: { 
        title: { 
          display: true, 
          text: 'Despesa Média (R$)',
          color: '#666',
          font: { size: 14, weight: 'bold' }
        },
        grid: { color: '#e8eaed' },
        ticks: { color: '#666' }
      }
    }
  };

  maturityChartType = 'bar' as const;
  maturityChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  maturityChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    devicePixelRatio: 2,
    resizeDelay: 100, // Debounce resize events
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      }
    },
    interaction: {
      intersect: false,
      mode: 'point'
    },
    animation: {
      duration: 300, // Reduzir duração da animação
      easing: 'easeOutCubic'
    },
    plugins: {
      legend: { display: false },
      title: { 
        display: false
      },
      tooltip: {
        enabled: true,
        external: undefined, // Usar tooltip padrão mais estável
        position: 'nearest',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#00843D',
        borderWidth: 2,
        cornerRadius: 8,
        displayColors: false,
        padding: 12,
        caretPadding: 6,
        caretSize: 8,
        usePointStyle: false
      }
    },
    scales: {
      x: { 
        title: { 
          display: true, 
          text: 'Nível de Maturidade',
          color: '#666',
          font: { size: 14, weight: 'bold' }
        },
        grid: { display: false },
        ticks: { color: '#666' }
      },
      y: { 
        title: { 
          display: true, 
          text: 'Receita Média (R$)',
          color: '#666',
          font: { size: 14, weight: 'bold' }
        },
        grid: { color: '#e8eaed' },
        ticks: { color: '#666' }
      }
    }
  };

  transactionChartType = 'pie' as const;
  transactionChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  transactionChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.4, // Proporção mais retangular para acomodar legenda lateral
    devicePixelRatio: 2,
    resizeDelay: 100, // Debounce resize events
    layout: {
      padding: {
        top: 10,
        bottom: 10, // Menos padding inferior pois legenda não está embaixo
        left: 10,
        right: 120 // Mais espaço à direita para acomodar legenda lateral
      }
    },
    interaction: {
      intersect: false,
      mode: 'point'
    },
    animation: {
      duration: 300, // Reduzir duração da animação
      animateRotate: true,
      animateScale: false // Não animar escala para evitar tremulação
    },
    plugins: {
      legend: { 
        display: true, 
        position: 'left',
        align: 'center',
        maxWidth: 200,
        labels: {
          color: '#666',
          font: { size: 11, weight: 'bold' },
          padding: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 10,
          boxHeight: 10,
          textAlign: 'left'
        }
      },
      title: { 
        display: false
      },
      tooltip: {
        enabled: true,
        external: undefined, // Usar tooltip padrão mais estável
        position: 'nearest',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#FFB600',
        borderWidth: 2,
        cornerRadius: 8,
        displayColors: false,
        padding: 12,
        caretPadding: 6,
        caretSize: 8,
        usePointStyle: false,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${percentage}%`;
          }
        }
      }
    }
  };

  sectorChartType = 'bar' as const;
  sectorChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  sectorChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    devicePixelRatio: 2,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      title: { 
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#d32f2f',
        borderWidth: 1
      }
    },
    scales: {
      x: { 
        title: { 
          display: true, 
          text: 'Receita Total (R$)',
          color: '#666',
          font: { size: 14, weight: 'bold' }
        },
        grid: { color: '#e8eaed' },
        ticks: { color: '#666' }
      },
      y: { 
        title: { 
          display: true, 
          text: 'Setor',
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

  ngOnInit() {
    this.loadSectors();
    this.loadDashboardData();
  }

  loadSectors() {
    this.dataService.getSectors().subscribe({
      next: (sectors) => {
        this.sectors = sectors;
      },
      error: (err) => {
        console.error('Error loading sectors:', err);
      }
    });
  }

  loadDashboardData() {
    this.loading = true;
    this.error = null;
    
    this.dataService.getDashboardData(this.selectedSector).subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.updateCharts();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error loading dashboard data';
        this.loading = false;
        console.error('Error:', err);
      }
    });
  }

  onSectorChange() {
    this.loadDashboardData();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR').format(value);
  }

  private updateCharts() {
    if (!this.dashboardData) return;

    // Update moment distribution chart
    this.updateMomentChart();
    
    // Update scatter plot
    this.updateScatterChart();
    
    // Update maturity analysis chart
    this.updateMaturityChart();
    
    // Update transaction analysis chart
    this.updateTransactionChart();
    
    // Update sector analysis chart
    this.updateSectorChart();
  }

  private updateMomentChart() {
    if (!this.dashboardData) return;
    
    const momentData = this.dashboardData.moment_distribution;
    
    // Mapear cores por momento específico - tons de vermelho
    const getColorByMoment = (moment: string) => {
      switch (moment.toLowerCase()) {
        case 'início': return '#ffcdd2';     // Vermelho claro (um pouco mais escuro)
        case 'crescimento': return '#ef5350'; // Vermelho médio claro
        case 'maturidade': return '#d32f2f';  // Vermelho base (principal)
        case 'declínio': return '#b71c1c';   // Vermelho escuro
        default: return '#d32f2f';           // Fallback
      }
    };
    
    const getBorderColorByMoment = (moment: string) => {
      switch (moment.toLowerCase()) {
        case 'início': return '#f8bbd9';     // Rosa mais escuro
        case 'crescimento': return '#e53935'; // Vermelho médio mais escuro
        case 'maturidade': return '#c62828';  // Vermelho base mais escuro
        case 'declínio': return '#8d1e1e';   // Vermelho muito escuro
        default: return '#b71c1c';           // Fallback
      }
    };
    
    this.momentChartData = {
      labels: momentData.map(item => item.moment),
      datasets: [{
        data: momentData.map(item => item.count),
        backgroundColor: momentData.map(item => getColorByMoment(item.moment)),
        borderColor: momentData.map(item => getBorderColorByMoment(item.moment)),
        borderWidth: 2
      }]
    };
  }

  private updateScatterChart() {
    if (!this.dashboardData) return;
    
    const clusters = this.dashboardData.revenue_expense_clusters;
    const momentColors: { [key: string]: string } = {
      'Início': '#ffcdd2',        // Vermelho claro (um pouco mais escuro)
      'Crescimento': '#ef5350',   // Vermelho médio claro
      'Maturidade': '#d32f2f',    // Vermelho base (principal)
      'Declínio': '#b71c1c'       // Vermelho escuro
    };

    const momentBorderColors: { [key: string]: string } = {
      'Início': '#f8bbd9',        // Rosa mais escuro para contraste
      'Crescimento': '#e53935',   // Vermelho médio mais escuro
      'Maturidade': '#c62828',    // Vermelho base mais escuro
      'Declínio': '#8d1e1e'       // Vermelho muito escuro
    };

    // Otimizar dados - limitar número de pontos se necessário
    const maxPointsPerMoment = 100; // Limitar para performance
    const datasets: any[] = [];
    const moments = [...new Set(clusters.map(item => item.moment))];

    moments.forEach(moment => {
      let filteredClusters = clusters.filter(item => item.moment === moment);
      
      // Se há muitos pontos, fazer sampling
      if (filteredClusters.length > maxPointsPerMoment) {
        const step = Math.ceil(filteredClusters.length / maxPointsPerMoment);
        filteredClusters = filteredClusters.filter((_, index) => index % step === 0);
      }
      
      const data = filteredClusters.map(item => ({
        x: Math.round(item.average_revenue_6m * 100) / 100, // Arredondar para reduzir complexidade
        y: Math.round(item.average_expense_6m * 100) / 100
      }));

      if (data.length > 0) {
        datasets.push({
          label: moment,
          data: data,
          backgroundColor: momentColors[moment] || '#9e9e9e',
          borderColor: momentBorderColors[moment] || '#757575',
          borderWidth: 1,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBorderWidth: 1,
          pointHoverBorderWidth: 2,
          tension: 0 // Sem suavização para melhor performance
        });
      }
    });

    this.scatterChartData = { datasets };
  }

  private updateMaturityChart() {
    if (!this.dashboardData) return;
    
    const maturityData = this.dashboardData.maturity_analysis;
    
    // Usar gradiente da paleta nova para níveis de maturidade
    const maturityColors = [
      '#ffcdd2',      // Vermelho claro (Início)
      '#ef5350',      // Vermelho médio claro (Crescimento)
      '#d32f2f',      // Vermelho base (Maturidade)
      '#b71c1c',      // Vermelho escuro (Declínio)
      '#8d1e1e'       // Vermelho muito escuro (Extra)
    ];
    
    const maturityBorderColors = [
      '#f8bbd9',      // Rosa mais escuro
      '#e53935',      // Vermelho médio mais escuro
      '#c62828',      // Vermelho base mais escuro
      '#8d1e1e',      // Vermelho muito escuro
      '#6d1b1b'       // Vermelho extra escuro
    ];
    
    const maturityHoverColors = [
      '#fce4ec',      // Rosa hover mais claro
      '#f48fb1',      // Vermelho claro hover
      '#e57373',      // Vermelho médio hover
      '#d32f2f',      // Vermelho base hover
      '#b71c1c'       // Vermelho escuro hover
    ];
    
    this.maturityChartData = {
      labels: maturityData.map(item => item.maturity_range),
      datasets: [{
        data: maturityData.map(item => item.average_revenue),
        backgroundColor: maturityColors.slice(0, maturityData.length),
        borderColor: maturityBorderColors.slice(0, maturityData.length),
        borderWidth: 2,
        hoverBackgroundColor: maturityHoverColors.slice(0, maturityData.length)
      }]
    };
  }

  private updateTransactionChart() {
    if (!this.dashboardData) return;
    
    const transactionData = this.dashboardData.transaction_analysis.slice(0, 10);
    
    // Usar a nova paleta como base e adicionar cores complementares
    const transactionColors = [
      '#ffcdd2',      // Vermelho claro (Início)
      '#ef5350',      // Vermelho médio claro (Crescimento)
      '#d32f2f',      // Vermelho base (Maturidade)
      '#b71c1c',      // Vermelho escuro (Declínio)
      '#c62828',      // Vermelho intermediário
      '#f44336',      // Vermelho vibrante
      '#e53935',      // Vermelho intenso
      '#c8e6c9',      // Vermelho rosé
      '#ffcdd2',      // Vermelho pálido
      '#8d1e1e'       // Vermelho muito escuro
    ];
    
    const transactionBorderColors = [
      '#f8bbd9',      // Rosa mais escuro
      '#e53935',      // Vermelho médio mais escuro
      '#c62828',      // Vermelho base mais escuro
      '#8d1e1e',      // Vermelho muito escuro
      '#b71c1c',      // Vermelho escuro intermediário
      '#d32f2f',      // Vermelho base para borda
      '#c62828',      // Vermelho intenso escuro
      '#a5d6a7',      // Verde-rosa escuro
      '#ef9a9a',      // Vermelho pálido escuro
      '#6d1b1b'       // Vermelho extra escuro
    ];
    
    // Truncar labels muito longos para melhor visualização
    const truncateLabel = (label: string, maxLength: number = 25): string => {
      return label.length > maxLength ? label.substring(0, maxLength) + '...' : label;
    };
    
    this.transactionChartData = {
      labels: transactionData.map(item => truncateLabel(item.transaction_type)),
      datasets: [{
        data: transactionData.map(item => item.value),
        backgroundColor: transactionColors.slice(0, transactionData.length),
        borderColor: transactionBorderColors.slice(0, transactionData.length),
        borderWidth: 2,
        hoverOffset: 10
      }]
    };
  }

  private updateSectorChart() {
    if (!this.dashboardData) return;
    
    const sectorData = this.dashboardData.sector_analysis.slice(0, 15);
    
    // Criar gradiente usando a nova paleta de cores
    const basePalette = ['#ffcdd2', '#ef5350', '#d32f2f', '#b71c1c'];
    
    // Todas as barras em vermelho escuro com transparências diferentes para distinção
    const sectorColors = sectorData.map((_, index) => {
      const baseColor = '#b71c1c'; // Vermelho escuro para todas as barras
      const hex = baseColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      // Variar apenas a transparência para distinguir as barras
      const intensity = Math.max(0.6, 1.0 - (index * 0.02));
      return `rgba(${r}, ${g}, ${b}, ${intensity})`;
    });
    
    // Todas as bordas em vermelho muito escuro
    const sectorBorderColors = sectorData.map(() => '#8d1e1e'); // Vermelho muito escuro para todas as bordas
    
    this.sectorChartData = {
      labels: sectorData.map(item => item.sector),
      datasets: [{
        data: sectorData.map(item => item.total_revenue),
        backgroundColor: sectorColors,
        borderColor: sectorBorderColors,
        borderWidth: 2,
        hoverBackgroundColor: sectorColors.map(color => 
          color.replace(/[\d\.]+\)$/, '0.95)')
        )
      }]
    };
  }
}
