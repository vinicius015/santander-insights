from fastapi import APIRouter, HTTPException, Query
from app.services.forecast_service import get_cashflow_forecast

router = APIRouter(prefix="/forecast")

@router.get("/{company_id}")
def get_forecast(
    company_id: str,
    n_months: int = Query(6, ge=1, le=24)
):
    try:
        result = get_cashflow_forecast(company_id, n_months)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
