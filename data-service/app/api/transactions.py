from fastapi import APIRouter, HTTPException
from app.services.data_store import data_store

router = APIRouter()

@router.get("/transactions/")
def get_transactions():
    try:
        transactions_df = data_store.transactions_df
        return transactions_df.to_dict(orient="records")
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=500, detail=str(e))
