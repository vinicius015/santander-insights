import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface KPIs {
  total_companies: number;
  predominant_moment: {
    moment: string;
    percentage: number;
  };
  average_balance: number;
}

export interface MomentDistribution {
  moment: string;
  count: number;
}

export interface RevenueExpenseCluster {
  id: string;
  average_revenue_6m: number;
  average_expense_6m: number;
  moment: string;
  sector: string;
  average_margin_6m: number;
}

export interface MaturityAnalysis {
  maturity_range: string;
  average_revenue: number;
}

export interface TransactionAnalysis {
  transaction_type: string;
  value: number;
}

export interface SectorAnalysis {
  sector: string;
  total_revenue: number;
  company_count: number;
}

export interface DashboardData {
  kpis: KPIs;
  moment_distribution: MomentDistribution[];
  revenue_expense_clusters: RevenueExpenseCluster[];
  maturity_analysis: MaturityAnalysis[];
  transaction_analysis: TransactionAnalysis[];
  sector_analysis: SectorAnalysis[];
}

export interface Company {
  id: string;
  dt_abrt: string;
  dt_refe: string;
  vl_fatu: number;
  vl_sldo: number;
  ds_cnae: string;
}

export interface Sector {
  sector: string;
}

export interface CompanyProfile {
  id: string;
  momento: string;
  ds_cnae: string;
  receita_media_6m: number;
  margem_media_6m: number;
  despesa_media_6m: number;
}

export interface SectorBenchmark {
  receita_media_6m: number;
  margem_media_6m: number;
}

export interface CashflowHistory {
  ano_mes: string;
  receita: number;
  despesa: number;
  fluxo_liq: number;
}

export interface TransactionDistribution {
  ds_tran: string;
  vl: number;
  percentual: number;
}

export interface CompanyDetails {
  company_id: string;
  sector: string;
  kpis: {
    moment: string;
    average_margin_6m: number;
  };
  benchmarking: {
    company_average_revenue_6m: number;
    sector_average_revenue_6m: number;
    company_average_margin_6m: number;
    sector_average_margin_6m: number;
  };
  history: {
    date: string;
    receita: number;
    despesa: number;
    fluxo_liq: number;
  }[];
  cashflow_trends: {
    receita: number;
    despesa: number;
    fluxo_liq: number;
  };
  revenue_distribution: {
    ds_tran: string;
    vl: number;
    percentage: number;
  }[];
  expense_distribution: {
    ds_tran: string;
    vl: number;
    percentage: number;
  }[];
}

export interface CompanyAnalysis {
  profile: CompanyProfile;
  sector_benchmark: SectorBenchmark;
  cashflow_history: CashflowHistory[];
  revenue_distribution: TransactionDistribution[];
  expense_distribution: TransactionDistribution[];
  ai_diagnosis?: string;
}

export interface ForecastData {
  kpis: {
    total_receita_prevista: number;
    total_despesa_prevista: number;
    total_fluxo_previsto: number;
  };
  historico: {
    ano_mes: string;
    receita: number;
    despesa: number;
    fluxo_liq: number;
  }[];
  previsao: {
    ano_mes: string;
    receita: number;
    despesa: number;
    fluxo_liq: number;
  }[];
}

export interface ForecastAnalysis {
  forecast_data: ForecastData;
  ai_analysis?: string;
}

export interface GraphNode {
  id: string;
  name: string;
  type?: string; // 'central', 'cliente', 'fornecedor', etc.
  sector?: string;
  community?: number;
  centrality?: number;
  size?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  value: number;
  type?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface EcosystemAnalysis {
  graph_data: GraphData;
  ai_summary?: string;
  communities?: {
    id: number;
    key_companies: string[];
    size: number;
  }[];
  dependencies?: any[];
}

export interface CompanyNetworkAnalysis {
  company_id: string;
  graph_data: GraphData;
  ai_analysis?: string;
  key_relationships?: {
    company_id: string;
    company_name: string;
    relationship_strength: number;
    relationship_type: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private baseUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) { }

  getDashboardData(cnae: string = 'Todos os Setores'): Observable<DashboardData> {
    const params = new HttpParams().set('cnae', cnae);
    return this.http.get<DashboardData>(`${this.baseUrl}/dashboard`, { params });
  }

  getCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.baseUrl}/companies/`);
  }

  getSectors(): Observable<Sector[]> {
    return this.http.get<Sector[]>(`${this.baseUrl}/sectors/`);
  }

  getCompanyIds(): Observable<string[]> {
    return this.http.get<{company_ids: string[]}>(`${this.baseUrl}/companies/ids`)
      .pipe(map(response => response.company_ids));
  }

  getCompanyDetails(companyId: string): Observable<CompanyDetails> {
    return this.http.get<CompanyDetails>(`${this.baseUrl}/companies/${companyId}/details`);
  }

  getCompanyDiagnosis(companyId: string): Observable<{diagnosis: string}> {
    return this.http.get<{diagnosis: string}>(`${this.baseUrl}/ai/diagnosis/${companyId}`);
  }

  getCompanyAnalysis(companyId: string): Observable<CompanyAnalysis> {
    return forkJoin({
      details: this.getCompanyDetails(companyId),
      diagnosis: this.getCompanyDiagnosis(companyId)
    }).pipe(
      map(({details, diagnosis}) => {
        console.log('Raw details from API:', details);
        return {
        profile: {
          id: details.company_id,
          momento: details.kpis.moment,
          ds_cnae: details.sector,
          receita_media_6m: details.benchmarking.company_average_revenue_6m,
          margem_media_6m: details.benchmarking.company_average_margin_6m,
          despesa_media_6m: details.benchmarking.company_average_revenue_6m - (details.benchmarking.company_average_revenue_6m * details.benchmarking.company_average_margin_6m)
        },
        sector_benchmark: {
          receita_media_6m: details.benchmarking.sector_average_revenue_6m,
          margem_media_6m: details.benchmarking.sector_average_margin_6m
        },
        cashflow_history: details.history ? details.history.map((h: any) => ({
          ano_mes: h.date || h.ano_mes,
          receita: h.receita || 0,
          despesa: h.despesa || 0,
          fluxo_liq: h.fluxo_liq || (h.receita - h.despesa) || 0
        })) : [],
        revenue_distribution: details.revenue_distribution.map((r: any) => ({
          ds_tran: r.ds_tran,
          vl: r.vl,
          percentual: r.percentage
        })),
        expense_distribution: details.expense_distribution.map((e: any) => ({
          ds_tran: e.ds_tran,
          vl: e.vl,
          percentual: e.percentage
        })),
        ai_diagnosis: diagnosis.diagnosis
        } as CompanyAnalysis;
      })
    );
  }

  getForecastData(companyId: string, nMonths: number): Observable<ForecastData> {
    const params = new HttpParams().set('n_months', nMonths.toString());
    return this.http.get<ForecastData>(`${this.baseUrl}/forecast/${companyId}`, { params });
  }

  getForecastAIAnalysis(companyId: string, nMonths: number): Observable<{analysis: string}> {
    const params = new HttpParams().set('n_months', nMonths.toString());
    return this.http.get<{analysis: string}>(`${this.baseUrl}/ai/forecast/${companyId}`, { params });
  }

  getForecastAnalysis(companyId: string, nMonths: number): Observable<ForecastAnalysis> {
    return forkJoin({
      forecast: this.getForecastData(companyId, nMonths),
      aiAnalysis: this.getForecastAIAnalysis(companyId, nMonths)
    }).pipe(
      map(({forecast, aiAnalysis}) => {
        console.log('Raw forecast from API:', forecast);
        console.log('Raw AI analysis from API:', aiAnalysis);
        return {
          forecast_data: forecast,
          ai_analysis: aiAnalysis.analysis
        } as ForecastAnalysis;
      })
    );
  }
  
  // Graph Data and AI Analysis methods for Cadeia de Valor

  getEcosystemGraphData(): Observable<GraphData> {
    // Buscar nós e arestas separadamente e combinar os resultados
    return forkJoin({
      nodesResponse: this.http.get<{nodes: string[]}>(`${this.baseUrl}/graph/nodes`),
      edgesResponse: this.http.get<{edges: any[]}>(`${this.baseUrl}/graph/edges`)
    }).pipe(
      map(({nodesResponse, edgesResponse}) => {
        console.log(`Recebidos ${nodesResponse.nodes.length} nós e ${edgesResponse.edges.length} arestas do servidor`);
        
        // Verificação de dados válidos
        if (!nodesResponse.nodes || !edgesResponse.edges) {
          console.error('Dados inválidos recebidos do servidor:', { nodesResponse, edgesResponse });
          throw new Error('Dados inválidos recebidos do servidor');
        }
        
        // Calcular métricas básicas de centralidade baseadas na contagem de conexões
        const nodeConnections = new Map<string, number>();
        
        // Contar as conexões por nó
        edgesResponse.edges.forEach(edge => {
          if (edge.source) {
            nodeConnections.set(edge.source, (nodeConnections.get(edge.source) || 0) + 1);
          }
          if (edge.target) {
            nodeConnections.set(edge.target, (nodeConnections.get(edge.target) || 0) + 1);
          }
        });
        
        // Transform string node IDs into proper GraphNode objects with centrality metrics
        const nodes: GraphNode[] = nodesResponse.nodes.map(id => {
          const connections = nodeConnections.get(id) || 0;
          
          return {
            id: id,
            name: id,
            centrality: connections,
            // Tamanho proporcional à centralidade, com limites min/max
            size: Math.min(Math.max(3, Math.sqrt(connections) + 3), 10)
          };
        });
        
        // Transform edge data into proper GraphLink objects
        // Filtra arestas com valores muito baixos para reduzir a complexidade
        const links: GraphLink[] = edgesResponse.edges
          .filter(edge => edge && edge.source && edge.target && (edge.value > 0.05))
          .map(edge => ({
            source: edge.source,
            target: edge.target,
            value: edge.value || 1,
            type: edge.type
          }));
        
        console.log('Dados do grafo processados com sucesso:', { nodeCount: nodes.length, linkCount: links.length });
        
        // Garantir que temos algum dado para exibir
        if (nodes.length === 0) {
          console.warn('Nenhum nó foi encontrado nos dados retornados');
        }
        
        return { nodes, links } as GraphData;
      }),
      catchError(error => {
        console.error('Erro ao buscar dados do grafo:', error);
        return of({ nodes: [], links: [] });
      })
    );
  }

  getCompanyNetworkData(companyId: string, depth: number = 2): Observable<GraphData> {
    return this.http.get<any>(`${this.baseUrl}/graph/neighborhood/${companyId}`).pipe(
      map(data => {
        // Transformar formato do backend para o formato GraphData
        const nodes: GraphNode[] = [];
        const links: GraphLink[] = [];
        
        // Adicionar nó central
        nodes.push({
          id: data.id,
          name: data.id,
          type: 'central'
        });
        
        // Adicionar clientes e arestas
        if (data.clientes && Array.isArray(data.clientes)) {
          data.clientes.forEach((clienteId: string) => {
            nodes.push({
              id: clienteId,
              name: clienteId,
              type: 'cliente'
            });
            
            links.push({
              source: clienteId,
              target: data.id,
              value: 1,
              type: 'cliente'
            });
          });
        }
        
        // Adicionar fornecedores e arestas
        if (data.fornecedores && Array.isArray(data.fornecedores)) {
          data.fornecedores.forEach((fornecedorId: string) => {
            nodes.push({
              id: fornecedorId,
              name: fornecedorId,
              type: 'fornecedor'
            });
            
            links.push({
              source: data.id,
              target: fornecedorId,
              value: 1,
              type: 'fornecedor'
            });
          });
        }
        
        console.log('Processed company network data:', { nodes, links, originalData: data });
        return {
          nodes,
          links
        } as GraphData;
      }),
      catchError(error => {
        console.error('Error fetching company network data:', error);
        return of({ 
          nodes: [{ id: companyId, name: companyId, type: 'central' }],
          links: []
        });
      })
    );
  }

  getEcosystemAISummary(): Observable<{summary: string}> {
    return this.http.get<{summary: string}>(`${this.baseUrl}/graph-ai/ecosystem-summary`).pipe(
      catchError(error => {
        console.warn('Erro ao buscar sumário do ecossistema:', error);
        return of({ summary: 'Análise do ecossistema não disponível no momento.' });
      })
    );
  }

  getCompanyNetworkAIAnalysis(companyId: string, depth: number = 2): Observable<{analysis: string}> {
    const params = new HttpParams().set('depth', depth.toString());
    return this.http.get<{analysis: string}>(`${this.baseUrl}/graph-ai/company-analysis/${companyId}`, { params });
  }

  getEcosystemAnalysis(): Observable<EcosystemAnalysis> {
    console.log('Iniciando requisição de dados do ecossistema');
    
    return forkJoin({
      graphData: this.getEcosystemGraphData(),
      aiSummary: this.getEcosystemAISummary(),
      dependencies: this.http.get<{dependencies: any[]}>(`${this.baseUrl}/graph/dependencies`)
        .pipe(
          catchError(error => {
            console.warn('Erro ao buscar dependências, usando array vazio:', error);
            return of({dependencies: []});
          })
        )
    }).pipe(
      map(({graphData, aiSummary, dependencies}) => {
        console.log('Todas as requisições de ecossistema concluídas com sucesso');
        
        // Since we don't have actual community data from the backend,
        // we'll create a simplified version based on available data
        const communities: {id: number, key_companies: string[], size: number}[] = [];
        
        const result = {
          graph_data: graphData,
          ai_summary: aiSummary?.summary || 'Análise do ecossistema não disponível no momento.',
          communities: communities,
          dependencies: dependencies?.dependencies || []
        } as EcosystemAnalysis;
        
        console.log('Dados de ecossistema processados:', { 
          nodesCount: result.graph_data?.nodes?.length || 0,
          linksCount: result.graph_data?.links?.length || 0,
          dependenciesCount: result.dependencies?.length || 0,
          hasSummary: !!result.ai_summary
        });
        
        return result;
      }),
      catchError(error => {
        console.error('Erro ao processar dados do ecossistema:', error);
        // Retornar um objeto vazio mas válido em caso de erro
        return of({
          graph_data: { nodes: [], links: [] },
          ai_summary: 'Não foi possível carregar a análise do ecossistema devido a um erro na conexão com o servidor.',
          communities: [],
          dependencies: []
        } as EcosystemAnalysis);
      })
    );
  }

  getCompanyNetworkAnalysis(companyId: string, depth: number = 2): Observable<CompanyNetworkAnalysis> {
    return forkJoin({
      graphData: this.getCompanyNetworkData(companyId, depth),
      aiAnalysis: this.getCompanyNetworkAIAnalysis(companyId, depth)
    }).pipe(
      map(({graphData, aiAnalysis}) => {
        // Extract key relationships
        const keyRelationships = this.extractKeyRelationships(graphData, companyId);
        
        return {
          company_id: companyId,
          graph_data: graphData,
          ai_analysis: aiAnalysis.analysis,
          key_relationships: keyRelationships
        } as CompanyNetworkAnalysis;
      }),
      catchError(error => {
        console.error('Error in company network analysis:', error);
        return of({
          company_id: companyId,
          graph_data: { 
            nodes: [{ id: companyId, name: companyId, type: 'central' }],
            links: []
          },
          ai_analysis: 'Não foi possível carregar a análise da cadeia de valor para esta empresa.',
          key_relationships: []
        } as CompanyNetworkAnalysis);
      })
    );
  }

  // Helper methods for processing graph data
  private extractCommunities(graphData: GraphData): {id: number, key_companies: string[], size: number}[] {
    const communitiesMap = new Map<number, string[]>();
    
    // Group nodes by community
    graphData.nodes.forEach(node => {
      if (node.community !== undefined) {
        if (!communitiesMap.has(node.community)) {
          communitiesMap.set(node.community, []);
        }
        communitiesMap.get(node.community)?.push(node.id);
      }
    });
    
    // Format communities
    return Array.from(communitiesMap.entries()).map(([id, companies]) => {
      // Sort companies by centrality to find key companies (top 3)
      const keyCompanies = graphData.nodes
        .filter(node => companies.includes(node.id))
        .sort((a, b) => (b.centrality || 0) - (a.centrality || 0))
        .slice(0, 3)
        .map(node => node.id);
      
      return {
        id,
        key_companies: keyCompanies,
        size: companies.length
      };
    });
  }

  private extractKeyRelationships(graphData: GraphData, companyId: string): {
    company_id: string;
    company_name: string;
    relationship_strength: number;
    relationship_type: string;
  }[] {
    if (!graphData || !graphData.links || !graphData.nodes) {
      return [];
    }
    
    // Handle both string and object references for source/target
    const normalizeId = (id: any): string => {
      if (typeof id === 'string') return id;
      if (id && typeof id === 'object' && id.id) return id.id;
      return '';
    };
    
    // Find all links connected to the company
    const relationships = graphData.links
      .filter(link => {
        const source = normalizeId(link.source);
        const target = normalizeId(link.target);
        return source === companyId || target === companyId;
      })
      .map(link => {
        const source = normalizeId(link.source);
        const target = normalizeId(link.target);
        const partnerId = source === companyId ? target : source;
        const partnerNode = graphData.nodes.find(node => node.id === partnerId);
        
        return {
          company_id: partnerId,
          company_name: partnerNode?.name || partnerId,
          relationship_strength: link.value || 1,
          relationship_type: link.type || 'transaction'
        };
      })
      .sort((a, b) => b.relationship_strength - a.relationship_strength)
      .slice(0, 10); // Top 10 relationships
      
    return relationships;
  }
}