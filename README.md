# Albion Market Analyzer

Aplicacao web para transformar precos publicos do Albion Online em decisoes de arbitragem e crafting. O projeto consulta o [Albion Online Data Project](https://www.albion-online-data.com/), cruza cidades, desconta taxas, classifica o risco por atualizacao do preco e mantem historico em MySQL/MariaDB.

## Status do desenvolvimento

Estamos trabalhando por fases. A **Fase 1 - MVP pessoal**, a **Fase 2 - Ferramenta avancada de lucro** e a **Fase 3 - Sistema de utilizadores e dashboard individual** estao concluidas e testadas. A base atual ja suporta contas, preferencias pessoais, watchlist propria, favoritos, oportunidades salvas, historico de analises e metas de lucro antes de evoluir para alertas, notificacoes ou monetizacao.

## Recursos

- Dashboard com melhores arbitragens, melhores crafts, itens com maior margem, precos abaixo da media e ultimas atualizacoes da API.
- Consulta de precos por item, servidor, cidade, categoria, tier, qualidade, preco minimo e margem minima.
- Arbitragem entre cidades com lucro bruto, taxa, lucro liquido, margem e risco.
- Simulador de crafting com secoes exclusivas para comidas, pocoes e equipamentos.
- Comparacao de crafting sem/com Focus, detalhando materiais, custo para craftar, custo para vender, receita liquida e margem.
- Catalogo de crafting gerado a partir do dump publico `ao-data/ao-bin-dumps`, incluindo comidas, pocoes, equipamentos e encantamentos com receitas oficiais.
- Precos manuais para materiais ou item final quando o Albion Online Data Project nao trouxer cotacao suficiente.
- Rankings Top 10 para arbitragem, crafting, refino, consumiveis, Black Market, quedas de preco e maior margem.
- Opportunity Score 0-100 com recomendacao: Forte oportunidade, Boa oportunidade, Monitorar ou Evitar.
- Risco estimado por frescor, rota, distancia, liquidez aproximada, variacao recente e margem anomala.
- Cadastro, login, sessao autenticada e recuperacao de senha por token.
- Perfil do utilizador com servidor principal, cidade principal, idioma, moeda/servidor, tipo de jogador, taxa de mercado, Focus e metas.
- Dashboard individual com resumo de watchlist, favoritos, oportunidades salvas, historico de analises e progresso para meta Premium.
- Watchlist propria por utilizador, protegida por autenticacao.
- Itens favoritos, oportunidades salvas e historico manual de analises.
- Historico de precos capturado durante as consultas.
- Cache em memoria para reduzir chamadas repetidas ao servico comunitario.
- Catalogo inicial com pocoes, comidas, recursos T4-T8 e equipamentos PvP comuns.

## Arquitetura

```text
backend/src/
  config/       configuracao de ambiente e servidores
  controllers/  adaptacao entre HTTP e casos de uso
  data/         catalogo e receitas iniciais
  database/     conexao, migration e seed
  middleware/   autenticacao HTTP
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
  views/        mercado, rankings, autenticacao, dashboard pessoal e perfil
```

O backend e a fonte de verdade para regras financeiras. O frontend somente coleta premissas e apresenta os resultados, evitando divergencia entre telas.

## Requisitos

- Node.js 20 ou superior
- npm 10 ou superior
- MySQL 8+ ou MariaDB 10.6+ para historico, usuarios, watchlist e preferencias

As consultas, arbitragem, crafting e rankings ainda conseguem ler dados publicos sem banco em algumas telas. Para usar historico, contas, dashboard pessoal, watchlist e preferencias, o MySQL/MariaDB precisa estar ativo.

## Instalacao

1. Instale as dependencias a partir da raiz:

   ```bash
   npm install
   ```

2. Crie o arquivo de configuracao na raiz:

   ```powershell
   Copy-Item .env.example .env
   ```

   O backend tambem aceita `backend/.env`, mas a raiz e o local recomendado para este repositorio.

3. Crie um banco vazio chamado `albion_market_analyzer` e ajuste as credenciais em `.env`.

   As chaves aceitas sao `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` ou os aliases `DB_HOST_MYSQL`, `DB_PORT_MYSQL`, `DB_USER_MYSQL`, `DB_PASSWORD_MYSQL`, `DB_NAME_MYSQL`.

   Para autenticacao, defina `JWT_SECRET` com um valor proprio antes de publicar a aplicacao. Tambem podem ser ajustados `AUTH_TOKEN_TTL_SECONDS` e `PASSWORD_RESET_TTL_MINUTES`.

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
| GET | `/api/market/prices` | Precos por item/cidade/qualidade/servidor com filtros de preco e margem |
| GET | `/api/market/arbitrage` | Comparacao de compra e venda entre cidades |
| GET | `/api/market/crafting-profit` | Ranking ou simulacao de um item |
| GET | `/api/market/refining-profit` | Ranking ou simulacao inicial de refino |
| GET | `/api/market/rankings` | Rankings consolidados da Fase 2 |
| GET | `/api/market/history` | Historico persistido |
| POST | `/api/auth/register` | Cadastro de utilizador |
| POST | `/api/auth/login` | Login e emissao de token |
| GET | `/api/auth/me` | Sessao autenticada atual |
| POST | `/api/auth/password-reset/request` | Geracao de token de recuperacao |
| POST | `/api/auth/password-reset/confirm` | Redefinicao de senha com token |
| GET | `/api/user/dashboard` | Dashboard individual |
| PATCH | `/api/user/profile` | Atualizacao de nome e email |
| GET/PATCH | `/api/user/settings` | Preferencias, taxas e metas pessoais |
| GET/POST/DELETE | `/api/user/favorites` | Favoritos pessoais |
| GET/POST/DELETE | `/api/user/opportunities` | Oportunidades salvas |
| GET/POST | `/api/user/history` | Historico pessoal de analises |
| GET/POST/DELETE | `/api/watchlist` | Watchlist pessoal autenticada |

Exemplo de arbitragem:

```text
GET /api/market/arbitrage?category=Recursos%20refinados&tier=6&qualities=1&minimumMargin=10&server=europe
```

Exemplo de crafting:

```text
GET /api/market/crafting-profit?itemId=T6_MAIN_SWORD&materialCity=Thetford&saleCity=Caerleon&quantity=10&marketTaxRate=0.065&resourceReturnRate=0.152
```

Exemplo de rankings da Fase 2:

```text
GET /api/market/rankings?server=europe&limit=10
```

Exemplo de login da Fase 3:

```text
POST /api/auth/login
Content-Type: application/json

{
  "email": "jogador@example.com",
  "password": "senha-segura"
}
```

Listas podem ser separadas por virgula nos parametros `items`, `cities` e `qualities`. Servidores aceitos: `europe`, `americas` e `asia`.

Exemplo de consulta de mercado com filtros da Fase 1:

```text
GET /api/market/prices?items=T4_METALBAR&cities=Caerleon&qualities=1&server=europe&minimumPrice=1&minimumMargin=5
```

## Formulas

Arbitragem usa compra imediata no menor `sell_price_min` e venda imediata no maior `buy_price_max` de outra cidade:

```text
lucroBruto = precoVenda - precoCompra
taxa = precoVenda * taxaMercado
lucroLiquido = lucroBruto - taxa
margemPercentual = lucroLiquido / precoCompra * 100
```

Crafting considera consumo efetivo aproximado de `quantidadeMaterial * (1 - retornoRecursos)` e receita pelo menor `sell_price_min`, simulando uma listagem competitiva. A taxa da estacao e aplicada sobre esse custo efetivo. Focus usa 47,9% apenas quando o retorno foi deixado em zero, para que uma taxa informada pelo usuario sempre prevaleca.

Opportunity Score:

```text
score = margem + liquidez aproximada + atualizacao recente - risco
```

O score usa margem limitada, presenca de venda imediata/listagem, idade das cotacoes, lucro positivo e penalidade de risco. O risco combina rota, distancia estimada, frescor do preco, liquidez nao imediata, variacao recente e margens muito fora do normal.

## Verificacao

```bash
npm run db:migrate -w backend
npm run db:seed -w backend
npm test
npm run build
```

Para validar com dados reais, suba a API e consulte `/api/health`, `/api/market/prices`, `/api/market/history`, `/api/market/arbitrage`, `/api/market/crafting-profit`, `/api/market/refining-profit` e `/api/market/rankings`.

Para validar a Fase 3, crie uma conta em `/login`, acesse `/my`, edite preferencias em `/profile`, adicione um item em `/watchlist` e confirme que os dados aparecem isolados para o utilizador autenticado.

Para atualizar o catalogo completo de crafting a partir do dump publico do Albion:

```bash
node scripts/sync-albion-crafting-data.mjs
npm run db:seed -w backend
```

## Limites dos dados

O Albion Online Data Project e comunitario. Um preco recente nao garante que a ordem ainda exista ou tenha volume suficiente. O score usa liquidez aproximada porque a API publica preco e data, nao volume real de ordens. Custos de transporte, risco de emboscada, journals, bonus locais e nutricionamento da estacao ainda nao entram no calculo.

A recuperacao de senha da Fase 3 gera e valida tokens no banco. Enquanto nao existir provedor de email configurado, o token e devolvido na resposta da API para facilitar desenvolvimento local; isso deve ser trocado por envio de email antes de qualquer ambiente publico.

As receitas iniciais de crafting e refino sao deliberadamente pequenas e ficam em `backend/src/data/recipes.js` e `backend/src/data/refiningRecipes.js`. Essa fronteira permite substituir o seed por uma fonte completa de dados do jogo sem alterar controllers ou interface. O ranking de queda de preco depende de historico suficiente no banco; em bases novas ele pode aparecer vazio ate existirem variacoes reais.
