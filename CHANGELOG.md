# Changelog

## [1.0.1] - 2023-XX-XX

### Melhorias de Performance - Visualização de Cadeia de Valor

#### Otimizações de Interface
- Adicionado o modo de alto desempenho para dispositivos com menor capacidade de processamento
- Reduzido o número máximo de conexões exibidas de 500 para 300 para melhorar a performance geral
- Adicionada opção para alternar entre o modo de performance normal e alto desempenho

#### Otimizações de Renderização
- Implementada técnica de pré-renderização com ticks fixos para posicionamento inicial mais rápido
- No modo de alto desempenho, a simulação é interrompida após o posicionamento inicial
- Ajustados parâmetros de simulação para convergência mais rápida:
  - Maior alphaDecay para acelerar a estabilização
  - Maior velocityDecay para reduzir as oscilações
  - Adicionado limite de distância para cálculo de forças
  - Adicionada força de colisão para evitar sobreposição de nós

#### Otimizações de Dados
- Filtro de nós por centralidade (número de conexões) para priorizar elementos importantes
- Redução do número de arestas mostradas em modo de alto desempenho
- Filtragem de arestas com valores muito baixos para reduzir a complexidade visual
- Cálculo de métricas de centralidade no pré-processamento para evitar cálculos repetidos

#### Ajustes Visuais
- Tamanho dos nós agora proporcional à sua centralidade na rede
- Destaque visual para empresas com alta centralidade na rede
- Tooltip aprimorado mostrando o número de conexões de cada empresa