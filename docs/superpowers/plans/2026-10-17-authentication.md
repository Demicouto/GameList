# Autenticação completa do GameList — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Execução proposta: pelo agente principal nesta sessão; a revisão deste plano precede qualquer implementação.

**Goal:** Entregar cadastro, login, logout, sessões persistentes e biblioteca isolada por usuário usando bcrypt, sem JWT.

**Architecture:** AuthModule NestJS com bcrypt e sessões opacas no PostgreSQL; identidade do guard em todos os serviços de jogos. No Expo, AuthContext e guardas de layout controlam navegação, SecureStore protege o token nativo e cookies HttpOnly mantêm a sessão Web. GamesContext usa a API real e invalida dados na troca de sessão.

**Tech Stack:** Expo 57.0.24, Router 57.0.22, React 19.2.3, RN 0.86.3, NestJS 12.1.3, Prisma 7.10.0, PostgreSQL, bcrypt 6.0.0, TypeScript 6.0.3, Jest/Supertest e jest-expo 57.

**Spec:** `GameList/docs/superpowers/specs/2026-10-17-authentication-design.md` (relativo ao workspace).

## Global Constraints

- Usar bcrypt. Não implementar JWT.
- Não abrir, imprimir, copiar ou editar valores de `.env`. Alterar somente exemplos de configuração.
- Não publicar a aplicação nem executar seed, backfill ou migrations no banco compartilhado.
- Preservar contas, jogos, IDs, associações e arquivos preexistentes do usuário.
- Senha de cadastro: pelo menos 8 caracteres Unicode e no máximo 72 bytes UTF-8. Não aparar, normalizar, registrar nem truncar.
- Usar API assíncrona de bcrypt 6.0.0, custo 12 e salt gerado pela biblioteca.
- Expiração absoluta de 30 dias, sem renovação silenciosa.
- Token: 32 bytes aleatórios, base64url de 43 caracteres; banco guarda somente SHA-256 hexadecimal de 64 caracteres.
- Cadastros válidos novos e duplicados retornam `202` e a mesma mensagem: `Solicitação processada. Tente entrar com seus dados.`
- Limitar cadastro e login a 10 requisições por 60 segundos por IP.
- O teste do frontend usa Jest 29/Testing Library 13 para SDK 57; não aplicar instruções exclusivas do SDK 58.
- Aplicar TDD por comportamento e registrar evidências RED/GREEN.
- Diagnosticar falhas com `superpowers:systematic-debugging` antes de corrigi-las.
- Executar `superpowers:verification-before-completion` antes do relatório final.

## Review Focus

1. Senhas com emoji perto de 72 bytes: rejeitar excesso e nunca autenticar por prefixo truncado (tarefas 1 e 7).
2. Sessão antiga recebendo 401 ou resposta de jogos depois de novo login: não encerrar a sessão nova nem repovoar sua biblioteca (tarefas 6 e 8).
3. Restauração offline e falha do SecureStore: oferecer nova tentativa, sem fingir login/restauração/logout bem-sucedido (tarefas 6 e 7).
4. Deep link externo, codificado ou para `/game/add?editId=`: impedir redirecionamento aberto e preservar somente destino interno válido (tarefa 7).
5. Conta legada, colisão de e-mail ou execução acidental de teste com URL Neon: preservar registros, recusar conversão ambígua e bloquear conexão não local nos testes PostgreSQL (tarefas 2 e 9).

## Organização de arquivos e execução

Paths `B/...` significam `game-list-backend/...`; `F/...` significam `GameList/...`. Os dois são repositórios Git independentes. Documentação de coordenação permanece em `F/docs/superpowers/`. Inspecionar status de ambos antes de cada conjunto de mudanças e nunca incluir o PDF preexistente ou alterações do usuário em commits.

Backend: `src/auth/` conterá DTOs, password.service, sessions.service, auth.service, session.guard, tipos e decoradores. `src/configure-app.ts` concentrará a configuração HTTP reutilizada nos testes. `scripts/legacy-passwords.ts` conterá conversão testável e `scripts/hash-legacy-passwords.ts` será o CLI protegido. DTOs e serviços de jogos permanecem em `src/games/`.

