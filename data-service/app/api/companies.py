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

