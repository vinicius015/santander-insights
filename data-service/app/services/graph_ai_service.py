import networkx as nx
from app.core.ai_config import ai_config
from app.services.graph_service import graph_service
from fastapi import HTTPException

def generate_ecosystem_summary(limit=200, threshold=0.7):
    """
    Gera um resumo executivo do ecossistema completo com base nos dados do Neo4j
    """
    try:
        # Obter dados para análise
        edges = graph_service.get_edges(limit)
        dependencies = graph_service.get_critical_dependencies(threshold)
        
        # Criar um grafo do NetworkX para análise de comunidades
        G = nx.DiGraph()
        for edge in edges:
            G.add_edge(edge['source'], edge['target'], weight=edge['value'])
        
        # Converter para grafo não direcionado para detecção de comunidades
        G_undirected = G.to_undirected()
        
        # Detectar comunidades usando o algoritmo Louvain
        communities = nx.community.louvain_communities(G_undirected, weight='weight', resolution=1.1)
        
        # Análises básicas
        num_nodes = len(G.nodes())
        num_edges = len(G.edges())
        num_communities = len(communities)
        largest_community_size = max(len(comm) for comm in communities)
        
        # Centralidade e importância de nós
        betweenness = nx.betweenness_centrality(G, k=min(100, num_nodes), weight='weight')
        top_central_nodes = sorted(betweenness.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Preparar contexto para a IA
        context = f"""
        Análise de Rede do Ecossistema Empresarial:
        - Total de empresas (nós): {num_nodes}
        - Total de transações (arestas): {num_edges}
        - Número de clusters identificados: {num_communities}
        - Tamanho do maior cluster: {largest_community_size} empresas
        - Empresas mais centrais na rede (maior intermediação): {[node for node, _ in top_central_nodes]}
        - Número de relações de dependência crítica (>{threshold*100:.0f}%): {len(dependencies)}
        """
        
        if dependencies:
            context += "\nRelações de dependência mais críticas:\n"
            for i, dep in enumerate(dependencies[:5], 1):
                context += f"- {i}. Empresa {dep['empresa_dependente']} depende {dep['dependencia']:.1f}% de {dep['cliente_chave']}\n"
        
        # Prompt para a IA
        prompt = f"""
        Como analista de risco do banco Santander especializado em análise de redes empresariais, forneça um resumo executivo sobre o ecossistema empresarial com base nos dados abaixo.
        
        {context}
        
        Seu resumo deve:
        1. Começar com uma visão geral da estrutura do ecossistema (tamanho, conectividade, clusters)
        2. Destacar as empresas mais críticas/centrais e explicar por que são importantes
        3. Analisar os riscos de dependência crítica observados
        4. Concluir com 1-2 recomendações estratégicas para o banco considerando esse ecossistema
        
        Seja conciso, direto e foque em insights acionáveis. Use linguagem profissional adequada para executivos do setor bancário.
        """
        
        client = ai_config.client
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Você é um analista de risco sênior especializado em análise de redes e ecossistemas empresariais."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=450, 
            temperature=0.4,
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar resumo do ecossistema: {str(e)}")


def generate_company_network_analysis(company_id: str):
    """
    Gera uma análise de cadeia de valor para uma empresa específica
    """
    try:
        # Obter vizinhança da empresa
        neighborhood = graph_service.get_neighborhood(company_id)
        
        if not neighborhood:
            raise HTTPException(status_code=404, detail=f"Empresa {company_id} não encontrada")
        
        # Dados de clientes e fornecedores
        clientes = neighborhood.get('clientes', [])
        fornecedores = neighborhood.get('fornecedores', [])
        
        # Obter relacionamentos mais fortes (implementar uma função adicional em graph_service)
        # Isso é uma simplificação - o ideal seria ter valores e percentuais como no Streamlit
        num_clientes = len(clientes)
        num_fornecedores = len(fornecedores)
        
        # Preparar contexto para a IA
        context = f"""
        Análise de Cadeia de Valor da Empresa {company_id}:
        - Número total de clientes: {num_clientes}
        - Número total de fornecedores: {num_fornecedores}
        """
        
        # Adicionar detalhes de principais relações se existirem
        if clientes:
            context += f"\nPrincipais clientes: {', '.join(clientes[:5])}"
        else:
            context += "\nA empresa não possui clientes registrados no sistema."
            
        if fornecedores:
            context += f"\nPrincipais fornecedores: {', '.join(fornecedores[:5])}"
        else:
            context += "\nA empresa não possui fornecedores registrados no sistema."
        
        # Prompt para a IA
        prompt = f"""
        Como analista de relacionamento do banco Santander especializado em cadeia de valor, forneça uma análise sobre a empresa {company_id} com base nos dados abaixo.
        
        {context}
        
        Seu diagnóstico deve:
        1. Avaliar a posição da empresa em sua cadeia de valor
        2. Identificar possíveis riscos de concentração de clientes ou fornecedores
        3. Sugerir uma estratégia financeira adequada com base na posição da empresa
        
        Seja conciso e direto. Use linguagem profissional adequada para gestores financeiros.
        """
        
        client = ai_config.client
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Você é um analista financeiro especializado em análise de cadeia de valor empresarial."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300, 
            temperature=0.4,
        )
        
        return response.choices[0].message.content.strip()
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar análise de cadeia de valor: {str(e)}")