Frontend: tipos de autenticação em `src/types/auth.ts`; cliente HTTP em `src/services/api.ts`; serviços `auth-api.ts`, `games-api.ts`, `session-storage.ts` e `local-covers.ts` têm responsabilidades independentes. `src/context/AuthContext.tsx` controla sessão; `src/auth/SessionGate.tsx` e `return-to.ts` cuidam da navegação. Manter telas existentes e testar fora de `src/app`.

Cada teste abaixo deve ser escrito e executado ANTES do comportamento correspondente, um cenário por vez. Para cada ciclo: capturar RED por ausência/erro do comportamento (resolver erros de infraestrutura separadamente), implementar o mínimo, executar GREEN e refatorar somente mantendo os testes verdes. Não escrever todos os comportamentos antes de executar RED.

### Tarefa 1: Senhas bcrypt e infraestrutura backend segura

**Files:** criar `B/src/auth/password.service.ts`, `B/src/auth/password.service.spec.ts`, `B/src/auth/dto/password-bytes.validator.ts` e seu `.spec.ts`; modificar `B/package.json`, `B/package-lock.json` e, somente se diagnosticado, `B/src/prisma/prisma.service.spec.ts`.

**Interfaces:** `PasswordService.hash(password: string): Promise<string>`; `verify(password: string, hash: string): Promise<boolean>`; `isBcryptHash(hash: string): boolean`; constraint `MaxPasswordBytes` limita a 72 bytes UTF-8. Cadastro exige 8 caracteres no DTO; login exige senha não vazia.

- [x] Ler `test-driven-development`, `systematic-debugging` quando necessário e `using-git-worktrees`; preparar isolamento por repositório para execução. Revalidar instruções/status e manter os artefatos aprovados acessíveis no worktree escolhido.
- [x] Instalar `bcrypt@6.0.0` e `@types/bcrypt@6.0.0` com os motivos do spec; executar apenas testes unitários existentes: `npm test -- --runInBand`. Não executar o e2e original com AppModule antes da tarefa 4.
- [x] Se o teste PrismaService falhar por DI, registrar a falha e diagnosticar; testar construção/lifecycle com ConfigService de teste e métodos de conexão substituídos, sem abrir conexão real. Corrigir apenas a infraestrutura identificada.
- [x] Escrever testes do limite de bytes: 72 ASCII aceitos, 73 rejeitados, 18 emojis de 4 bytes aceitos e 19 rejeitados. Executar `npm test -- --runInBand password-bytes.validator.spec.ts`, observar RED e implementar a constraint.
- [x] Escrever testes bcrypt com senha de teste sintética: `expect(hash).not.toBe(password)`; `expect(getRounds(hash)).toBe(12)`; dois hashes da mesma senha diferentes; senha correta retorna true, errada retorna false; formato não bcrypt retorna false sem comparar texto puro. Rodar o arquivo e observar RED antes de cada comportamento; implementar API assíncrona.
- [x] Executar `npm test -- --runInBand password.service.spec.ts password-bytes.validator.spec.ts` até GREEN; confirmar carregamento nativo bcrypt no Node/Windows atual. Commit apenas dos arquivos desta tarefa no backend.

**Resultado da tarefa 1:** concluída por TDD em 2026-10-17 e integrada por fast-forward local em `feat/auth`. Commits backend: `1fa2f8d` (isolamento), `050984b` (serviço/validação/testes) e `df47c6a` (exclusão de worktrees da descoberta Jest). A investigação também exigiu ajuste de resolução `.js` em `B/jest.config.ts`. Suíte: 4 arquivos/31 testes; foco: 27 testes; typecheck e build com exit 0. Evidências sanitizadas: `B/docs/superpowers/verification/2026-10-17-task-1.md`. Tarefas 2–10 permanecem pendentes; o usuário limitou esta execução à tarefa 1.

### Tarefa 2: Schema aditivo, seed e conversão legada preservando dados

**Files:** modificar `B/prisma/schema.prisma`, `B/prisma/seed.ts`, scripts do `B/package.json`; criar `B/prisma/migrations/20261017000000_auth_sessions/migration.sql`, `B/scripts/legacy-passwords.ts`, `B/scripts/legacy-passwords.spec.ts`, `B/scripts/hash-legacy-passwords.ts`.

**Interfaces:** User recebe `username: string | null`; Session possui `id`, `userId`, `tokenHash`, `createdAt`, `expiresAt`. `convertLegacyPasswords(store, options: { apply: boolean }): Promise<{ candidates: number; converted: number; skipped: number }>` recebe operações de leitura/atualização condicional injetadas; o CLI exige URL explícita `AUTH_MIGRATION_DATABASE_URL`, nunca usa DATABASE_URL como fallback.

