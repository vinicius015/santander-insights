import pandas
import numpy
from sklearn.cluster import KMeans
from sklearn.discriminant_analysis import StandardScaler
from sklearn.linear_model import LinearRegression

def features_cashflow(trans):
    df = trans.copy()
    df['dt_refe'] = pandas.to_datetime(df['dt_refe'])
    df['ano_mes'] = df['dt_refe'].dt.to_period('M').astype(str)
    recebimentos = df.groupby(['id_rcbe', 'ano_mes'])['vl'].sum().reset_index().rename(columns={'id_rcbe': 'id', 'vl': 'receita'})
    pagamentos = df.groupby(['id_pgto', 'ano_mes'])['vl'].sum().reset_index().rename(columns={'id_pgto': 'id', 'vl': 'despesa'})
    base = pandas.merge(recebimentos, pagamentos, on=['id', 'ano_mes'], how='outer').fillna(0)
    base['fluxo_liq'] = base['receita'] - base['despesa']
    base['margem'] = base['fluxo_liq'] / base['receita'].replace(0, numpy.nan)
    base['margem'] = base['margem'].fillna(0)
    return base.sort_values(['id', 'ano_mes'])

def clusterizar_empresas_kmeans(base, empresas):
    df_features = _criar_features_para_cluster(base, empresas)
    features_para_modelo = df_features[['idade', 'receita_media_6m', 'despesa_media_6m', 'crescimento_receita_3m', 'margem_media_6m', 'volatilidade_receita']]
    
    scaler = StandardScaler()
    features_padronizadas = scaler.fit_transform(features_para_modelo)
    
    kmeans = KMeans(n_clusters=4, random_state=42, n_init='auto')
    df_features['cluster'] = kmeans.fit_predict(features_padronizadas)
    
    df_analise_clusters = df_features.groupby('cluster')[['idade', 'crescimento_receita_3m', 'margem_media_6m', 'receita_media_6m']].mean().sort_values('receita_media_6m').reset_index()
    
    nomes_clusters = {
        df_analise_clusters.loc[0, 'cluster']: 'Início',
        df_analise_clusters.loc[1, 'cluster']: 'Declínio',
        df_analise_clusters.loc[2, 'cluster']: 'Crescimento',
        df_analise_clusters.loc[3, 'cluster']: 'Maturidade'
    }
    
    df_features['momento'] = df_features['cluster'].map(nomes_clusters)
    return df_features


def _criar_features_para_cluster(cashflow_df, companies_df):
    try:
        print(cashflow_df.columns.tolist())

        perfil_financeiro = cashflow_df.groupby('id').agg(
            receita_media_6m=('receita', lambda x: x.tail(6).mean()),
            despesa_media_6m=('despesa', lambda x: x.tail(6).mean()),
            crescimento_receita_3m=('receita', lambda x: _calcular_tendencia(x.tail(3))),
            margem_media_6m=('margem', lambda x: x.tail(6).mean()),
            volatilidade_receita=('receita', lambda x: x.tail(6).std())
        ).reset_index()

        print(perfil_financeiro.columns.tolist())

        data_referencia = pandas.to_datetime('2024-01-01')
        empresas_copy = companies_df.copy()
        
        print(empresas_copy.columns.tolist())
        
        empresas_copy['idade'] = (data_referencia - empresas_copy['dt_abrt']).dt.days / 365.25
        
        perfil_completo = pandas.merge(perfil_financeiro, empresas_copy[['id', 'idade', 'ds_cnae']].drop_duplicates(subset='id'), on='id', how='left')
        
        print(perfil_completo.columns.tolist())

        perfil_completo.fillna(0, inplace=True)
        perfil_completo.replace([numpy.inf, -numpy.inf], 0, inplace=True)
        
        
        return perfil_completo

    except Exception as e:
        print(f"\n\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        print(f"!!!!!! OCORREU UM ERRO GRAVE DENTRO DE _criar_features_para_cluster !!!!!!")
        import traceback
        print("!!!!!! O traceback real do erro é:                          !!!!!!")
        print(traceback.format_exc())
        print(f"!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n\n")
        raise e

def _calcular_tendencia(serie):
    if len(serie) < 2: return 0
    x = numpy.arange(len(serie)).reshape(-1, 1)
    y = serie.values.reshape(-1, 1)
    modelo = LinearRegression().fit(x, y)
    return modelo.coef_[0][0]