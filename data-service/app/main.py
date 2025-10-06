from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.api import companies, transactions, sectors, dashboard
from app.services.data_store import data_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        data_store.initialize_data()
    except Exception as error:
        raise ValueError(f"Error while initializing application: {error}")
    
    yield

app = FastAPI(lifespan= lifespan)

app.include_router(companies.router)
app.include_router(transactions.router)
app.include_router(sectors.router)
app.include_router(dashboard.router)