- [ ] Escrever/rodar testes do conversor: dry-run não atualiza; apply gera bcrypt custo 12 preservando id; hash bcrypt existente não muda; formato desconhecido/mais de 72 bytes aborta; comparação condicional protege senha alterada concorrentemente; saída não contém senha/hash/identificador. Comando `npm test -- --runInBand legacy-passwords.spec.ts`; registrar RED por caso antes da implementação.
- [ ] Implementar conversão sem logs de registros, sem acesso implícito a `.env`; default dry-run e `--apply` explícito. Guardar modos de hash desconhecidos e usar a API da tarefa 1. CLI nunca será executado contra o banco compartilhado nesta tarefa.
- [ ] Adicionar username nullable/unique e relação User.sessions. Acrescentar Session e índices; escrever SQL que cria coluna/tabela/índices e índice funcional `lower(btrim(email))`, com falha em colisão e nenhuma alteração de linhas antigas. Não usar migrate dev, reset ou db push no Neon.
- [ ] Preservar os upserts de plataformas no seed e remover a criação automática da conta com credencial literal, sem código que apague a conta já existente.
- [ ] Executar CLI local Prisma de geração/validação sem conexão: `npx --no-install prisma generate --schema prisma/schema.prisma` e `npx --no-install prisma validate --schema prisma/schema.prisma`. Se a CLI exigir config, usar config offline com URL fictícia local, sem carregar credenciais compartilhadas. Testar aplicação real da migration apenas na tarefa 9.
- [ ] Rodar a suíte do conversor e revisar SQL para ausência de DROP/DELETE/TRUNCATE/reset. Commit dos arquivos desta tarefa.

### Tarefa 3: Cadastro, login e sessões no serviço

**Files:** criar `B/src/auth/{auth.types.ts,auth.service.ts,auth.service.spec.ts,sessions.service.ts,sessions.service.spec.ts}` e `dto/{register.dto.ts,login.dto.ts,auth-dto.spec.ts}`.

**Interfaces:** `PublicUser` e respostas seguem o spec. `AuthService.register(dto: RegisterDto): Promise<{ message: string }>`; `login(dto: LoginDto): Promise<{ user: PublicUser; token: string; expiresAt: Date }>`; `SessionsService.create(userId: string): Promise<{ token: string; expiresAt: Date }>`; `resolve(token: string): Promise<{ user: PublicUser; sessionId: string; expiresAt: Date }>`; `revoke(token?: string): Promise<void>`.

- [ ] Escrever testes DTO com valores exatos do spec: nome vazio/longo, username inválido/normalizado, e-mail inválido e senha UTF-8; rejeitar campos adicionais na camada HTTP da tarefa 4. Executar `npm test -- --runInBand auth-dto.spec.ts`, RED e implementação por caso.
- [ ] Escrever testes de sessões com relógio controlado e persistência injetada: token com 43 caracteres, armazenado com 64 caracteres de hash e sem token bruto; expiração exatamente `now + 2592000000`; resolve rejeita token malformado, ausente, expirado ou usuário ausente; revoke é idempotente. Rodar `sessions.service.spec.ts` em ciclos RED/GREEN e implementar com node:crypto e Prisma.
- [ ] Escrever testes de register: normalização, senha somente bcrypt, retorno 202 lógico igual para novo/duplicado inclusive erro unique de corrida; outros erros de banco não viram sucesso. Implementar após RED em `auth.service.spec.ts`.
- [ ] Escrever testes login: e-mail/username com caixa e bordas inclusive no e-mail legado armazenado, senha preservada, retorno público sem password/tokenHash, desconhecido/incorreto/hash legado com a mesma exceção 401, dummy compare no desconhecido. Implementar após RED; lookup por e-mail usa `lower(btrim(email))` com SQL Prisma parametrizado, nunca SQL concatenado/unsafe; username usa findUnique normalizado.
- [ ] Rodar `npm test -- --runInBand src/auth` até GREEN e fazer commit dos arquivos desta tarefa.

### Tarefa 4: HTTP, cookies, guardas, CORS, CSRF e limitação de tentativas

