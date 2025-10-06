import pandas as pd
from app.services.data_store import data_store


def get_dashboard_data(sector: str = "Todos os Setores"):
    profiles_df = data_store.all_companies_profiles
    companies_df = data_store.companies_df
    transactions_df = data_store.transactions_df

    filtered_profiles, filtered_transactions, filtered_companies = _filter_by_sector(profiles_df, transactions_df, companies_df, sector)
    kpis = _get_kpis(filtered_profiles, filtered_companies)
    moment_distribution = _get_moment_distribution(filtered_profiles)
    clusters = _get_clusters(filtered_profiles)
    maturity_analysis = _get_maturity_analysis(filtered_profiles)
    transaction_analysis = _get_transaction_analysis(filtered_transactions)
    sector_analysis = _get_sector_analysis(profiles_df)

    return {
        "kpis": kpis,
        "moment_distribution": moment_distribution,
        "revenue_expense_clusters": clusters,
        "maturity_analysis": maturity_analysis,
        "transaction_analysis": transaction_analysis,
        "sector_analysis": sector_analysis
    }

def _get_sector_list(profiles_df):
    return sorted(profiles_df['ds_cnae'].unique())

def _filter_by_sector(profiles_df, transactions_df, companies_df, sector):
    if sector == "Todos os Setores":
        return profiles_df, transactions_df, companies_df
    filtered_profiles = profiles_df[profiles_df['ds_cnae'] == sector]
    ids_in_sector = filtered_profiles['id'].unique()
    filtered_transactions = transactions_df[(transactions_df['id_pgto'].isin(ids_in_sector)) | (transactions_df['id_rcbe'].isin(ids_in_sector))]
    filtered_companies = companies_df[companies_df['id'].isin(ids_in_sector)]
    return filtered_profiles, filtered_transactions, filtered_companies

def _get_kpis(filtered_profiles, filtered_companies):
    total_companies = int(filtered_profiles['id'].nunique())
    if not filtered_profiles.empty:
        predominant_moment = filtered_profiles['momento'].mode()[0]
        share = float(filtered_profiles['momento'].value_counts(normalize=True).max())
    else:
        predominant_moment = "N/A"
        share = 0.0
    if not filtered_companies.empty:
        average_balance = float(filtered_companies.groupby("id")['vl_sldo'].last().mean())
    else:
        average_balance = 0.0
    return {
        "total_companies": total_companies,
        "predominant_moment": {
            "moment": predominant_moment,
            "percentage": int(share * 100)
        },
        "average_balance": int(average_balance)
    }

def _get_moment_distribution(filtered_profiles):
    moment_dist = filtered_profiles['momento'].value_counts().reset_index()
    moment_dist.columns = ['moment', 'count']
    return moment_dist.to_dict(orient='records')

def _get_clusters(filtered_profiles):
    clusters = []
    if not filtered_profiles.empty:
        for _, row in filtered_profiles.iterrows():
            clusters.append({
                "id": row["id"],
                "average_revenue_6m": float(row.get("receita_media_6m", 0)),
                "average_expense_6m": float(row.get("despesa_media_6m", 0)),
                "moment": row.get("momento", "N/A"),
                "sector": row.get("ds_cnae", "N/A"),
                "average_margin_6m": float(row.get("margem_media_6m", 0))
            })
    return clusters

def _get_maturity_analysis(filtered_profiles):
    maturity_analysis = []
    if not filtered_profiles.empty:
        bins = [0, 2, 5, 10, 100]
        labels = ['Startup (<2 anos)', 'Growing (2-5 years)', 'Mature (5-10 years)', 'Established (>10 years)']
        filtered_profiles = filtered_profiles.copy()
        filtered_profiles['maturity_range'] = pd.cut(filtered_profiles['idade'], bins=bins, labels=labels, right=False)
        maturity_df = filtered_profiles.groupby('maturity_range', observed=True).agg(average_revenue=('receita_media_6m', 'mean')).reset_index()
        for _, row in maturity_df.iterrows():
            maturity_analysis.append({
                "maturity_range": str(row['maturity_range']),
                "average_revenue": float(row['average_revenue']) if pd.notnull(row['average_revenue']) else 0.0
            })
    return maturity_analysis

def _get_transaction_analysis(filtered_transactions):
    transaction_analysis = []
    if not filtered_transactions.empty:
        transactions_df = filtered_transactions.groupby('ds_tran')['vl'].sum().reset_index().sort_values('vl', ascending=False)
        for _, row in transactions_df.iterrows():
            transaction_analysis.append({
                "transaction_type": row['ds_tran'],
                "value": float(row['vl'])
            })
    return transaction_analysis

def _get_sector_analysis(profiles_df):
    sector_analysis = []
    sector_df = profiles_df.groupby('ds_cnae').agg(
        total_revenue=('receita_media_6m', 'sum'),
        company_count=('id', 'count')
    ).reset_index().sort_values('total_revenue', ascending=False)
    for _, row in sector_df.iterrows():
        sector_analysis.append({
            "sector": row['ds_cnae'],
            "total_revenue": float(row['total_revenue']),
            "company_count": int(row['company_count'])
        })
    return sector_analysis
