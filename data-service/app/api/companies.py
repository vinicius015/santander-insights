from fastapi import APIRouter, HTTPException
from app.utils.excel_loader import load_companies_data, load_transactions_data
from app.services.companies_service import *

router = APIRouter(prefix="/companies")

@router.get("/")
def get_companies():
    try:
        companies_df = load_companies_data()
        return companies_df.to_dict(orient="records")
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/key-factors")
def get_companies_key_factors():
    try:
        companies_df = load_companies_data()
        transactions_df = load_transactions_data()
        
        monthly_cashflow = features_cashflow(transactions_df)
        profile = clusterizar_empresas_kmeans(monthly_cashflow, companies_df)
        companies_total = profile['id'].unique().size
        current_moment = profile['momento'].mode()[0]
        share = profile['momento'].value_counts(normalize=True).max()
        average_money = round(companies_df.groupby("id")["vl_sldo"].last().mean(), 2)
        
        key_factors_data = {
            "companies_total": companies_total,
            "predominant_stage": {
                "stage_name": current_moment,
                "share": share,
            },
            "avarage_money": average_money
        }
        
        return key_factors_data
        
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/key-factors/{sector_name}")
def get_companies_key_factors_by_sector_name(sector_name: str):
    try:
        companies_df = load_companies_data()
        transactions_df = load_transactions_data()
        
        monthly_cashflow = features_cashflow(transactions_df)
        profile = clusterizar_empresas_kmeans(monthly_cashflow, companies_df)
        
        
        profile_by_sector = profile[profile['ds_cnae'] == sector_name]
        ids = profile_by_sector['id'].unique()
        companies_by_sector = companies_df[companies_df['id'].isin(ids)]
        
        companies_total = profile_by_sector['id'].unique().size
        current_moment = profile_by_sector['momento'].mode()[0]
        share = profile['momento'].value_counts(normalize=True).max()
        average_money = round(companies_by_sector.groupby("id")["vl_sldo"].last().mean(), 2)
        
        key_factors_data = {
            "companies_total": companies_total,
            "predominant_stage": {
                "stage_name": current_moment,
                "share": share,
            },
            "avarage_money": average_money
        }
        
        return key_factors_data
        
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=500, detail=str(e))