**Files:** criar `B/src/auth/{auth.module.ts,auth.controller.ts,session.guard.ts,session.guard.spec.ts,public.decorator.ts,current-user.decorator.ts,session-transport.ts,session-transport.spec.ts}`, `B/src/configure-app.ts`, `B/test/auth.e2e-spec.ts`, `B/test/support/http-app.ts`; modificar `B/src/{main.ts,app.module.ts,app.controller.ts}`, `B/src/platforms/platforms.controller.ts`, `B/test/app.e2e-spec.ts`, `B/test/jest-e2e.json`, manifests e `B/.env.example` com placeholders novos.

**Interfaces:** `configureApp(app: INestApplication, config: ConfigService): void` configura as mesmas proteções no runtime e nos testes; `@Public()` permite exceção ao guard global; `@CurrentUser()` fornece `PublicUser`/identidade apenas validada. Transporte escolhe cookie ou bearer no login, resolve credencial em requisições e limpa cookies no logout. Config: `AUTH_ALLOWED_ORIGINS` (origens exatas), `AUTH_COOKIE_SAME_SITE` (`lax` ou `none`); produção exige Secure automaticamente.

- [ ] Adicionar `cookie-parser@1.4.7`, `@types/cookie-parser@1.4.10`, `@nestjs/throttler@6.7.1`; declarar common/core/platform-express com mínimo ^12.1.3, já instalado, por causa do CSRF nativo. Não adicionar JWT ou pacote CSRF.
- [ ] Antes de rodar e2e, criar helper HTTP com ConfigModule sem arquivo env, Prisma substituído antes de inicializar app e credenciais exclusivamente sintéticas. Adaptar e2e de exemplo para esse helper. Testar que setup não constrói/abre conexão com Prisma de produção. A configuração HTTP padrão exclui `auth-db.e2e-spec.ts`; a integração PostgreSQL só roda pelo comando/config próprios da tarefa 9.
- [ ] Escrever testes de guard/transport: ausência, malformação, credencial dupla conflitante, metadado Public, usuário atual, cookie host-only/HttpOnly/SameSite/Secure em produção e token omitido da resposta cookie. Rodar `npm test -- --runInBand session.guard.spec.ts session-transport.spec.ts`, RED/GREEN.
- [ ] Escrever testes HTTP cadastro/login/me/logout com os contratos do spec; logout repetido/expirado retorna 204; respostas não contêm senhas/hashes. Rodar `npm run test:e2e -- --runInBand auth.e2e-spec.ts` e implementar controllers/módulo após cada RED.
- [ ] Cobrir em HTTP: validação 400 sem valores sensíveis, 401 genérico, `Cache-Control: no-store`, origem permitida/bloqueada, POST cross-site 403, mobile sem Origin permitido, cookies seguros e 11ª tentativa em 60 s retornando 429. Implementar configuração/guardas após RED por proteção, sem desabilitar segurança nos testes.
- [ ] Rodar unitários e e2e isolados até GREEN; documentar rate limit por instância e cookie SameSite/HTTPS nos exemplos, sem abrir `.env` real. Commit dos arquivos desta tarefa.

### Tarefa 5: Propriedade dos jogos e contratos usados pela interface

**Files:** modificar `B/src/games/{games.controller.ts,games.service.ts}` e `dto/{create-game.dto.ts,update-status.dto.ts}`; criar `dto/update-game.dto.ts`, `games.service.spec.ts` e `B/test/games-auth.e2e-spec.ts`. Atualizar Swagger para identidade autenticada.

**Interfaces:** manter operações existentes recebendo `userId` do guard; adicionar `findOne(userId: string, id: string)` e `update(userId: string, id: string, dto: UpdateGameDto)`. Endpoints novos `GET /games/:id` e `PATCH /games/:id`; status aceita `null`. Resposta Game inclui plataforma real; seleção de plataforma continua por platformId.

- [ ] Escrever testes de dois usuários em LIST/CREATE/GET/PATCH/STATUS/FAVORITE/RATING/DELETE: sem credencial 401; A não acessa/altera dados de B (404); id enviado por query nunca muda a identidade; `userId` no body é rejeitado. Rodar `npm run test:e2e -- --runInBand games-auth.e2e-spec.ts`, RED/GREEN por endpoint.
- [ ] Testar filtros Prisma de id+userId para leituras/mutações e propriedade sempre obtida do guard. Remover `@Query('userId')`, ApiQuery e TODOs correspondentes somente depois do RED.
- [ ] Escrever testes para obter/editar somente jogo próprio, limpar status com null, validar plataforma real/nota 0–5/capa HTTP(S) e conservar campos não enviados. Rodar `npm test -- --runInBand games.service.spec.ts`, RED e implementação por comportamento.
- [ ] Executar os e2e auth/jogos e unitários, verificar a matriz inteira de endpoints protegidos e fazer commit dos arquivos desta tarefa.

