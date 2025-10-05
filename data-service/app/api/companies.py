from fastapi import APIRouter, HTTPException
from app.services.companies_service import *
from app.services.data_store import data_store

router = APIRouter(prefix="/companies")

@router.get("/")
def get_companies():
    try:
        companies_df = data_store.companies_df
        return companies_df.to_dict(orient="records")
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/key-factors")
def get_companies_key_factors():
    try:
        companies_total = data_store.all_companies_profiles['id'].unique().size
        predominant_moment = data_store.all_companies_profiles['momento'].mode()[0]
        share = round(data_store.all_companies_profiles['momento'].value_counts(normalize=True).max(), 2)
        average_money = round(data_store.companies_df.groupby("id")["vl_sldo"].last().mean(), 2)
        
        key_factors_data = {
            "companies_total": companies_total,
            "predominant_stage": {
                "stage_name": predominant_moment,
                "share": share,
            },
            "average_money": average_money
        }
        
        return key_factors_data
        
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/key-factors/{sector_name}")
def get_companies_key_factors_by_sector_name(sector_name: str):
    try:
        
        all_company_profiles = data_store.all_companies_profiles
        
        profiles_by_sector = all_company_profiles[all_company_profiles['ds_cnae'] == sector_name]
        ids_in_sector = profiles_by_sector['id'].unique()
        companies_in_sector = data_store.companies_df[data_store.companies_df['id'].isin(ids_in_sector)]
        
        companies_total = profiles_by_sector['id'].unique().size
        predominant_moment = profiles_by_sector['momento'].mode()[0]
        share = round(all_company_profiles['momento'].value_counts(normalize=True).max(), 2)
        average_money = round(companies_in_sector.groupby("id")["vl_sldo"].last().mean(), 2)
        
        key_factors_data = {
            "companies_total": companies_total,
            "predominant_stage": {
                "stage_name": predominant_moment,
                "share": share,
            },
            "average_money": average_money
        }
        
        return key_factors_data
        
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=500, detail=str(e))
