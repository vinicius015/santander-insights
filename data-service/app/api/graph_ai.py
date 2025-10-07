from fastapi import APIRouter, HTTPException
from app.services.graph_ai_service import generate_ecosystem_summary, generate_company_network_analysis

router = APIRouter(prefix="/graph-ai")

@router.get("/ecosystem-summary")
def get_ecosystem_summary(limit: int = 200, threshold: float = 0.7):
    """
    Gera um resumo executivo do ecossistema completo
    """
    try:
        summary = generate_ecosystem_summary(limit, threshold)
        return {"summary": summary}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/company-analysis/{company_id}")
def get_company_analysis(company_id: str):
    """
    Gera uma análise de cadeia de valor para uma empresa específica
    """
    try:
        analysis = generate_company_network_analysis(company_id)
        return {"analysis": analysis}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))