### Tarefa 6: Cliente API, armazenamento e estado de autenticação Expo

**Files:** modificar `F/package.json`, `F/package-lock.json`, `F/app.json`, `F/src/services/api.ts`; criar `F/jest.config.js`, `F/jest.setup.ts`, `F/src/types/auth.ts`, `F/src/services/{session-storage.ts,auth-api.ts}`, `F/src/context/AuthContext.tsx` e testes `F/__tests__/{api,session-storage,auth-context}.test.ts(x)`; criar `F/.env.example` com EXPO_PUBLIC_API_URL fictícia.

**Interfaces:** `apiRequest<T>(path, options): Promise<T>` lança `ApiError { status, message }`, aceita AbortSignal e comunica 401 com a revisão da sessão que originou a requisição. `authApi` oferece register/login/me/logout com contratos do spec. `SessionStorage` tem `read(): Promise<string | null>`, `write(token: string): Promise<void>`, `clear(): Promise<void>`, com chamadas SecureStore somente no nativo. `useAuth()` fornece status, user, revision, login, register, logout e retryRestore.

- [ ] Instalar `expo-secure-store ~57.0.4` via Expo install; instalar dev jest-expo ~57.0.5, Jest ^29.7.0, @types/jest ^29.5.14, @react-native/jest-preset 0.86.3, Testing Library 13.3.3 e react-test-renderer 19.2.3. Conferir peers e manter React/RN existentes. Adicionar script `test: jest` e preset SDK 57; arquivos de teste fora de app.
- [ ] Escrever testes HTTP-client/storage: bearer+omit no nativo; include sem bearer nem armazenamento de token na Web; 204 não faz parse JSON; erros rede/400/401/403/5xx distintos; token nunca em URL/log. Executar `npm test -- --runInBand api.test.ts session-storage.test.ts`, RED/GREEN por caso.
- [ ] Escrever testes de bootstrap: checking bloqueia sessão prematura; nativo sem token é anonymous; token/cookie válido consulta me; 401 limpa; erro rede/5xx/SecureStore vira restore-error e permite retry. Rodar `auth-context.test.tsx`, RED/GREEN.
- [ ] Escrever testes login: servidor confirma e armazenamento termina antes de authenticated; falha no SecureStore impede login e tenta revogar token criado. Logout: erro rede conserva sessão para retry; sucesso revoga e limpa; falha na limpeza local não restaura sessão revogada. Implementar por RED/GREEN.
- [ ] Adicionar testes com promessas adiadas: 401/restore antigo depois de login novo não limpa a sessão nova. Implementar revisão/aborto de requisições. Rodar suítes e typecheck; fazer commit frontend apenas dos arquivos desta tarefa.

### Tarefa 7: Formulários, rotas protegidas, perfil e destino pretendido

**Files:** modificar `F/src/app/{_layout.tsx,index.tsx}`, `(auth)/{_layout.tsx,login.tsx,register.tsx}`, `(tabs)/{_layout.tsx,profile.tsx,home.tsx}`; criar `F/src/app/game/_layout.tsx`, `F/src/auth/{SessionGate.tsx,return-to.ts,password-policy.ts}` e `F/__tests__/{auth-screens,protected-routes,return-to,password-policy}.test.ts(x)`.

**Interfaces:** `SessionGate({ children })` renderiza conteúdo somente autenticado; checking/restore-error mostram carregamento/retry; anonymous redireciona login com returnTo. `parseReturnTo(input: unknown): SafeDestination` aceita somente os destinos do spec e tem fallback `/home`; `validateRegistration(input)`/política de senha segue 8 caracteres e 72 bytes sem Buffer na RN.

