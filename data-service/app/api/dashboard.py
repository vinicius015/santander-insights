
from fastapi import APIRouter, Query

from app.services.dashboard_service import get_dashboard_data

router = APIRouter()

@router.get("/dashboard")
def get_dashboard(cnae: str = Query(default="Todos os Setores", description="Setor/CNAE para filtrar os dados")):
    return get_dashboard_data(cnae)
