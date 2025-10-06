from typing import Optional
from app.utils.excel_loader import load_companies_data, load_industries_data, load_transactions_data

import pandas

class DataStore:
    def __init__(self):
        self.companies_df: Optional[pandas.DataFrama] = None
        self.industries_df: Optional[pandas.DataFrama] = None
        self.transactions_df: Optional[pandas.DataFrama] = None
        self.monthly_cashflow_summary: Optional[pandas.DataFrama] = None
        self.all_companies_profiles: Optional[pandas.DataFrama] = None
    
    def initialize_data(self):
        from app.services.companies_service import create_monthly_cashflow_summary, segment_companies_by_moment
        companies_df = load_companies_data()
        industries_df = load_industries_data()
        transactions_df = load_transactions_data()
        monthly_cashflow_summary = create_monthly_cashflow_summary(transactions_df)
        all_company_profiles = segment_companies_by_moment(monthly_cashflow_summary, companies_df)
        self.companies_df = companies_df
        self.industries_df = industries_df
        self.transactions_df = transactions_df
        self.monthly_cashflow_summary = monthly_cashflow_summary
        self.all_companies_profiles = all_company_profiles

data_store = DataStore()
    
    