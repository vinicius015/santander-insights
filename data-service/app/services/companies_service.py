import pandas
import numpy
from sklearn.cluster import KMeans
from sklearn.discriminant_analysis import StandardScaler
from sklearn.linear_model import LinearRegression
from app.services.data_store import data_store

def get_company_ids_service():
    profiles_df = data_store.all_companies_profiles
    ids = sorted(profiles_df["id"].unique())
    return {"company_ids": ids}

def get_company_details_service(company_id: str):
    profiles_df = data_store.all_companies_profiles
    transactions_df = data_store.transactions_df

    if company_id not in profiles_df["id"].values:
        return None
    profile = profiles_df[profiles_df["id"] == company_id].iloc[0]
    sector = profile["ds_cnae"]

    sector_profiles = profiles_df[profiles_df["ds_cnae"] == sector]
    sector_means = sector_profiles[["receita_media_6m", "margem_media_6m"]].mean()

    kpis = {
        "moment": profile["momento"],
        "average_margin_6m": profile["margem_media_6m"]
    }

    benchmarking = {
        "company_average_revenue_6m": profile["receita_media_6m"],
        "sector_average_revenue_6m": sector_means["receita_media_6m"],
        "company_average_margin_6m": profile["margem_media_6m"],
        "sector_average_margin_6m": sector_means["margem_media_6m"]
    }

    monthly_cashflow = create_monthly_cashflow_summary(transactions_df)
    hist_id = monthly_cashflow[monthly_cashflow["id"] == company_id].sort_values("ano_mes")
    if not hist_id.empty:
        history = hist_id[["ano_mes", "receita", "despesa", "fluxo_liq"]].rename(columns={"ano_mes": "date"}).to_dict(orient="records")
        def linear_trend(col):
            s = hist_id[col]
            if len(s) < 2:
                return 0
            x = numpy.arange(len(s)).reshape(-1, 1)
            y = s.values.reshape(-1, 1)
            model = LinearRegression().fit(x, y)
            return float(model.coef_[0][0])
        cashflow_trends = {
            "receita": linear_trend("receita"),
            "despesa": linear_trend("despesa"),
            "fluxo_liq": linear_trend("fluxo_liq")
        }
    else:
        history = []
        cashflow_trends = {"receita": 0, "despesa": 0, "fluxo_liq": 0}

    revenue_mix = (transactions_df[transactions_df["id_rcbe"] == company_id]
                   .groupby("ds_tran")["vl"].sum().sort_values(ascending=False).reset_index())
    total_revenue = revenue_mix["vl"].sum()
    revenue_mix["percentage"] = (revenue_mix["vl"] / total_revenue * 100) if total_revenue > 0 else 0
    revenue_distribution = revenue_mix.to_dict(orient="records")

    expense_mix = (transactions_df[transactions_df["id_pgto"] == company_id]
                   .groupby("ds_tran")["vl"].sum().sort_values(ascending=False).reset_index())
    total_expense = expense_mix["vl"].sum()
    expense_mix["percentage"] = (expense_mix["vl"] / total_expense * 100) if total_expense > 0 else 0
    expense_distribution = expense_mix.to_dict(orient="records")

    return {
        "company_id": company_id,
        "sector": sector,
        "kpis": kpis,
        "benchmarking": benchmarking,
        "history": history,
        "cashflow_trends": cashflow_trends,
        "revenue_distribution": revenue_distribution,
        "expense_distribution": expense_distribution
    }

