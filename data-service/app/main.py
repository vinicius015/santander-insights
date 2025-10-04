from fastapi import FastAPI
from app.api import companies

app = FastAPI()

app.include_router(companies.router)
