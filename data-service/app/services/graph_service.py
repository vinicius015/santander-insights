from neo4j import GraphDatabase
import os
from fastapi import HTTPException
import pandas as pd

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASS = os.getenv("NEO4J_PASS", "password")

class GraphService:
    def __init__(self):
        self.driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))

    def get_nodes(self):
        query = "MATCH (e:Empresa) RETURN e.id AS id ORDER BY id"
        with self.driver.session(database="neo4j") as session:
            result = session.run(query)
            return [record["id"] for record in result]

    def get_edges(self, limit=500):
        query = """
        MATCH (p:Empresa)-[r:PAGOU_PARA]->(c:Empresa)
        RETURN p.id AS source, c.id AS target, r.valor AS value, r.tipo AS type, r.data AS date
        ORDER BY value DESC LIMIT $limit
        """
        with self.driver.session(database="neo4j") as session:
            result = session.run(query, limit=limit)
            return [dict(record) for record in result]

    def get_neighborhood(self, company_id):
        query = """
        MATCH (foco:Empresa {id: $company_id})
        OPTIONAL MATCH (foco)<-[r_in:PAGOU_PARA]-(cliente:Empresa)
        OPTIONAL MATCH (foco)-[r_out:PAGOU_PARA]->(fornecedor:Empresa)
        RETURN foco.id AS id, COLLECT(DISTINCT cliente.id) AS clientes, COLLECT(DISTINCT fornecedor.id) AS fornecedores
        """
        with self.driver.session(database="neo4j") as session:
            result = session.run(query, company_id=company_id).single()
            return dict(result) if result else {}

    def get_critical_dependencies(self, threshold=0.7):
        query = """
        MATCH (e:Empresa)<-[r:PAGOU_PARA]-(c:Empresa)
        WITH e, SUM(r.valor) AS receitaTotal
        MATCH (e)<-[r_ind:PAGOU_PARA]-(c_ind:Empresa)
        WITH e, receitaTotal, c_ind, SUM(r_ind.valor) AS valor_individual
        WHERE receitaTotal > 0 AND (valor_individual / receitaTotal) >= $threshold
        RETURN e.id AS empresa_dependente, c_ind.id AS cliente_chave, (valor_individual / receitaTotal) * 100 AS dependencia
        ORDER BY dependencia DESC LIMIT 10
        """
        with self.driver.session(database="neo4j") as session:
            result = session.run(query, threshold=threshold)
            return [dict(record) for record in result]

    def get_clusters(self, limit=500):
        query = """
        MATCH (p:Empresa)-[r:PAGOU_PARA]->(c:Empresa)
        RETURN p.id AS source, c.id AS target, r.valor AS value
        ORDER BY value DESC LIMIT $limit
        """
        with self.driver.session(database="neo4j") as session:
            result = session.run(query, limit=limit)
            return [dict(record) for record in result]

graph_service = GraphService()
