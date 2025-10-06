from app.services.companies_service import get_company_details_service
from app.core.ai_config import ai_config
from fastapi import HTTPException

def get_company_diagnosis_service(company_id: str):
    details = get_company_details_service(company_id)
    if details is None:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    client = ai_config.client
    kpis = details["kpis"]
    benchmarking = details["benchmarking"]
    momento = kpis.get("moment", "N/A")
    margem_media_6m = kpis.get("average_margin_6m", 0)
    receita_media_6m = benchmarking.get("company_average_revenue_6m", 0)
    setor_receita_media_6m = benchmarking.get("sector_average_revenue_6m", 0)
    setor_margem_media_6m = benchmarking.get("sector_average_margin_6m", 0)
    tendencia_receita = details.get("cashflow_trends", {}).get("receita", 0)
    contexto = f"""
    - Momento (via ML): {momento}
    - Receita Média (6m): {receita_media_6m:,.0f} BRL
    - Margem Média (6m): {margem_media_6m:.1%}
    - Tendência de Crescimento (Receita): {'Positiva' if tendencia_receita > 0 else 'Negativa ou Estável'}
    - Média de Receita do Setor: {setor_receita_media_6m:,.0f} BRL
    - Média de Margem do Setor: {setor_margem_media_6m:.1%}
    """
    prompt = f"""
    Como um analista financeiro sênior do Banco Santander, analise os seguintes dados de uma empresa e do seu setor.
    \n\nDados Analisados:\n{contexto}
    \n\nSua Tarefa:
    \nEscreva um diagnóstico conciso em um único parágrafo. O diagnóstico deve:
    \n1. Começar com o 'Momento' da empresa e o que isso significa.
    \n2. Comparar a receita e a margem da empresa com a média do seu setor.
    \n3. Com base na tendência de crescimento, dar uma recomendação estratégica.
    \nSeja direto e foque em insights acionáveis para um gestor."
    """
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Você é um analista financeiro sênior a escrever um diagnóstico para um cliente empresarial."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=250, temperature=0.5,
    )
    return response.choices[0].message.content.strip()
