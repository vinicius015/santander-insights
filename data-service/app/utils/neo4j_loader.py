from neo4j import GraphDatabase
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

class Neo4jLoader:
    def __init__(self):
        self.uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = os.getenv("NEO4J_USER", "neo4j")
        self.password = os.getenv("NEO4J_PASS", "password")
        self.driver = None
    
    def connect(self):
        """Conecta ao banco de dados Neo4j"""
        if self.driver is None:
            try:
                self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
                return True
            except Exception as e:
                print(f"Erro ao conectar ao Neo4j: {e}")
                return False
        return True
    
    def close(self):
        """Fecha a conexão com o Neo4j"""
        if self.driver is not None:
            self.driver.close()
            self.driver = None
    
    def test_connection(self):
        """Testa a conexão com o Neo4j"""
        if self.connect():
            try:
                with self.driver.session(database="neo4j") as session:
                    result = session.run("RETURN 1 AS test")
                    return result.single()["test"] == 1
            except Exception as e:
                print(f"Erro ao testar conexão: {e}")
                return False
            finally:
                self.close()
        return False

    def count_nodes(self):
        """Conta quantos nós existem no banco"""
        if self.connect():
            try:
                with self.driver.session(database="neo4j") as session:
                    result = session.run("MATCH (n) RETURN count(n) as count")
                    return result.single()["count"]
            except Exception as e:
                print(f"Erro ao contar nós: {e}")
                return 0
            finally:
                self.close()
        return 0

neo4j_loader = Neo4jLoader()