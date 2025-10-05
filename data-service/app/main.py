from fastapi import FastAPI
from app.api import companies, transactions, industries

app = FastAPI()

app.include_router(companies.router)
app.include_router(transactions.router)
app.include_router(industries.router)
