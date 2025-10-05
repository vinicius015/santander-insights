from fastapi import APIRouter, HTTPException
from app.services.data_store import data_store

router = APIRouter()

@router.get("/industries/")
def get_industries():
    try:
        industries_df = data_store.industries_df
        return industries_df.to_dict(orient="records")
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=500, detail=str(e))