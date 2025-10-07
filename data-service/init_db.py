# Script para inicialização do banco de dados Neo4j
# Executar esse script antes de iniciar o servidor
import os
import sys
from pathlib import Path

# Adicionar o diretório raiz ao path para importação de módulos
root_dir = Path(__file__).parent
sys.path.append(str(root_dir))

from scripts.init_neo4j import init_neo4j
from app.core.config import NEO4J_URI, NEO4J_USER, NEO4J_PASS, EXCEL_FILE_PATH

def main():
    print("=== Verificação e Inicialização do Banco de Dados Neo4j ===")
    print(f"URI do Neo4j: {NEO4J_URI}")
    print(f"Usuário: {NEO4J_USER}")
    print(f"Arquivo de dados: {EXCEL_FILE_PATH}")
    
    if os.path.exists(EXCEL_FILE_PATH):
        print(f"✓ Arquivo de dados encontrado: {EXCEL_FILE_PATH}")
    else:
        print(f"✗ ERRO: Arquivo de dados não encontrado: {EXCEL_FILE_PATH}")
        print("Por favor, verifique se o arquivo existe no caminho especificado.")
        return False
    
    print("\nIniciando conexão com Neo4j...")
    success = init_neo4j()
    
    if success:
        print("\n✓ Neo4j inicializado com sucesso!")
        print("\nAgora você pode iniciar o servidor FastAPI com:")
        print("  uvicorn app.main:app --reload")
        return True
    else:
        print("\n✗ Falha ao inicializar o Neo4j!")
        print("Verifique se o Neo4j está rodando e se as credenciais estão corretas.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)