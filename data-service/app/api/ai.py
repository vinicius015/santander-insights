from dotenv import load_dotenv
load_dotenv()
from fastapi import APIRouter, HTTPException
from app.services.ai_service import get_company_diagnosis_service

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
