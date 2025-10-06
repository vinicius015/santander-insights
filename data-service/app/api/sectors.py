from fastapi import APIRouter, HTTPException
from app.services.data_store import data_store

router = APIRouter()

@router.get("/sectors/")
def get_sectors():
    try:
        sectors_df = data_store.industries_df.rename(columns={"ds_cnae": "sector"})
        return sectors_df.to_dict(orient="records")
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=500, detail=str(e))