- [ ] Escrever teste de retorno para destino interno/UUID/editId válidos, destinos externos, barras duplas/backslash, codificação, auth loops e parâmetros não permitidos. Rodar `npm test -- --runInBand return-to.test.ts`; implementar sanitização depois dos RED, sem casts de strings não validadas para rotas.
- [ ] Escrever testes de SessionGate usando `expo-router/testing-library` compatível com SDK 57: deep link deslogado exige login; restauração não mostra conteúdo privado; login volta ao destino; expiração volta a login; user autenticado sai de login/register. Rodar `protected-routes.test.tsx` RED/GREEN e conectar layouts.
- [ ] Escrever testes da política de senha ASCII/emoji e mensagens de campo; confirmar senha sem aparar; invalidade impede envio. Rodar `password-policy.test.ts` e depois implementar helper/validação na tela.
- [ ] Escrever testes de telas para cadastro real seguido de login, resposta genérica de cadastro, credencial incorreta, progresso, dupla submissão bloqueada, erro de rede, nome do usuário e logout acessível na tela de perfil. Rodar `auth-screens.test.tsx`, RED/GREEN por comportamento e preservar classes/estilo existentes.
- [ ] Conectar botão Perfil na home e feedback de recursos indisponíveis (social/recuperação/avatar), sem implementar serviços adicionais. Rodar as suítes da tarefa e `npm run typecheck`; commit frontend.

### Tarefa 8: Biblioteca real por usuário e capas locais isoladas

**Files:** modificar `F/src/types/game.ts`, `F/src/context/GamesContext.tsx`, `F/src/components/{GameCard.tsx,GameStatusSheet.tsx}`, `F/src/app/(tabs)/{home.tsx,games.tsx}`, `F/src/app/game/{add.tsx,[gamesid].tsx}`; criar `F/src/services/{games-api.ts,local-covers.ts}` e `F/__tests__/{games-api,games-context,local-covers,game-screens}.test.ts(x)`. Preservar os arquivos/assets de exemplos, retirando-os da fonte operacional.

**Interfaces:** tipos `ApiGame` e `Game` separam payload API e modelo de apresentação, com platformId real e nome da plataforma. `gamesApi` implementa list/get/create/update/status/favorite/rating/remove e platforms. `GamesContext` fornece games/stats/loading/error/reload e mutações Promise, recebe a revisão de sessão e só confirma atualizações após resposta. `localCovers` lê/escreve URI por userId/gameId em AsyncStorage existente.

- [ ] Escrever testes de mapeamento API: status enum/null, platformId/nome, notas/favoritos e URL de capa; nenhum userId escolhido pelo cliente; plataformas vêm da API. Rodar `games-api.test.ts`, RED/GREEN.
- [ ] Escrever testes do contexto: biblioteca começa vazia, carrega API da conta, erros exibíveis sem sucesso falso, criação/edição/status/favorito/nota são remotos, estatísticas derivadas da resposta real. Rodar `games-context.test.tsx`, RED/GREEN por operação.
- [ ] Testar resposta tardia da conta A após entrar em B: descartar resultado e limpar dados na saída/troca. Testar que 401 da revisão antiga não afeta B. Implementar invalidação/aborto após RED.
- [ ] Escrever testes local-covers: chaves separadas por conta, persistência somente após confirmação da API, nenhum file/content/blob/data URI enviado como coverUrl, falha do cache não simula erro da operação remota já salva. Implementar overlay e fallback visual; texto explica capa somente no dispositivo.
- [ ] Escrever testes das telas: adicionar/editar espera API e lida com falha; status sem valor usa null; favoritos/nota aguardam resposta; detalhe aguarda carregamento antes de dizer inexistente; home/lista têm loading/erro/vazio e nome real, sem conquistas/progresso demonstrativos como dados pessoais. Implementar e preservar layout quando suportado pelos dados reais.
- [ ] Rodar `npm test -- --runInBand games-api.test.ts games-context.test.tsx local-covers.test.ts game-screens.test.tsx`, suíte frontend completa e typecheck; commit frontend.

### Tarefa 9: Integração PostgreSQL descartável e migration preservando registros

**Files:** criar `B/prisma.test.config.ts`, `B/test/support/{test-database.ts,test-database.spec.ts}`, `B/test/auth-db.e2e-spec.ts`, `B/test/jest-db.json`, script `test:db` em `B/package.json`. Configuração de teste não importa dotenv nem escolhe DATABASE_URL de produção.

