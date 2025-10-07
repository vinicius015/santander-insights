"""
Script para verificar a conectividade com Neo4j e validar o acesso aos dados
"""
import os
import sys
import time
from neo4j import GraphDatabase

# Configurações de conexão Neo4j (altere conforme necessário)
NEO4J_URI = os.environ.get("NEO4J_URI", "neo4j://localhost:7687")
NEO4J_USER = os.environ.get("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "password")

def check_neo4j_connection():
    """Verifica a conexão com Neo4j e executa consultas básicas"""
    print(f"Tentando conectar ao Neo4j em {NEO4J_URI}...")
    
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        
        # Verificar conexão
        with driver.session() as session:
            result = session.run("MATCH (n) RETURN count(n) as node_count")
            record = result.single()
            
            if record:
                node_count = record["node_count"]
                print(f"✅ Conexão bem-sucedida! Encontrados {node_count} nós no banco de dados.")
                
                # Verificar empresas
                result = session.run("MATCH (c:Company) RETURN count(c) as company_count")
                record = result.single()
                company_count = record["company_count"] if record else 0
                print(f"   - Empresas: {company_count}")
                
                # Verificar relacionamentos
                result = session.run("MATCH ()-[r]->() RETURN count(r) as rel_count")
                record = result.single()
                rel_count = record["rel_count"] if record else 0
                print(f"   - Relacionamentos: {rel_count}")
                
                # Se não houver nós ou relacionamentos, sugerir inicialização
                if node_count == 0 or rel_count == 0:
                    print("\n⚠️ O banco de dados parece estar vazio ou sem relacionamentos.")
                    print("   Você pode precisar inicializar o Neo4j com dados de exemplo.")
                    print("   Verifique se há um script de inicialização disponível.")
                
                return True
            else:
                print("❌ Erro: Não foi possível executar a consulta de contagem de nós.")
                return False
    
    except Exception as e:
        print(f"❌ Erro ao conectar com Neo4j: {str(e)}")
        print("\nVerifique:")
        print("  1. Se o Neo4j está em execução")
        print("  2. Se as credenciais estão corretas")
        print("  3. Se a URI está correta (padrão: neo4j://localhost:7687)")
        print("\nSe necessário, ajuste as variáveis de ambiente:")
        print("  - NEO4J_URI")
        print("  - NEO4J_USER")
        print("  - NEO4J_PASSWORD")
        return False
    finally:
        if 'driver' in locals():
            driver.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Verificação de Conectividade com Neo4j")
    print("=" * 60)
    
    success = check_neo4j_connection()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ Teste concluído com sucesso!")
        sys.exit(0)
    else:
        print("❌ Teste falhou. Verifique os erros acima.")
        sys.exit(1)