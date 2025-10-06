from dotenv import load_dotenv
load_dotenv()
from fastapi import APIRouter, HTTPException, Query
from app.services.ai_service import get_company_diagnosis_service, get_forecast_analysis_service

router = APIRouter(prefix="/ai")

@router.get("/diagnosis/{company_id}")
def get_company_diagnosis(company_id: str):
    try:
        diagnosis = get_company_diagnosis_service(company_id)
        return {"diagnosis": diagnosis}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forecast/{company_id}")
def get_forecast_analysis(company_id: str, n_months: int = Query(6, ge=1, le=24, description="Número de meses para prever (3 a 24)")):
    try:
        analysis = get_forecast_analysis_service(company_id, n_months)
        return {"analysis": analysis}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
