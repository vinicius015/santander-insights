import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

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
}