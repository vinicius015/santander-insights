import pandas as pandas
from app.core.config import DATA_FILE_PATH

COMPANIES_SHEET_NAME = "Base 1 - ID"
COMPANIES_COLUMNS = ['id', 'dt_abrt', 'dt_refe', 'vl_fatu', 'vl_sldo', 'ds_cnae']

TRANSACTIONS_SHEET_NAME = "Base 2 - Transações"
TRANSACTIONS_COLUMNS = ['id_pgto', 'id_rcbe', 'vl', 'dt_refe', 'ds_tran']

def load_companies_data():
    try:
        companies_data_frame = pandas.read_excel(DATA_FILE_PATH, sheet_name=COMPANIES_SHEET_NAME)

        for column in COMPANIES_COLUMNS:
            if column not in companies_data_frame.columns:
                raise ValueError(f"Columns '{column}' not found in '{COMPANIES_SHEET_NAME}' sheet. Check your Excel file.")
            
        
        companies_data_frame['dt_abrt'] = pandas.to_datetime(companies_data_frame['dt_abrt'])
        companies_data_frame['dt_refe'] = pandas.to_datetime(companies_data_frame['dt_refe'])

        return companies_data_frame
    except FileNotFoundError:
        raise ValueError(f"Excel file '{DATA_FILE_PATH}' not found.")
    except ValueError as error:
        if f"Worksheet name '{COMPANIES_SHEET_NAME}' not found" in str(error):
            raise ValueError(f"Sheet not found. '{COMPANIES_SHEET_NAME} is not among Excel file sheets'")
        else:
            raise ValueError(f"Error while reading '{COMPANIES_SHEET_NAME}': {error}")

def load_transactions_data():
    try:
        transactions_data_frame = pandas.read_excel(DATA_FILE_PATH, sheet_name=TRANSACTIONS_SHEET_NAME)

        for column in TRANSACTIONS_COLUMNS:
            if column not in transactions_data_frame.columns:
                raise ValueError(f"Columns '{column}' not found in '{TRANSACTIONS_SHEET_NAME}' sheet. Check your Excel file.")
            
        transactions_data_frame['dt_refe'] = pandas.to_datetime(transactions_data_frame['dt_refe'])

        return transactions_data_frame
    except FileNotFoundError:
        raise ValueError(f"Excel file '{DATA_FILE_PATH}' not found.")
    except ValueError as error:
        if f"Worksheet name '{TRANSACTIONS_SHEET_NAME}' not found"  in str(error):
            raise ValueError(f"Sheet not found. '{TRANSACTIONS_SHEET_NAME} is not among Excel file sheets'")
        else:
            raise ValueError(f"Error while reading '{TRANSACTIONS_SHEET_NAME}': {error}")