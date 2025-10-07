from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import companies, transactions, sectors, dashboard, ai, forecast, graph
from app.services.data_store import data_store


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

app.include_router(companies.router)
app.include_router(transactions.router)
app.include_router(sectors.router)
app.include_router(dashboard.router)
app.include_router(ai.router)
app.include_router(forecast.router)
app.include_router(graph.router)
