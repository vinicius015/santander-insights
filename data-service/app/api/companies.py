from fastapi import APIRouter, HTTPException
from app.services.companies_service import get_company_ids_service, get_company_details_service
from app.services.data_store import data_store


router = APIRouter(prefix="/companies")


@router.get("/")
def get_companies():
    try:
        companies_df = data_store.companies_df
        return companies_df.to_dict(orient="records")
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ids")
def get_company_ids():
    try:
        return get_company_ids_service()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{company_id}/details")
def get_company_details(company_id: str):
    try:
        result = get_company_details_service(company_id)
        if result is None:
            raise HTTPException(status_code=404, detail="Company not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

