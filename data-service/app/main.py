from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.api import companies, transactions, sectors, dashboard, ai, forecast, graph, graph_ai
from app.services.data_store import data_store
from app.services.graph_service import graph_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        data_store.initialize_data()
    except Exception as error:
        raise ValueError(f"Error while initializing application: {error}")
    
    yield

app = FastAPI(lifespan= lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """
    Endpoint para verificar a saúde da aplicação e conexão com Neo4j
    """
    try:
        # Testar conexão com Neo4j solicitando alguns nós
        nodes = graph_service.get_nodes()
        
        # Verificar se conseguimos obter algum dado
        if nodes is not None:
            node_count = len(nodes)
            return {
                "status": "ok",
                "message": f"Serviço está funcionando corretamente. Encontrados {node_count} nós no Neo4j."
            }
        else:
            raise HTTPException(status_code=503, detail="Neo4j está acessível, mas não retornou dados.")
    
    except Exception as e:
        raise HTTPException(
            status_code=503, 
            detail=f"Erro de conexão com Neo4j: {str(e)}. Verifique se o Neo4j está em execução e as credenciais estão corretas."
        )

app.include_router(companies.router)
app.include_router(transactions.router)
app.include_router(sectors.router)
app.include_router(dashboard.router)
app.include_router(ai.router)
app.include_router(forecast.router)
app.include_router(graph.router)
app.include_router(graph_ai.router)
