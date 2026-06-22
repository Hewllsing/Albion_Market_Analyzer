# Albion Market Analyzer

Aplicacao web para transformar precos publicos do Albion Online em decisoes de arbitragem e crafting. O projeto consulta o [Albion Online Data Project](https://www.albion-online-data.com/), cruza cidades, desconta taxas, classifica o risco por atualizacao do preco e mantem historico em MySQL/MariaDB.

## Recursos

- Dashboard com melhor sinal, top 10 rotas e crafts em destaque.
- Consulta de precos por servidor, cidade, categoria, tier e qualidade.
- Arbitragem entre cidades com lucro bruto, taxa, lucro liquido, margem e risco.
- Simulador de crafting com taxa da estacao, retorno de recursos, Focus e quantidade.
- Historico de precos capturado durante as consultas.
- Watchlist persistente com margem e lucro alvo.
- Cache em memoria para reduzir chamadas repetidas ao servico comunitario.
- Catalogo inicial com pocoes, comidas, recursos T4-T8 e equipamentos PvP comuns.

## Arquitetura

```text
backend/src/
  config/       configuracao de ambiente e servidores
  controllers/  adaptacao entre HTTP e casos de uso
  data/         catalogo e receitas iniciais
  database/     conexao, migration e seed
  models/       persistencia MySQL/MariaDB
  routes/       contratos Express
  services/     mercado, arbitragem, crafting e cache
  utils/        parsing, erros e formulas puras

frontend/src/
  assets/       tema visual responsivo
  components/   estados e elementos reutilizaveis
  composables/  configuracoes e controle de requests
  router/       navegacao Vue Router
  services/     cliente HTTP
  views/        cinco telas da aplicacao
```

O backend e a fonte de verdade para regras financeiras. O frontend somente coleta premissas e apresenta os resultados, evitando divergencia entre telas.

## Requisitos

- Node.js 20 ou superior
- npm 10 ou superior
- MySQL 8+ ou MariaDB 10.6+ para historico e watchlist

As consultas, arbitragem e crafting funcionam sem banco. Historico e watchlist retornam uma mensagem de configuracao enquanto o banco estiver desativado.

## Instalacao

1. Instale as dependencias a partir da raiz:

   ```bash
   npm install
   ```

2. Crie o arquivo de configuracao:

   ```powershell
   Copy-Item .env.example backend/.env
   ```

3. Crie um banco vazio chamado `albion_market_analyzer` e ajuste as credenciais em `backend/.env`.

4. Aplique o esquema e os dados iniciais:

   ```bash
   npm run db:migrate -w backend
   npm run db:seed -w backend
   ```

5. Inicie frontend e backend juntos:

   ```bash
   npm run dev
   ```

Abra `http://localhost:5173`. A API fica em `http://localhost:3000`.

## API

| Metodo | Rota | Uso |
| --- | --- | --- |
| GET | `/api/health` | Estado da API |
| GET | `/api/items` | Catalogo monitorado |
| GET | `/api/market/prices` | Precos por itens/cidades/qualidades/servidor |
| GET | `/api/market/arbitrage` | Comparacao de compra e venda entre cidades |
| GET | `/api/market/crafting-profit` | Ranking ou simulacao de um item |
| GET | `/api/market/history` | Historico persistido |
| GET/POST/DELETE | `/api/watchlist` | Monitores do usuario |

Exemplo de arbitragem:

```text
GET /api/market/arbitrage?category=Recursos%20refinados&tier=6&qualities=1&minimumMargin=10&server=europe
```

Exemplo de crafting:

```text
GET /api/market/crafting-profit?itemId=T6_MAIN_SWORD&materialCity=Thetford&saleCity=Caerleon&quantity=10&marketTaxRate=0.065&resourceReturnRate=0.152
```

Listas podem ser separadas por virgula nos parametros `items`, `cities` e `qualities`. Servidores aceitos: `europe`, `americas` e `asia`.

## Formulas

Arbitragem usa compra imediata no menor `sell_price_min` e venda imediata no maior `buy_price_max` de outra cidade:

```text
lucroBruto = precoVenda - precoCompra
taxa = precoVenda * taxaMercado
lucroLiquido = lucroBruto - taxa
margemPercentual = lucroLiquido / precoCompra * 100
```

Crafting considera consumo efetivo aproximado de `quantidadeMaterial * (1 - retornoRecursos)` e receita pelo menor `sell_price_min`, simulando uma listagem competitiva. A taxa da estacao e aplicada sobre esse custo efetivo. Focus usa 47,9% apenas quando o retorno foi deixado em zero, para que uma taxa informada pelo usuario sempre prevaleca.

## Verificacao

```bash
npm test
npm run build
```

## Limites dos dados

O Albion Online Data Project e comunitario. Um preco recente nao garante que a ordem ainda exista ou tenha volume suficiente. A classificacao de risco usa somente a idade das cotacoes: ate 3h e baixo, de 3h a 8h e medio, acima de 8h e alto. Custos de transporte, risco de emboscada, journals, bonus locais e nutricionamento da estacao ainda nao entram no calculo.

As receitas iniciais sao deliberadamente pequenas e ficam em `backend/src/data/recipes.js`. Essa fronteira permite substituir o seed por uma fonte completa de dados do jogo sem alterar controllers ou interface.
