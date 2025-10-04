from fastapi import APIRouter, HTTPException
from app.utils.excel_loader import load_companies_data

router = APIRouter()

@router.get("/companies/")
def get_companies():
    try:
        companies_df = load_companies_data()
        return companies_df.to_dict(orient="records")
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=500, detail=str(e))
