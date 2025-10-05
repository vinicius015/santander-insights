import pandas
import numpy
from sklearn.cluster import KMeans
from sklearn.discriminant_analysis import StandardScaler
from sklearn.linear_model import LinearRegression

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