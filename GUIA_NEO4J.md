# Guia de Configuração do Neo4j para o Santander Insights

Este guia explica como configurar o Neo4j e importar os dados necessários para que a funcionalidade de Cadeia de Valor funcione corretamente na aplicação Santander Insights.

## 1. Instalação do Neo4j

### Opção 1: Neo4j Desktop (Recomendado para desenvolvimento)

1. Faça download do [Neo4j Desktop](https://neo4j.com/download/)
2. Instale e inicie o Neo4j Desktop
3. Crie um novo projeto chamado "SantanderInsights"
4. Dentro do projeto, adicione um novo banco de dados local:
   - Nome: santander-graph
   - Senha: escolha uma senha segura
   - Versão: 5.x (recomendado 5.15+)
5. Inicie o banco de dados

### Opção 2: Neo4j Docker (Para ambiente de desenvolvimento ou produção)

```powershell
docker run --name santander-neo4j `
  -p 7474:7474 -p 7687:7687 `
  -e NEO4J_AUTH=neo4j/SuaSenhaAqui `
  -e NEO4J_PLUGINS=["graph-data-science"] `
  -v $HOME/neo4j/data:/data `
  -v $HOME/neo4j/logs:/logs `
  -v $HOME/neo4j/import:/var/lib/neo4j/import `
  -v $HOME/neo4j/plugins:/plugins `
  -d neo4j:5.15
```

## 2. Configuração da Aplicação

1. Edite o arquivo `app/core/config.py` para ajustar as configurações de conexão Neo4j:

```python
# Configuração do Neo4j
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "SuaSenhaAqui")
```

## 3. Importação dos Dados para o Neo4j

A aplicação inclui um script de importação de dados para o Neo4j que utiliza os dados do arquivo Excel existente. O script está localizado em `scripts/init_neo4j.py`.

### Executar o Script de Importação

```powershell
cd c:\Users\Vinicius\Documents\santander-insights
python -m scripts.init_neo4j
```

O script realizará as seguintes operações:

1. Carregamento dos dados de empresas do arquivo Excel
2. Criação das restrições e índices no Neo4j
3. Importação dos nós de empresas
4. Cálculo e importação das relações entre empresas com base nas transações
5. Aplicação de métricas de centralidade e detecção de comunidades

### Verificação da Importação

Após a execução do script, você pode verificar se os dados foram importados corretamente acessando a interface web do Neo4j em [http://localhost:7474](http://localhost:7474).

Faça login com o usuário e senha configurados e execute a seguinte consulta:

```cypher
MATCH (n:Company) RETURN count(n) as CompanyCount
```

Você deverá ver o número total de empresas importadas.

Para verificar as relações:

```cypher
MATCH ()-[r:TRANSACTS_WITH]->() RETURN count(r) as RelationshipCount
```

## 4. Estrutura dos Dados no Neo4j

### Nós (Nodes)

- **Company**: Representa uma empresa
  - Propriedades:
    - `id`: ID da empresa (mesma do Excel)
    - `name`: Nome da empresa
    - `sector`: Setor/CNAE da empresa
    - `revenue`: Receita média
    - `balance`: Saldo
    - `centrality`: Medida de centralidade na rede
    - `community`: Comunidade à qual a empresa pertence (calculado pelo algoritmo)

### Relações (Relationships)

- **TRANSACTS_WITH**: Representa transações entre empresas
  - Propriedades:
    - `value`: Valor total das transações
    - `type`: Tipo da transação (ex: "pagamento", "recebimento")

## 5. Reiniciar o Banco de Dados Neo4j

Se precisar limpar todos os dados e reiniciar:

1. Pare o banco de dados Neo4j
2. No Neo4j Desktop, clique em "Manage" para o banco de dados, então em "Drop" para remover os dados
3. Inicie o banco de dados novamente
4. Execute o script de importação novamente

## 6. Verificação da Integração com a API

Após configurar o Neo4j e importar os dados, você pode testar se a API está se comunicando corretamente:

```powershell
# Inicie o serviço backend
cd c:\Users\Vinicius\Documents\santander-insights\data-service
uvicorn app.main:app --reload

# Em outro terminal ou navegador, teste os endpoints
curl http://localhost:8000/graph/ecosystem
# ou acesse no navegador: http://localhost:8000/graph/ecosystem
```

Se tudo estiver configurado corretamente, você deverá receber um JSON com a estrutura de nós e links do grafo completo.