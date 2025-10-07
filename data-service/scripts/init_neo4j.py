from neo4j import GraphDatabase
import pandas as pd
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# --- CONFIGURAÇÕES DE CONEXÃO ---
# Usar variáveis de ambiente ou padrões
URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
AUTH = (os.getenv("NEO4J_USER", "neo4j"), os.getenv("NEO4J_PASS", "password"))

# --- CAMINHO DO ARQUIVO DE DADOS ---
EXCEL_FILE_PATH = os.getenv("EXCEL_FILE_PATH", "data/Challenge FIAP - Bases.xlsx")
NOME_PLANILHA_EMPRESAS = "Base 1 - ID"
NOME_PLANILHA_TRANSACOES = "Base 2 - Transações"

def criar_constraints(tx):
    """
    Cria uma regra no banco de dados para garantir que não haverá
    empresas com o mesmo ID.
    """
    tx.run("CREATE CONSTRAINT unique_empresa_id IF NOT EXISTS FOR (e:Empresa) REQUIRE e.id IS UNIQUE")

def carregar_empresas(tx, empresas_records):
    """
    Carrega as empresas para o Neo4j.
    """
    query = """
    UNWIND $rows AS row
    MERGE (e:Empresa {id: row.id})
    SET e.data_abertura = date(row.dt_abrt),
        e.saldo = toFloat(row.vl_sldo),
        e.cnae = row.ds_cnae
    """
    tx.run(query, rows=empresas_records)

def carregar_transacoes(tx, transacoes_records):
    """
    Cria as relações de pagamento entre as empresas.
    """
    query = """
    UNWIND $rows AS row
    MATCH (pagador:Empresa {id: row.id_pgto})
    MATCH (recebedor:Empresa {id: row.id_rcbe})
    CREATE (pagador)-[t:PAGOU_PARA {
        valor: toFloat(row.vl),
        tipo: row.ds_tran,
        data: date(row.dt_refe)
    }]->(recebedor)
    """
    tx.run(query, rows=transacoes_records)

# --- Função Principal de Execução ---
def init_neo4j():
    print("Iniciando a ingestão de dados para o Neo4j...")
    
    # Verificar se o arquivo existe
    if not os.path.exists(EXCEL_FILE_PATH):
        print(f"ERRO CRÍTICO: O arquivo '{EXCEL_FILE_PATH}' não foi encontrado.")
        print("Verifique se o caminho está correto no .env ou copie o arquivo para o local correto.")
        return False
    
    try:
        # Carregar dados do Excel
        empresas_df = pd.read_excel(EXCEL_FILE_PATH, sheet_name=NOME_PLANILHA_EMPRESAS, dtype={'id': str})
        trans_df = pd.read_excel(EXCEL_FILE_PATH, sheet_name=NOME_PLANILHA_TRANSACOES, dtype={'id_pgto': str, 'id_rcbe': str})

        # Limpar e formatar datas para o formato do Neo4j (YYYY-MM-DD)
        empresas_df['dt_abrt'] = pd.to_datetime(empresas_df['dt_abrt']).dt.strftime('%Y-%m-%d')
        trans_df['dt_refe'] = pd.to_datetime(trans_df['dt_refe']).dt.strftime('%Y-%m-%d')
        
        empresas_records = empresas_df.to_dict('records')
        trans_records = trans_df.to_dict('records')
        
        # Conectar e popular o banco de dados
        with GraphDatabase.driver(URI, auth=AUTH) as driver:
            with driver.session(database="neo4j") as session:
                print("Limpando base de dados antiga...")
                session.run("MATCH (n) DETACH DELETE n")

                session.execute_write(criar_constraints)
                print("Constraint de unicidade criada.")
                
                session.execute_write(carregar_empresas, empresas_records)
                print(f"{len(empresas_records)} nós de Empresa carregados.")
                
                session.execute_write(carregar_transacoes, trans_records)
                print(f"{len(trans_records)} relações de Pagamento carregadas.")
                
        print("\nIngestão de dados concluída com sucesso!")
        return True
        
    except Exception as e:
        print(f"\nOcorreu um erro durante a conexão com o Neo4j: {e}")
        print("Verifique se o Neo4j Desktop está rodando e se as suas credenciais (URI, usuário, senha) estão corretas.")
        return False

if __name__ == "__main__":
    init_neo4j()