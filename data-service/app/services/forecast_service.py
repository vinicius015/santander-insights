import pandas as pd
from app.services.data_store import data_store
from fastapi import HTTPException
from sklearn.linear_model import LinearRegression

def _prever_fluxo_caixa(hist_df, coluna, n_meses):
    if len(hist_df) < 2:
        last = hist_df[coluna].iloc[-1] if len(hist_df) > 0 else 0
        future = [last] * n_meses
    else:
        x = pd.Series(range(len(hist_df))).values.reshape(-1, 1)
        y = hist_df[coluna].values.reshape(-1, 1)
        model = LinearRegression().fit(x, y)
        future_x = pd.Series(range(len(hist_df), len(hist_df) + n_meses)).values.reshape(-1, 1)
        future = model.predict(future_x).flatten()
    future_dates = pd.date_range(hist_df['ano_mes'].max(), periods=n_meses+1, freq='ME')[1:]
    future_dates = future_dates.strftime('%Y-%m')
    return pd.DataFrame({'ano_mes': future_dates, coluna: future})

def get_cashflow_forecast(company_id: str, n_months: int):
    base = data_store.monthly_cashflow_summary
    if base is None:
        raise HTTPException(status_code=500, detail="Dados de fluxo de caixa não carregados.")
    hist_id = base[base['id'] == company_id].sort_values('ano_mes')
    if hist_id.empty:
        raise HTTPException(status_code=404, detail="Empresa não encontrada ou sem histórico.")
    previsao_receita = _prever_fluxo_caixa(hist_id, 'receita', n_months)
    previsao_despesa = _prever_fluxo_caixa(hist_id, 'despesa', n_months)
    df_previsao = pd.merge(previsao_receita, previsao_despesa, on='ano_mes')
    df_previsao['fluxo_liq'] = df_previsao['receita'] - df_previsao['despesa']

    kpis = {
        'total_receita_prevista': float(df_previsao['receita'].sum()),
        'total_despesa_prevista': float(df_previsao['despesa'].sum()),
        'total_fluxo_previsto': float(df_previsao['fluxo_liq'].sum())
    }
    return {
        'kpis': kpis,
        'historico': hist_id[['ano_mes', 'receita', 'despesa', 'fluxo_liq']].to_dict(orient='records'),
        'previsao': df_previsao.to_dict(orient='records')
    }
