import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataService, GraphData, GraphNode, GraphLink } from '../services/data.service';
import * as d3 from 'd3';

@Component({
  selector: 'app-cadeia',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cadeia.component.html',
  styleUrls: ['./cadeia.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class CadeiaComponent implements OnInit, AfterViewInit {
  loading = false;
  error: string | null = null;
  
  // Lista de empresas
  companyIds: string[] = [];
  selectedCompanyId: string = '';
  
  // Dados de análise
  ecosystemSummary: string = '';
  companyAnalysis: string = '';

  // Configurações de visualização
  analysisView: 'ecosystem' | 'company' = 'ecosystem';
  graphNodes: any[] = [];
  graphEdges: any[] = [];
  criticalDependencies: any[] = [];
  threshold: number = 0.7; // 70%
  limit: number = 100; // Reduzido para melhor performance por padrão
  highPerformanceMode: boolean = true; // Modo de alto desempenho ativado por padrão
  
  // D3 Visualization properties
  private svg: any;
  private width = 1000;
  private height = 700;
  private color: any;
  private simulation: any;
  private link: any;
  private node: any;
  private zoom: any;
  private tooltip: any;
  private graphInitialized: boolean = false;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    // Apenas carregar a lista de IDs de empresas
    this.loadCompanyIds();
  }
  
  ngAfterViewInit(): void {
    // Aguardar o DOM ser completamente renderizado
    setTimeout(() => {
      console.log('ngAfterViewInit: Configurando grafo após renderização do DOM');
      // Tentar encontrar o elemento do grafo
      const graphElement = document.getElementById('graph-container');
      if (graphElement) {
        console.log('Elemento graph-container encontrado com dimensões:', 
                  graphElement.offsetWidth, 'x', graphElement.offsetHeight);
        this.setupGraph();
      } else {
        console.error('graph-container não encontrado no ngAfterViewInit! Tentando novamente em 300ms...');
        // Tentar novamente com um timeout maior
        setTimeout(() => this.setupGraph(), 300);
      }
    }, 200);
  }

  // Carrega a lista de IDs de empresas
  loadCompanyIds(): void {
    this.loading = true;
    this.dataService.getCompanyIds().subscribe({
      next: (ids: string[]) => {
        this.companyIds = ids.sort();
        this.loading = false;
        if (this.companyIds.length > 0) {
          // Default: análise de ecossistema
          this.loadEcosystemGraph();
        }
      },
      error: (error: any) => {
        this.error = 'Erro ao carregar lista de empresas';
        this.loading = false;
        console.error('Error loading company IDs:', error);
      }
    });
  }

  // Mudança de visualização
  changeView(view: 'ecosystem' | 'company'): void {
    this.analysisView = view;
    if (view === 'ecosystem') {
      this.loadEcosystemGraph();
    } else if (view === 'company' && this.selectedCompanyId) {
      this.loadCompanyGraph();
    } else if (view === 'company') {
      // Limpando o grafo anterior quando muda para modo empresa sem seleção
      this.clearGraph();
      // Adicionando uma mensagem informativa
      d3.select('#graph-container')
        .append('div')
        .attr('class', 'info-message')
        .style('position', 'absolute')
        .style('top', '50%')
        .style('left', '50%')
        .style('transform', 'translate(-50%, -50%)')
        .style('color', '#666')
        .style('font-weight', 'bold')
        .text('Selecione uma empresa para visualizar sua cadeia de valor');
    }
  }

  // Mudança de empresa selecionada
  onCompanyChange(): void {
    if (this.selectedCompanyId && this.analysisView === 'company') {
      // Quando uma empresa é selecionada no modo de análise de empresa,
      // carregue os dados da empresa selecionada
      this.loadCompanyGraph();
    }
  }

  // Carrega o grafo de ecossistema
  loadEcosystemGraph(): void {
    this.loading = true;
    this.error = null;
    this.ecosystemSummary = '';
    this.criticalDependencies = [];
    
    // Verificar se o elemento do gráfico existe no DOM
    const graphElement = document.getElementById('graph-container');
    
    if (!graphElement) {
      console.warn('Elemento do grafo não encontrado! Esperando renderização...');
      // Se não encontrou o elemento, aguarde um pouco mais antes de tentar carregar o grafo
      setTimeout(() => this.loadEcosystemGraph(), 300);
      return;
    }
    
    // Garantir que o grafo está inicializado antes de manipulá-lo
    if (!this.graphInitialized) {
      console.log('Inicializando grafo antes de carregar dados');
      this.setupGraph();
      
      // Se o grafo ainda não foi inicializado, espere um pouco e tente novamente
      if (!this.graphInitialized) {
        console.log('Aguardando inicialização do grafo antes de carregar dados...');
        setTimeout(() => this.loadEcosystemGraph(), 500);
        return;
      }
    }
    
    console.log(`Carregando grafo com limite de ${this.limit} conexões e modo de performance ${this.highPerformanceMode ? 'alto' : 'normal'}`);
    
    // Limpar o gráfico anterior
    this.clearGraph();
    
    // Não usaremos timeout para evitar mensagens de erro por tempo de carregamento
    
    // Carregar dados do grafo usando o método correto
    this.dataService.getEcosystemAnalysis().subscribe({
      next: (data) => {
        console.log('Dados do ecossistema recebidos:', data);
        
        // Limpar o gráfico anterior e preparar para o novo
        this.clearGraph();
        
        if (data && data.graph_data) {
          this.graphNodes = data.graph_data.nodes || [];
          this.graphEdges = data.graph_data.links || [];
          
          // Log node and edge count to help troubleshooting
          console.log(`Loaded ${this.graphNodes.length} nodes and ${this.graphEdges.length} edges`);
          
          if (data.dependencies && Array.isArray(data.dependencies)) {
            this.criticalDependencies = data.dependencies;
          }
        } else {
          console.error('Não foram encontrados dados de grafo válidos na resposta:', data);
          this.error = 'Erro no formato dos dados recebidos do servidor';
          this.loading = false;
          return;
        }
        
        if (data.ai_summary) {
          this.ecosystemSummary = data.ai_summary;
        } else {
          this.ecosystemSummary = "Análise do ecossistema não disponível no momento.";
        }
        
        // Renderizar o grafo com os dados obtidos, only if we have data
        if (this.graphNodes && this.graphNodes.length > 0) {
          console.log('Iniciando renderização do grafo com', this.graphNodes.length, 'nós');
          this.renderGraph(this.graphNodes, this.graphEdges);
        } else {
          this.clearGraph();
          d3.select('#graph-container')
            .append('div')
            .attr('class', 'error-message')
            .style('position', 'absolute')
            .style('top', '50%')
            .style('left', '50%')
            .style('transform', 'translate(-50%, -50%)')
            .style('color', '#ec0000')
            .style('font-weight', 'bold')
            .text('Não foram encontrados dados de grafo para exibição');
          
          this.error = 'Não foram encontrados dados de grafo para exibição';
        }
        
        this.loading = false;
      },
      error: (error: Error) => {
        this.error = 'Erro ao carregar dados do grafo';
        this.loading = false;
        console.error('Error loading graph data:', error);
        
        this.clearGraph();
        d3.select('#graph-container')
          .append('div')
          .attr('class', 'error-message')
          .style('position', 'absolute')
          .style('top', '50%')
          .style('left', '50%')
          .style('transform', 'translate(-50%, -50%)')
          .style('color', '#ec0000')
          .style('font-weight', 'bold')
          .text('Erro na comunicação com o servidor. Verifique se o servidor está em execução.');
      }
    });
  }

  // Carrega o grafo de uma empresa específica
  loadCompanyGraph(): void {
    if (!this.selectedCompanyId) return;
    
    this.loading = true;
    this.error = null;
    this.companyAnalysis = '';
    
    // Garantir que o grafo está inicializado
    if (!this.graphInitialized) {
      console.log('Inicializando grafo antes de carregar dados da empresa');
      this.setupGraph();
      
      // Se o grafo ainda não foi inicializado, espere e tente novamente
      if (!this.graphInitialized) {
        console.log('Aguardando inicialização do grafo antes de carregar dados da empresa...');
        setTimeout(() => this.loadCompanyGraph(), 500);
        return;
      }
    }
    
    // Limpar o gráfico anterior
    this.clearGraph();
      
    // Não usaremos timeout para evitar mensagens de erro por tempo de carregamento
    
    // Carregar vizinhança da empresa
    this.dataService.getCompanyNetworkAnalysis(this.selectedCompanyId).subscribe({
      next: (data) => {
        console.log('Company network data received:', data);
        
        if (data.graph_data) {
          this.graphNodes = data.graph_data.nodes || [];
          this.graphEdges = data.graph_data.links || [];
          
          // Log node and edge count to help troubleshooting
          console.log(`Loaded ${this.graphNodes.length} nodes and ${this.graphEdges.length} edges for company ${this.selectedCompanyId}`);
        }
        
        if (data.ai_analysis) {
          this.companyAnalysis = data.ai_analysis;
        } else {
          this.companyAnalysis = "Análise de cadeia de valor não disponível para esta empresa.";
        }
        
        // Renderizar o grafo da empresa somente se tivermos dados
        if (this.graphNodes.length > 0) {
          this.renderCompanyGraph(this.graphNodes, this.graphEdges, this.selectedCompanyId);
        } else {
          this.clearGraph();
          d3.select('#graph-container')
            .append('div')
            .attr('class', 'error-message')
            .style('position', 'absolute')
            .style('top', '50%')
            .style('left', '50%')
            .style('transform', 'translate(-50%, -50%)')
            .style('color', '#ec0000')
            .style('font-weight', 'bold')
            .text('Não foram encontrados dados de relacionamentos para esta empresa');
            
          this.error = 'Não foram encontrados dados de relações para esta empresa';
        }
        
        this.loading = false;
      },
      error: (error: Error) => {
        this.error = 'Erro ao carregar dados da empresa';
        this.loading = false;
        console.error('Error loading company data:', error);
        
        this.clearGraph();
        d3.select('#graph-container')
          .append('div')
          .attr('class', 'error-message')
          .style('position', 'absolute')
          .style('top', '50%')
          .style('left', '50%')
          .style('transform', 'translate(-50%, -50%)')
          .style('color', '#ec0000')
          .style('font-weight', 'bold')
          .text('Erro ao carregar dados da empresa. Tente novamente.');
      }
    });
  }

  // Configuração inicial do gráfico
  private setupGraph(): void {
    if (this.graphInitialized) {
      console.log('Grafo já foi inicializado');
      return;
    }
    
    console.log('Configurando ferramentas de gráfico D3');
    
    // Buscar elemento do gráfico usando diferentes métodos
    let graphElement = document.getElementById('graph-container');
    
    // Se não encontrar por ID, tentar por seletor CSS
    if (!graphElement) {
      console.warn('Elemento não encontrado por ID, tentando por seletor CSS...');
      const elements = document.querySelectorAll('#graph-container');
      if (elements && elements.length > 0) {
        graphElement = elements[0] as HTMLElement;
        console.log('Elemento encontrado por seletor CSS');
      } else {
        console.error('Elemento #graph-container não encontrado no DOM por nenhum método!');
      }
    }
    
    if (!graphElement) {
      // Limite de tentativas para evitar loop infinito
      const maxRetries = 3;
      const currentRetries = (this as any)._graphRetries || 0;
      
      if (currentRetries < maxRetries) {
        (this as any)._graphRetries = currentRetries + 1;
        console.log(`Tentativa ${currentRetries + 1} de ${maxRetries} para inicializar o grafo...`);
        
        // Aumentar o tempo de espera progressivamente
        const waitTime = 500 * (currentRetries + 1);
        console.log(`Aguardando ${waitTime}ms antes da próxima tentativa`);
        
        setTimeout(() => this.setupGraph(), waitTime);
      } else {
        console.error(`Falha após ${maxRetries} tentativas. O elemento #graph-container não foi encontrado no DOM.`);
        this.error = 'Erro ao inicializar o gráfico. Por favor, recarregue a página.';
      }
      return;
    }
    
    // Se chegou aqui, o elemento foi encontrado
    (this as any)._graphRetries = 0; // Reset retry counter on success
    console.log('Elemento #graph-container encontrado com dimensões:', 
              graphElement.offsetWidth, 'x', graphElement.offsetHeight);
    
    try {
      // Inicializar D3 dentro de um bloco try-catch para capturar erros de inicialização
      this.color = d3.scaleOrdinal(d3.schemeCategory10);
      
      this.zoom = d3.zoom()
        .scaleExtent([0.1, 10])
        .on('zoom', (event: any) => {
          try {
            const transform = event.transform;
            const container = d3.select('g.graph-container');
            if (!container.empty()) {
              container.attr('transform', transform);
            }
          } catch (error) {
            console.error('Erro durante zoom:', error);
          }
        });
        
      // Criar tooltip
      // Remover qualquer tooltip existente antes
      d3.select('body').selectAll('.graph-tooltip').remove();
      
      this.tooltip = d3.select('body').append('div')
        .attr('class', 'graph-tooltip')
        .style('opacity', 0);
        
      // Adicionar também um SVG básico ao container como placeholder
      // para garantir que ele está funcionando
      const container = d3.select('#graph-container');
      if (container.select('svg').empty()) {
        container.append('svg')
          .attr('width', '100%')
          .attr('height', '100%')
          .append('text')
          .attr('x', '50%')
          .attr('y', '50%')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .style('font-size', '14px')
          .style('fill', '#666')
          .text('Gráfico pronto para visualização de dados');
      }
        
      this.graphInitialized = true;
      console.log('Grafo inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar o grafo D3:', error);
      this.error = 'Erro ao inicializar a visualização. Por favor, recarregue a página.';
    }
  }

  // Limpa o gráfico
  clearGraph(): void {
    try {
      // Verificar se o elemento existe primeiro através do DOM padrão
      const graphDomElement = document.getElementById('graph-container');
      if (!graphDomElement) {
        console.warn('clearGraph: elemento #graph-container não encontrado no DOM');
        return;
      }
      
      // Usar D3 para limpar o conteúdo
      const container = d3.select('#graph-container');
      if (!container.empty()) {
        console.log('Limpando conteúdo do gráfico');
        container.selectAll('*').remove();
        
        // Não adicionamos mais um placeholder SVG aqui, pois isso pode estar
        // interferindo com a renderização do grafo real
        console.log('Conteúdo do gráfico limpo - pronto para nova renderização');
          
      } else {
        console.warn('Não foi possível limpar o gráfico: seletor D3 para #graph-container não encontrado');
      }
      
      // Reset das variáveis de estado do gráfico
      (this as any)._loggedElements = false;
    } catch (error) {
      console.error('Erro ao limpar o gráfico:', error);
    }
  }

  // Renderiza o gráfico de ecossistema
  private renderGraph(nodes: any[], links: any[]): void {
    console.log('Entrando em renderGraph com', nodes?.length || 0, 'nós e', links?.length || 0, 'links');
    
    if (!nodes || nodes.length === 0) {
      console.warn('No nodes provided to renderGraph');
      this.clearGraph();
      d3.select('#graph-container')
        .append('div')
        .attr('class', 'error-message')
        .style('position', 'absolute')
        .style('top', '50%')
        .style('left', '50%')
        .style('transform', 'translate(-50%, -50%)')
        .style('color', '#ec0000')
        .style('font-weight', 'bold')
        .text('Não há dados de grafo para exibir');
      return;
    }
    
    this.clearGraph();
    
    // Não exibiremos mensagem de carregamento
    
    // Configuração básica do SVG
    console.log('Criando SVG para visualização do grafo');
    this.svg = d3.select('#graph-container')
      .append('svg')
      .attr('width', '100%')
      .attr('height', this.height)
      .attr('viewBox', [0, 0, this.width, this.height])
      .style('border', '1px solid #ddd') // Ajuda a visualizar a área do SVG
      .style('background-color', '#fff') // Fundo branco para melhor visualização
      .call(this.zoom as any);
    
    // Verificar se o SVG foi criado corretamente e tem dimensões visíveis
    const svgNode = this.svg.node();
    if (svgNode) {
      const svgRect = svgNode.getBoundingClientRect();
      console.log(`SVG criado com dimensões: ${svgRect.width}x${svgRect.height}px`);
    }
    
    const g = this.svg.append('g')
      .attr('class', 'graph-container')
      .style('transform-origin', 'center');
    
    // Limitar e selecionar nós mais importantes para visualização
    // Ordena por grau (número de conexões) e pega os mais conectados primeiro
    const nodeConnections = new Map();
    
    // Contar conexões por nó
    links.forEach(link => {
      const source = typeof link.source === 'object' ? link.source.id : link.source;
      const target = typeof link.target === 'object' ? link.target.id : link.target;
      
      if (source) {
        nodeConnections.set(source, (nodeConnections.get(source) || 0) + 1);
      }
      if (target) {
        nodeConnections.set(target, (nodeConnections.get(target) || 0) + 1);
      }
    });
    
    // Usar o limite configurado pelo usuário (ou valor padrão)
    // Mais nós mostrados no modo de performance normal
    const nodesToShow = this.highPerformanceMode ? Math.min(this.limit / 2, 100) : this.limit;
    console.log(`Exibindo até ${nodesToShow} nós`);
    
    // Filtrar nós por importância (número de conexões)
    const safeNodes = nodes
      .filter(n => n && n.id)
      .sort((a, b) => (nodeConnections.get(b.id) || 0) - (nodeConnections.get(a.id) || 0))
      .slice(0, nodesToShow);
    
    // Criar mapa de nós para resolução rápida
    const nodeMap = new Map(safeNodes.map(d => [d.id, d]));
    const nodeIds = new Set(safeNodes.map(d => d.id));
    
    // Filtrar links para incluir apenas os conectados aos nós selecionados
    const safeLinks = links
      .filter(l => l && l.source && l.target)
      .filter(l => {
        const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
        const targetId = typeof l.target === 'object' ? l.target.id : l.target;
        return nodeIds.has(sourceId) && nodeIds.has(targetId);
      })
      .slice(0, nodesToShow * 4); // Limitar número de arestas por nó
    
    // Prepare data for D3
    try {
      const linksData = safeLinks.map(d => {
        // Handle source/target whether they're strings or objects
        const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
        const targetId = typeof d.target === 'object' ? d.target.id : d.target;
        
        return {
          source: nodeMap.get(sourceId) || sourceId,
          target: nodeMap.get(targetId) || targetId,
          value: d.value || 1,
          type: d.type
        };
      });
      
      // Criar links
      this.link = g.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(linksData)
        .enter().append('line')
        .attr('stroke-width', (d: any) => Math.sqrt(d.value) / 500 + 1)
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6);
      
      // Criar nós com tamanhos variáveis baseados na centralidade (número de conexões)
      console.log(`Criando ${safeNodes.length} nós no gráfico...`);
      
      // Criar um grupo para os nós
      const nodesGroup = g.append('g')
        .attr('class', 'nodes');
      
      // Criar os nós (círculos)  
      this.node = nodesGroup.selectAll('circle')
        .data(safeNodes)
        .enter()
        .append('circle')
        .attr('r', (d: any) => {
          // Ajustar tamanho baseado na quantidade de conexões
          const connections = nodeConnections.get(d.id) || 0;
          return Math.min(Math.max(3, Math.sqrt(connections) + 3), 10);
        })
        .attr('fill', (d: any) => {
          // Usar cores diferentes para nós altamente conectados
          const connections = nodeConnections.get(d.id) || 0;
          return connections > 10 ? '#ec0000' : this.color(d.id.charAt(0));
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .call(this.drag() as any);
      
      // Verificar se os nós foram criados
      console.log(`Nós criados: ${nodesGroup.selectAll('circle').size()}`);
      
      // Adicionar interatividade
      this.node
        .on('mouseover', (event: any, d: any) => {
          // Destacar o nó quando hover
          d3.select(event.currentTarget).attr('stroke', '#ec0000').attr('stroke-width', 2);
          
          this.tooltip.transition()
            .duration(100) // Mais rápido
            .style('opacity', .9);
            
          // Mostrar também o número de conexões
          const connections = nodeConnections.get(d.id) || 0;
          this.tooltip.html(`${d.id}<br>Conexões: ${connections}`)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', (event: any) => {
          d3.select(event.currentTarget).attr('stroke', '#fff').attr('stroke-width', 1.5);
          this.tooltip.transition()
            .duration(200)
            .style('opacity', 0);
        })
        .on('click', (event: any, d: any) => {
          if (this.analysisView === 'ecosystem') {
            this.selectedCompanyId = d.id;
            this.analysisView = 'company';
            this.loadCompanyGraph();
          }
        });
      
      // Não há mensagem de carregamento para remover
      
      // Iniciar simulação com parâmetros otimizados para performance
      console.log('Iniciando simulação D3 para posicionar os nós...');
      this.simulation = d3.forceSimulation(safeNodes)
        .alphaDecay(0.05) // Acelera a convergência da simulação
        .velocityDecay(0.4) // Maior amortecimento para estabilizar mais rápido
        .force('link', d3.forceLink(linksData).id((d: any) => d.id).distance(50).strength(1))
        .force('charge', d3.forceManyBody().strength(-300).distanceMax(150)) // Limite de distância para cálculo de força
        .force('center', d3.forceCenter(this.width / 2, this.height / 2))
        .force('collision', d3.forceCollide().radius(8)) // Evita sobreposição de nós
        .force('x', d3.forceX(this.width / 2).strength(0.2))
        .force('y', d3.forceY(this.height / 2).strength(0.2))
        .stop() // Parar simulação para executar ticks manualmente
        .on('end', () => console.log('Simulação concluída'));
        
      // Executar um número fixo de ticks imediatamente para posicionar os nós
      // Em modo de alta performance, executamos mais ticks antes de renderizar
      const preRenderTicks = this.highPerformanceMode ? 100 : 50;
      console.log(`Pré-renderização com ${preRenderTicks} ticks`); 
      for (let i = 0; i < preRenderTicks; i++) {
        this.simulation.tick();
      }
      
      console.log('Aplicando posições calculadas aos elementos visuais...');
      this.ticked(); // Aplicar as posições calculadas
      
      // Verificar se os elementos estão sendo renderizados corretamente
      console.log(`Nós renderizados: ${g.selectAll('circle').size()}, Links renderizados: ${g.selectAll('line').size()}`);
      
      // Garantir que os elementos são visíveis - ajustar opacidade
      g.selectAll('circle').style('opacity', 1);
      g.selectAll('line').style('opacity', 0.6);
      
      // Em modo de alta performance, não continuamos a simulação
      if (!this.highPerformanceMode) {
        console.log('Continuando simulação com ticks dinâmicos');
        this.simulation.restart()
          .on('tick', () => this.ticked());
      } else {
        console.log('Simulação estática concluída');
      }
    } catch (error) {
      console.error('Error rendering graph:', error);
      this.error = 'Erro ao renderizar o grafo';
    }
  }

  // Renderiza o gráfico de uma empresa específica
  private renderCompanyGraph(nodes: any[], links: any[], centralId: string): void {
    if (!nodes || nodes.length === 0 || !centralId) {
      console.warn('Invalid data provided to renderCompanyGraph');
      return;
    }
    
    this.clearGraph();
    
    // Não exibiremos mensagem de carregamento
    
    // Configuração básica do SVG
    console.log('Criando SVG para visualização do grafo da empresa');
    this.svg = d3.select('#graph-container')
      .append('svg')
      .attr('width', '100%')
      .attr('height', this.height)
      .attr('viewBox', [0, 0, this.width, this.height])
      .style('border', '1px solid #ddd') // Ajuda a visualizar a área do SVG
      .style('background-color', '#fff') // Fundo branco para melhor visualização
      .call(this.zoom as any);
    
    // Verificar se o SVG foi criado corretamente e tem dimensões visíveis
    const svgNode = this.svg.node();
    if (svgNode) {
      const svgRect = svgNode.getBoundingClientRect();
      console.log(`SVG para grafo da empresa criado com dimensões: ${svgRect.width}x${svgRect.height}px`);
    }
    
    const g = this.svg.append('g')
      .attr('class', 'graph-container')
      .style('transform-origin', 'center');
    
    try {
      // Ensure nodes have proper structure
      const safeNodes = nodes.filter(n => n && n.id);
      
      // Prepare node map for link resolution
      const nodeMap = new Map(safeNodes.map(d => [d.id, d]));
      
      // Filter links to only include those with valid source and target
      const safeLinks = links.filter(l => l && l.source && l.target);
      
      // Preparar dados para D3
      const linksData = safeLinks.map(d => {
        // Handle source/target whether they're strings or objects
        const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
        const targetId = typeof d.target === 'object' ? d.target.id : d.target;
        
        return {
          source: nodeMap.get(sourceId) || sourceId,
          target: nodeMap.get(targetId) || targetId,
          value: d.value || 1,
          type: d.type
        };
      });
      
      // Cor baseada no tipo de nó (central, cliente, fornecedor)
      const nodeColor = (d: any) => {
        if (d.id === centralId) return '#ff4b4b'; // central
        if (d.type === 'cliente') return '#28a745'; // cliente
        if (d.type === 'fornecedor') return '#007bff'; // fornecedor
        return '#666'; // outros
      };
      
      // Tamanho baseado no tipo
      const nodeSize = (d: any) => {
        if (d.id === centralId) return 12;
        return 6;
      };
      
      // Criar links
      this.link = g.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(linksData)
        .enter().append('line')
        .attr('stroke-width', 2)
        .attr('stroke', (d: any) => {
          try {
            // Try to determine link type
            const sourceObj = typeof d.source === 'object' ? d.source : null;
            const sourceType = sourceObj?.type || '';
            
            if (sourceType === 'cliente') return '#28a745';
            if (d.type === 'cliente') return '#28a745';
            return '#007bff'; // default to fornecedor color
          } catch (e) {
            return '#007bff'; // default color
          }
        })
        .attr('stroke-opacity', 0.6);
      
      // Criar nós
      this.node = g.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(safeNodes)
        .enter().append('circle')
        .attr('r', (d: any) => nodeSize(d))
        .attr('fill', (d: any) => nodeColor(d))
        .call(this.drag() as any)
        .on('mouseover', (event: any, d: any) => {
          this.tooltip.transition()
            .duration(200)
            .style('opacity', .9);
          
          let tipText = d.id;
          if (d.id === centralId) tipText += ' (Empresa focal)';
          else if (d.type === 'cliente') tipText += ' (Cliente)';
          else if (d.type === 'fornecedor') tipText += ' (Fornecedor)';
          
          this.tooltip.html(tipText)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', () => {
          this.tooltip.transition()
            .duration(500)
            .style('opacity', 0);
        });
      
      // Adicionar rótulos para nós
      g.append('g')
        .attr('class', 'labels')
        .selectAll('text')
        .data(safeNodes)
        .enter().append('text')
        .attr('dx', 12)
        .attr('dy', '.35em')
        .text((d: any) => d.id === centralId ? d.id : '')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#333');
      
      // Iniciar simulação com otimizações para performance
      this.simulation = d3.forceSimulation(safeNodes)
        .alphaDecay(0.05) // Acelera a convergência da simulação
        .velocityDecay(0.4) // Maior amortecimento
        .force('link', d3.forceLink(linksData).id((d: any) => d.id).distance(80).strength(1))
        .force('charge', d3.forceManyBody().strength(-250).distanceMax(150))
        .force('center', d3.forceCenter(this.width / 2, this.height / 2))
        .force('collision', d3.forceCollide().radius(10)) 
        .force('x', d3.forceX(this.width / 2).strength(0.2))
        .force('y', d3.forceY(this.height / 2).strength(0.2))
        .stop(); // Parar simulação para executar ticks manualmente
      
      // Executar ticks imediatamente para posicionar os nós
      const preRenderTicks = this.highPerformanceMode ? 120 : 60;
      console.log(`Pré-renderização do grafo da empresa com ${preRenderTicks} ticks`);
      for (let i = 0; i < preRenderTicks; i++) {
        this.simulation.tick();
      }
      
      this.ticked(); // Aplicar as posições calculadas
      
      // Em modo de alto desempenho, não continuamos a simulação
      if (!this.highPerformanceMode) {
        this.simulation.restart()
          .on('tick', () => this.ticked());
      }
    } catch (error) {
      console.error('Error rendering company graph:', error);
      this.error = 'Erro ao renderizar o grafo da empresa';
    }
  }

  // Atualiza posições no tick da simulação
  private ticked(): void {
    try {
      // Verificar se temos elementos para atualizar
      if (!this.link || !this.node) {
        console.warn('ticked: links ou nós não definidos');
        return;
      }
      
      // Log visual elements once to help debugging
      if (!(this as any)._loggedElements) {
        const linkElements = this.link.nodes();
        const nodeElements = this.node.nodes();
        console.log(`ticked: Atualizando ${nodeElements.length} nós e ${linkElements.length} links`);
        (this as any)._loggedElements = true;
      }
      
      // Atualizar posições dos links
      this.link
        .attr('x1', (d: any) => {
          return typeof d.source === 'object' ? (d.source?.x || 0) : 0;
        })
        .attr('y1', (d: any) => {
          return typeof d.source === 'object' ? (d.source?.y || 0) : 0;
        })
        .attr('x2', (d: any) => {
          return typeof d.target === 'object' ? (d.target?.x || 0) : 0;
        })
        .attr('y2', (d: any) => {
          return typeof d.target === 'object' ? (d.target?.y || 0) : 0;
        });
      
      // Atualizar posições dos nós
      this.node
        .attr('cx', (d: any) => d?.x || 0)
        .attr('cy', (d: any) => d?.y || 0);
      
      // Atualizar também as labels com seleção mais específica para evitar conflitos
      const container = d3.select('#graph-container');
      const labels = container.select('g.graph-container').select('.labels').selectAll('text');
      
      if (!labels.empty()) {
        labels
          .attr('x', (d: any) => d?.x || 0)
          .attr('y', (d: any) => d?.y || 0);
      }
    } catch (error) {
      console.error('Error during graph tick:', error);
    }
  }

  // Função para arrastar nós
  private drag(): any {
    const dragstarted = (event: any, d: any) => {
      if (!event.active) this.simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    };

    const dragged = (event: any, d: any) => {
      d.fx = event.x;
      d.fy = event.y;
    };

    const dragended = (event: any, d: any) => {
      if (!event.active) this.simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    };

    return d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  // Formatar percentual
  formatPercentage(value: number): string {
    return (value * 100).toFixed(1) + '%';
  }

  // Alternar threshold
  updateThreshold(value: number): void {
    this.threshold = value;
    if (this.analysisView === 'ecosystem') {
      this.loadEcosystemGraph();
    }
  }

  // Alternar limite
  updateLimit(value: number): void {
    this.limit = value;
    if (this.analysisView === 'ecosystem') {
      this.loadEcosystemGraph();
    }
  }
  
  // Alternar modo de desempenho
  togglePerformanceMode(): void {
    console.log(`Modo de alto desempenho ${this.highPerformanceMode ? 'ativado' : 'desativado'}`);
    if (this.analysisView === 'ecosystem') {
      this.loadEcosystemGraph();
    } else if (this.selectedCompanyId) {
      this.loadCompanyGraph();
    }
  }
}