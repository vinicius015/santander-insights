from fastapi import APIRouter, HTTPException
from app.utils.excel_loader import load_transactions_data

router = APIRouter()

@router.get("/transactions/")
def get_transactions():
    try:
        transactions_df = load_transactions_data()
        return transactions_df.to_dict(orient="records")
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=500, detail=str(e))
