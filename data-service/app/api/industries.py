from fastapi import APIRouter, HTTPException
from app.utils.excel_loader import load_industries_data

router = APIRouter()

@router.get("/industries/")
def get_industries():
    try:
        industries_df = load_industries_data()
        return industries_df.to_dict(orient="records")
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=500, detail=str(e))