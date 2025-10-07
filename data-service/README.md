# Santander Insights - Cadeia de Valor

Este módulo adiciona a funcionalidade de análise de cadeia de valor à aplicação Santander Insights, permitindo visualizar e analisar relações entre empresas baseadas em dados do Neo4j.

## Pré-requisitos

- Neo4j Desktop instalado e configurado
- Python 3.9+ 
- Pacotes listados em `requirements.txt`
- Arquivo de dados `Challenge FIAP - Bases.xlsx` na pasta `data/`

## Configuração do Neo4j

1. Instale o Neo4j Desktop (https://neo4j.com/download/)
2. Crie um novo banco de dados local com:
   - Senha: password (ou configure em .env)
   - Versão: 5.x+ recomendada
3. Inicie o banco de dados

## Configuração do Ambiente

1. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
   ```
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASS=password
   EXCEL_FILE_PATH=data/Challenge FIAP - Bases.xlsx
   ```

2. Instale as dependências:
   ```
   pip install -r requirements.txt
   ```

3. Copie o arquivo `Challenge FIAP - Bases.xlsx` para a pasta `data/`

## Inicialização dos Dados

Execute o script de inicialização para carregar os dados no Neo4j:

```
python scripts/init_neo4j.py
```

## Executando a API

```
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints para Cadeia de Valor

### Dados de Rede
- `GET /graph/nodes` - Lista todas as empresas
- `GET /graph/edges` - Lista todas as transações
- `GET /graph/neighborhood/{company_id}` - Vizinhança de uma empresa
- `GET /graph/dependencies` - Lista dependências críticas
- `GET /graph/clusters` - Clusters do ecossistema

### Análises de IA
- `GET /graph-ai/ecosystem-summary` - Resumo do ecossistema
- `GET /graph-ai/company-analysis/{company_id}` - Análise da cadeia de valor de uma empresa

## Frontend

O frontend Angular possui uma página "Cadeia de Valor" que consome esses endpoints e exibe visualizações de rede e insights baseados em IA.