def segment_companies_by_moment(monthly_cashflow_df, companies_df):
    company_profiles = _create_company_profiles(monthly_cashflow_df, companies_df)
    
    features_for_model = company_profiles[['idade', 'receita_media_6m', 'despesa_media_6m', 'crescimento_receita_3m', 'margem_media_6m', 'volatilidade_receita']]
    
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(features_for_model)
    
    kmeans_model = KMeans(n_clusters=4, random_state=42, n_init='auto')
    company_profiles['cluster'] = kmeans_model.fit_predict(scaled_features)
    
    cluster_analysis_df = company_profiles.groupby('cluster')[['idade', 'crescimento_receita_3m', 'margem_media_6m', 'receita_media_6m']].mean().sort_values('receita_media_6m').reset_index()
    
    cluster_names_map = {
        cluster_analysis_df.loc[0, 'cluster']: 'Início',
        cluster_analysis_df.loc[1, 'cluster']: 'Declínio',
        cluster_analysis_df.loc[2, 'cluster']: 'Crescimento',
        cluster_analysis_df.loc[3, 'cluster']: 'Maturidade'
    }
    
    company_profiles['momento'] = company_profiles['cluster'].map(cluster_names_map)
    
    return company_profiles

def _create_company_profiles(monthly_cashflow_df, companies_df):
    try:
        financial_profile = monthly_cashflow_df.groupby('id').agg(
            receita_media_6m=('receita', lambda x: x.tail(6).mean()),
            despesa_media_6m=('despesa', lambda x: x.tail(6).mean()),
            crescimento_receita_3m=('receita', lambda x: _calculate_linear_trend(x.tail(3))),
            margem_media_6m=('margem', lambda x: x.tail(6).mean()),
            volatilidade_receita=('receita', lambda x: x.tail(6).std())
        ).reset_index()

        reference_date = pandas.to_datetime('2024-01-01')
        companies_copy = companies_df.copy()
        
        companies_copy['idade'] = (reference_date - companies_copy['dt_abrt']).dt.days / 365.25
        
        company_profiles_df = pandas.merge(
            financial_profile, 
            companies_copy[['id', 'idade', 'ds_cnae']].drop_duplicates(subset='id'), 
            on='id', 
            how='left'
        )
        
        company_profiles_df.fillna(0, inplace=True)
        company_profiles_df.replace([numpy.inf, -numpy.inf], 0, inplace=True)
        
        return company_profiles_df

    except Exception as e:
        print(f"\n\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        print(f"!!!!!! AN ERROR OCCURRED INSIDE _create_company_profiles !!!!!!")
        import traceback
        print("!!!!!! The actual error traceback is:                        !!!!!!")
        print(traceback.format_exc())
        print(f"!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n\n")
        raise e

def create_monthly_cashflow_summary(transactions_df):
    cashflow_df = transactions_df.copy()
    cashflow_df['dt_refe'] = pandas.to_datetime(cashflow_df['dt_refe'])
    cashflow_df['ano_mes'] = cashflow_df['dt_refe'].dt.to_period('M').astype(str)
    
    monthly_revenue = cashflow_df.groupby(['id_rcbe', 'ano_mes'])['vl'].sum().reset_index().rename(columns={'id_rcbe': 'id', 'vl': 'receita'})
    monthly_expenses = cashflow_df.groupby(['id_pgto', 'ano_mes'])['vl'].sum().reset_index().rename(columns={'id_pgto': 'id', 'vl': 'despesa'})
    
    monthly_summary = pandas.merge(monthly_revenue, monthly_expenses, on=['id', 'ano_mes'], how='outer').fillna(0)
    
    monthly_summary['fluxo_liq'] = monthly_summary['receita'] - monthly_summary['despesa']
    monthly_summary['margem'] = monthly_summary['fluxo_liq'] / monthly_summary['receita'].replace(0, numpy.nan)
    monthly_summary['margem'] = monthly_summary['margem'].fillna(0)
    
    return monthly_summary.sort_values(['id', 'ano_mes'])

def _calculate_linear_trend(series):
    if len(series) < 2:
        return 0
        
    x = numpy.arange(len(series)).reshape(-1, 1)
    y = series.values.reshape(-1, 1)
    
    model = LinearRegression().fit(x, y)
    
    return model.coef_[0][0]