from fastapi import APIRouter, HTTPException, Query
from app.services.graph_service import graph_service

router = APIRouter(prefix="/graph")

@router.get("/nodes")
def get_nodes():
    try:
        return {"nodes": graph_service.get_nodes()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/edges")
def get_edges(limit: int = Query(500, ge=1, le=2000)):
    try:
        return {"edges": graph_service.get_edges(limit)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/neighborhood/{company_id}")
def get_neighborhood(company_id: str):
    try:
        return graph_service.get_neighborhood(company_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dependencies")
def get_critical_dependencies(threshold: float = Query(0.7, ge=0.0, le=1.0)):
    try:
        return {"dependencies": graph_service.get_critical_dependencies(threshold)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/clusters")
def get_clusters(limit: int = Query(500, ge=1, le=2000)):
    try:
        return {"edges": graph_service.get_clusters(limit)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
