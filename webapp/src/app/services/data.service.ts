import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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
}