**Interfaces:** `assertDisposableDatabaseUrl(url: string | undefined): URL` aceita somente URL explícita `AUTH_TEST_DATABASE_URL` com host loopback e nome `gamelist_auth_test`; ausente/remota falha antes de instanciar Prisma/pg. Mesmo guard deve ser usado pela config Prisma de testes e pelo fixture. Não executar reset, DROP ou db push; usar banco descartável novo, migrations aditivas e somente fixtures sintéticas.

- [ ] Escrever teste do guard contra URL ausente, Neon/remota, nome errado e credenciais contendo caracteres codificados. Rodar suíte unitária RED/GREEN e só então autorizar conexões de teste.
- [ ] Verificar daemon Docker. Se disponível, criar Postgres 17-alpine descartável, nome único, label de finalidade, porta somente 127.0.0.1, sem bind/volume compartilhado. Não iniciar/remover containers preexistentes. Se Docker não puder rodar, registrar bloqueio e não usar Neon como substituto.
- [ ] Na base descartável, aplicar a migration inicial, inserir duas contas/jogos sintéticos legados e testar a nova migration: IDs/jogos preservados, username antigo null, Session disponível, colisão case-insensitive rejeitada sem merge. Testar conversão dry-run/apply e resultado bcrypt sem imprimir valores.
- [ ] Escrever/rodar antes da implementação de cada eventual ajuste os testes reais de registro, login, sessão persistida após recriar serviço, logout, expiração e isolamento de dois usuários; testar dois cadastros concorrentes iguais com resposta genérica e só uma conta criada. Comando `npm run test:db -- --runInBand` usa exclusivamente a base verificada.
- [ ] Executar integração até GREEN; parar somente o container único criado para este teste, que pode usar --rm, e documentar saída ou limitação. Commit dos testes/configurações desta tarefa.

### Tarefa 10: Documentação operacional, revisão e verificações finais

**Files:** atualizar `B/README.md`, `F/README.md`, ambos `.env.example` e documentos de plano/evidências. Criar `F/docs/superpowers/verification/2026-10-17-authentication.md` com resultados e limitações sem dados sensíveis.

- [ ] Documentar contratos, origens/HTTPS/cookies, SecureStore/build nativo, URL da API, sessões e limite bcrypt. Registrar a sequência de rollout autorizada para migration/backfill sem executar no banco compartilhado; contas legadas sem username entram por e-mail, credenciais não convertidas exigem conversão/redefinição administrativa.
- [ ] Documentar substituição dos dados demonstrativos, capas somente no dispositivo e fluxos ainda indisponíveis (OAuth, recuperação por e-mail, upload de avatar/capa, conquistas). Não alegar suporte que o backend não tem.
- [ ] Aplicar `superpowers:verification-before-completion`. Executar no backend `npm test -- --runInBand`, `npm run test:e2e -- --runInBand`, `npm run test:db -- --runInBand` se banco local disponível, `npx --no-install tsc --noEmit`, `npm run build`, e geração/validação Prisma offline. Tratar erros com systematic-debugging e repetir somente verificações afetadas.
- [ ] No frontend executar `npm test -- --runInBand` e `npm run typecheck`. Não publicar/EAS deploy. Registrar separadamente limitações de navegador/dispositivo não exercitado.
- [ ] Revisar `git diff --check`, diffs/status em ambos, segredos/logs retornados, filtros de propriedade, dependências/lockfiles e ausência de mudanças no `.env` e no PDF do usuário. Registrar saídas finais e exemplos sanitizados dos ciclos RED/GREEN.
- [ ] Fazer commits somente dos arquivos próprios revisados em cada repositório. Entregar resumo dos arquivos, decisões de segurança, migration/backfill ainda necessários e comandos com suas saídas, distinguindo integração HTTP com doubles e integração PostgreSQL real.

## Aprovação e estado

- [x] Desenho aprovado pelo usuário, incorporando bcrypt e ausência de JWT.
- [x] Especificação e plano escritos para revisão; autoverificação de cobertura, tipos e cenários de falha.
- [x] Plano aprovado pelo usuário.
- [ ] Implementação autorizada após essa aprovação e executada por TDD.

O Docker local estava parado na inspeção. Na fase inicial de planejamento não foram executados testes nem alterações de produto. Após a aprovação, somente a tarefa 1 foi implementada e verificada conforme o resultado acima; nenhuma migration, seed ou conversão de dados foi executada.
