# Resolução do Problema "Carregando dados da rede..." Infinito

Este guia contém as instruções para resolver o problema do carregamento infinito na visualização do grafo do ecossistema.

## Verificação do Backend

1. **Verificar se o Neo4j está rodando**
   
   O Neo4j precisa estar em execução para que o backend possa se conectar a ele.
   
   - Abra o Neo4j Desktop e verifique se o banco de dados está iniciado
   - Verifique se as credenciais no arquivo `.env` ou no arquivo `app/core/config.py` estão corretas

2. **Inicializar o banco de dados Neo4j**
   
   Execute o script de inicialização para garantir que o banco de dados Neo4j contenha os dados necessários:
   
   ```
   cd c:\Users\Vinicius\Documents\santander-insights\data-service
   python init_db.py
   ```

3. **Verificar a conexão com o backend**
   
   Inicie o servidor FastAPI:
   
   ```
   cd c:\Users\Vinicius\Documents\santander-insights\data-service
   uvicorn app.main:app --reload
   ```
   
   Em seguida, teste o endpoint de saúde para verificar a conexão com o Neo4j:
   
   Abra no navegador: http://localhost:8000/health

## Iniciando a Aplicação

1. **Inicie o servidor backend:**
   
   ```
   cd c:\Users\Vinicius\Documents\santander-insights\data-service
   uvicorn app.main:app --reload
   ```

2. **Inicie o frontend Angular:**
   
   ```
   cd c:\Users\Vinicius\Documents\santander-insights\webapp
   ng serve
   ```

3. **Acesse a aplicação:**
   
   Abra no navegador: http://localhost:4200

## Possíveis Soluções para Problemas Comuns

1. **Erro de conexão com Neo4j**
   
   - Verifique se o Neo4j está em execução
   - Verifique se as credenciais estão corretas em `app/core/config.py`
   - Execute o script `init_db.py` para reinicializar o banco de dados

2. **Carregamento infinito**
   
   - O timeout de segurança agora interromperá o carregamento após 15 segundos
   - Verifique o console do navegador para mais informações sobre erros
   - Se o problema persistir, reinicie tanto o backend quanto o frontend

3. **Nenhum dado exibido**
   
   - Verifique se o Neo4j contém os dados necessários executando o script `init_db.py`
   - Verifique o console do navegador para mais informações sobre erros

## Logs e Depuração

- **Logs do backend**: Verificar no terminal onde o uvicorn está em execução
- **Logs do frontend**: Abra as ferramentas de desenvolvedor do navegador (F12) e verifique o console

Caso o problema persista, verifique os logs detalhados para diagnóstico mais preciso.