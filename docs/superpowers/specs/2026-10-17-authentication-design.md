# Autenticação do GameList — desenho aprovado

Data: 2026-10-17. Escopo: os repositórios irmãos `GameList` e `game-list-backend`.
O usuário aprovou o desenho da autenticação, com bcrypt e sessões opacas, sem JWT.
Este documento consolida esse desenho e explicita contratos para o plano que será revisado antes da implementação.

## Objetivo e limites

Criar contas, entrar, sair e restaurar sessões reais; proteger telas e endpoints; isolar a biblioteca pelo usuário autenticado. Manter os padrões Expo Router/React Context e módulos/controllers/services/DTOs do NestJS com Prisma/PostgreSQL.

Usar bcrypt. Não implementar JWT. Não abrir, imprimir, copiar ou editar valores de `.env`. Alterar somente exemplos de configuração. Não publicar a aplicação nem executar seed, backfill ou migrations no banco compartilhado. Preservar contas, jogos, IDs, associações e arquivos preexistentes do usuário.

Aplicar TDD por comportamento e registrar evidências RED/GREEN. Diagnosticar falhas com `superpowers:systematic-debugging` antes de corrigi-las. Executar `superpowers:verification-before-completion` antes do relatório final. A aprovação do plano é obrigatória antes de mudanças de implementação, conforme a solicitação original.

## Situação inspecionada

- `GameList/AGENTS.md`, também referenciado por `CLAUDE.md`, exige a documentação exata do Expo SDK 57 antes de escrever código. Nenhuma outra instrução AGENTS aplicável foi encontrada nos ancestrais ou no backend fora de dependências.
- Instalados: Expo 57.0.24, Router 57.0.22, React 19.2.3, React Native 0.86.3, TypeScript 6.0.3; Nest core/platform-express 12.1.3, Prisma 7.10.0, Jest backend 30.5.2 e ts-jest 29.4.14. Node local 25.9.0.
- `src/services/api.ts` é um placeholder. Login apenas navega para `/home`; cadastro apenas navega para `/login`. Não há sessão ou guardas.
- `GamesContext` começa com `GAMES` demonstrativos e altera estado local. A tela inicial também contém nome, destaque e conquistas demonstrativos. Cadastro/edição de jogos aceita capas escolhidas no dispositivo.
- O backend possui `User { id, name, email, password, createdAt }`, `Platform` e `Game.userId` obrigatório. Os serviços verificam propriedade, mas os controllers recebem a identidade por `?userId=`; não há autenticação.
- Há uma migration inicial. O seed cria plataformas e uma conta de teste com uma expressão de senha literal, cujo valor não foi exposto. Não foi consultado o conteúdo do banco.
- Backend tem testes de controller, PrismaService e um e2e de exemplo. O e2e atual importa AppModule e pode inicializar uma conexão real; deve ser isolado antes de executar. O frontend não tem infraestrutura de testes.
- O frontend está em `main`, com um PDF preexistente não rastreado; o backend está em `feat/auth`. Os repositórios são independentes. Preservar esse PDF e qualquer nova mudança do usuário.

## Arquitetura escolhida

Módulo `AuthModule` com serviço de senhas, serviço de autenticação, serviço de sessões, guard global e decoradores de usuário atual/rota pública. Usar o Prisma existente para usuários e sessões. Endpoints públicos: raiz, plataformas, cadastro, login e logout idempotente. Todos os demais endpoints exigem uma sessão válida por padrão.

Um token opaco identifica uma sessão revogável no banco. Cada sessão nova recebe 32 bytes aleatórios criptograficamente seguros, codificados em base64url: 43 caracteres. Persistir somente SHA-256 hexadecimal do token, nunca o token bruto. SHA-256 é usado exclusivamente para tokens aleatórios de alta entropia; senhas usam bcrypt. Expiração absoluta de 30 dias, sem renovação silenciosa. Conferir expiração e existência do usuário em toda requisição protegida.

Essa solução permite logout imediato e não depende de JWT, Passport ou provedor externo. Alternativas consideradas: JWT exigiria controles adicionais de revogação; um provedor hospedado acrescentaria serviço/configuração e mudaria a arquitetura existente.

## Contratos HTTP

`PublicUser = { id: string; name: string; username: string | null; email: string; createdAt: string }`.
Datas HTTP são ISO-8601. Campos de senha, hash e dados internos da sessão nunca fazem parte de `PublicUser`.

| Endpoint | Entrada | Sucesso | Falhas principais |
| --- | --- | --- | --- |
| `POST /auth/register` | `{ name, username, email, password }` | `202 { message: "Solicitação processada. Tente entrar com seus dados." }`, tanto para criação quanto para duplicidade | `400` para formato inválido; `429` para excesso de tentativas |
| `POST /auth/login` | `{ identifier, password }`; header `X-Auth-Transport: bearer` no app nativo, `cookie` na Web (padrão) | `200 { user: PublicUser, expiresAt, token? }`; `token` somente no transporte bearer | `401 { message: "Credenciais inválidas." }` para identificador inexistente, senha incorreta ou credencial legada não convertida; `400` para formato inválido; `429` |
| `GET /auth/me` | Bearer ou cookie | `200 { user: PublicUser, expiresAt }` | `401` para sessão ausente, malformada, revogada ou expirada |
| `POST /auth/logout` | Credencial atual, se disponível | `204`; revoga somente essa sessão e limpa cookie | Repetições e credenciais ausentes/expiradas também retornam `204`; falhas reais de banco/rede não simulam revogação bem-sucedida |

Não autenticar automaticamente após cadastro: manter o fluxo existente de cadastro para login e preservar o destino pretendido entre as telas. Resposta de cadastro idêntica em status/corpo para conflitos de e-mail ou username; não oferecer endpoint público de disponibilidade de conta. Calcular bcrypt também no caminho de duplicidade e realizar comparação com hash fictício válido no login sem usuário. Isso reduz diferenças triviais de tempo sem prometer tempo constante de rede/banco.

Preservar o envelope de erro padrão do Nest (`statusCode`, `error`, `message`); a tabela fixa a mensagem, não elimina esses metadados. Para sessão inválida, usar `Sessão inválida ou expirada.` em todas as causas de 401 de sessão. Não incluir detalhes de existência de usuário.

Validar o header de transporte; cookie não retorna token no corpo. No guard, bearer malformado não pode cair silenciosamente para um cookie válido; rejeitar credenciais ambíguas/conflitantes. Usar `Cache-Control: no-store` nas respostas de autenticação.

## Entradas e senhas

- Nome: aparar bordas, 1–100 caracteres.
- Username: aparar bordas e normalizar para minúsculas; 3–30 caracteres ASCII, somente `a-z`, `0-9` e `_`, sem `@`. Único.
- E-mail: aparar bordas, validar formato, até 254 caracteres, normalizar novos registros para minúsculas. Identificação/uniquidade deve desconsiderar caixa e espaços nas bordas, sem alterar e-mails antigos.
- Senha de cadastro: pelo menos 8 caracteres Unicode e no máximo 72 bytes UTF-8. Não aparar, normalizar, registrar nem truncar. Login aceita senha não vazia dentro do limite de bytes para compatibilidade com credenciais legadas já convertidas.
- Usar API assíncrona de bcrypt 6.0.0, custo 12 e salt gerado pela biblioteca. Não pré-hashear senhas e não implementar comparação em texto puro. Aceitar hashes bcrypt existentes válidos; não reescrever hashes antigos nesta entrega.
- Confirmação de senha e o checkbox existente são validações da interface. Não alegar confirmação de e-mail, auditoria de consentimento ou recuperação de senha, pois esses serviços não existem.
- Reutilizar ValidationPipe com whitelist/forbidNonWhitelisted e impedir inclusão de valores/alvos nos erros de validação. Nunca incluir DTOs, senhas, tokens, cookies ou hashes em logs ou mensagens de erro.
- Limitar cadastro e login a 10 requisições por 60 segundos por IP usando `@nestjs/throttler`. Armazenamento de limite em memória atende a instância atual; múltiplas instâncias exigiriam armazenamento compartilhado.

## Transporte, armazenamento e ciclo da sessão

**iOS/Android:** enviar bearer no Authorization e `credentials: omit`. Guardar somente o token no `expo-secure-store`, com acessibilidade `WHEN_UNLOCKED_THIS_DEVICE_ONLY` no iOS; não usar AsyncStorage para credenciais. Validar a sessão com `/auth/me` ao iniciar. Falha ao salvar uma sessão recém-criada impede marcar o cliente como autenticado e dispara revogação dessa sessão quando a rede permitir.

**Web:** usar `credentials: include` e cookie host-only, `HttpOnly`, `Path=/`, expiração de 30 dias. Usar `__Host-gamelist_session` e Secure em produção, `gamelist_session` no desenvolvimento local HTTP. SameSite=Lax por padrão; permitir None somente com Secure e origens explícitas quando a hospedagem exigir. Não guardar tokens em localStorage, sessionStorage ou AsyncStorage. Restaurar por `/auth/me`.

Configurar lista explícita de origens no CORS com credentials, nunca `*`. Aplicar a proteção CSRF nativa do NestJS 12.1 com a mesma lista de `trustedOrigins`. Elevar o mínimo declarado de common/core/platform-express para a versão instalada 12.1.3, pois a API CSRF depende de 12.1. Não adicionar pacote CSRF. HTTPS é requisito de produção; plataformas/API precisam de URL pública configurada, sem credenciais no frontend. Cookies entre sites distintos dependem também das regras de cookies do navegador; preferir frontend/API no mesmo site.

Estados do cliente: `checking`, `authenticated`, `anonymous`, `restore-error`. Só permitir telas privadas após validação. Ausência de token no nativo é anônima; Web consulta `/auth/me` porque o cookie é inacessível a JavaScript. `401` da sessão atual limpa credencial, usuário e biblioteca; falha de rede/5xx permite tentar novamente e não apaga credencial válida. `403` não encerra a sessão automaticamente.

Logout aguardará revogação remota. Falha de rede exibe erro para nova tentativa; não afirmar que a sessão remota foi encerrada. Após revogar, limpar credencial local e estado; eventual falha local mantém estado anônimo e oferece nova tentativa de limpeza. Respostas de requisições de uma sessão anterior não podem afetar uma sessão nova ou repovoar sua biblioteca.

## Navegação e telas

Manter a estrutura `(auth)`, `(tabs)` e `game`. Um componente `SessionGate` nos layouts de `(tabs)` e de `game` verifica a sessão antes de renderizar telas privadas, com carregamento e tentativa de restauração. Essa abordagem por layout preserva a URL de deep link ao redirecionar para login. Não importar bibliotecas de navegação externas ao Expo Router.

Destino de retorno é interno e validado por allowlist: `/home`, `/games`, `/library`, `/search`, `/profile`, `/game/add` (com `editId` UUID opcional) e `/game/<UUID>`. Recusar destinos externos, esquemas, barras duplas, backslashes, rotas de autenticação e parâmetros desconhecidos. Após login, ir ao destino válido ou `/home`. Usuários já autenticados não precisam voltar às telas de login/cadastro. A welcome continua sendo a entrada pública.

Conectar formulários existentes, mantendo estilo, acessibilidade e exibição opcional de senha. Validar entrada e confirmação, mostrar progresso/erro e impedir envios concorrentes. Exibir nome real na home e oferecer dados do usuário e logout na tela de perfil, com navegação acessível a partir da home. Recursos de login social, recuperação de senha e foto de perfil ainda sem backend devem aparecer como indisponíveis, sem prometer operação funcional.

## Banco, migration e credenciais preexistentes

Manter o campo `User.password`, agora contendo exclusivamente bcrypt para contas utilizáveis pelo novo fluxo. Adicionar `username String? @unique`, permitindo que contas antigas continuem entrando por e-mail sem inventar um username. Novos cadastros exigem username.

Adicionar `Session { id UUID, userId, tokenHash unique, createdAt, expiresAt }`, FK para User e índices em userId/expiração. Manter FK Game→User. Adicionar índice único PostgreSQL em `lower(btrim(email))` por SQL manual, pois o Prisma não representa esse índice funcional diretamente. A migration deve abortar se houver colisões existentes; não mesclar, apagar ou renomear contas automaticamente. Só acrescentar coluna, tabela e índices; não editar a migration inicial.

O lookup de e-mail usa a mesma expressão `lower(btrim(email))` em consulta SQL parametrizada via Prisma, para localizar também registros antigos com caixa/espaços preservados. Não usar interpolação de texto SQL nem `$queryRawUnsafe`. Username novo normalizado usa a consulta Prisma tipada por índice único.

Preparar script separado para conversão de senhas legadas. Padrão dry-run, somente contagens; aplicação exige URL explicitamente fornecida e `--apply`. Preservar IDs, jogos, campos pessoais e hashes bcrypt existentes. Converter somente texto puro declarado como legado, com bcrypt custo 12 e atualização condicional pelo valor lido para não sobrescrever troca concorrente. Recusar formatos de hash desconhecidos e senhas acima de 72 bytes; não truncar nem fazer hash de outro hash. Não imprimir senhas/hashes nem exemplos extraídos do banco. Esse script não será executado no banco compartilhado nesta tarefa.

Remover do seed a criação automática da conta com senha literal; manter os upserts de plataformas. Isso não remove a conta já existente. Contas legadas sem hash bcrypt válido não entram até a conversão ou um procedimento administrativo de redefinição. A ordem operacional documentada será: verificar colisões, aplicar migration aditiva em ambiente autorizado, converter credenciais legadas, gerar client e iniciar o novo código.

## Biblioteca vinculada à conta

Todos os endpoints de jogos usam a identidade do guard; nenhum body/query define proprietário. Manter `404` tanto para jogo ausente quanto pertencente a outra conta. Incluir id e userId no filtro de cada leitura/mutação. Proteger listagem, cadastro, edição, status, favorito, nota e exclusão.

Completar os contratos necessários pela UI: `GET /games/:id` e `PATCH /games/:id` para metadados, além dos endpoints atuais. Status pode ser `null` para o controle existente “Sem status”. Metadados editáveis: título, plataforma existente, desenvolvedor, gênero, capa HTTP(S); conservar nota/favorito salvo quando explicitamente alterados. Plataformas vêm de `GET /platforms`, sem inventar IDs nem cadastrar plataformas durante autenticação.

`GamesContext` carrega a biblioteca da API após autenticação, oferece estados de carregamento/erro e operações assíncronas. Dados só mudam para sucesso após confirmação da API; erros não podem virar sucesso aparente. Limpar estado e invalidar requisições pendentes na troca/fim de sessão. Estatísticas usam somente jogos da conta. Remover os exemplos como fonte operacional, preservando arquivos/assets demonstrativos. Mostrar estados vazios reais e não apresentar conquistas/progresso fictícios como atividade pessoal.

A API atual só aceita URL de capa e não implementa upload. Preservar capas escolhidas no dispositivo como sobreposição local, com AsyncStorage existente, chave por userId e gameId, sem enviar `file:`, `content:`, `blob:` ou data URLs ao backend. Aplicar a sobreposição somente ao usuário atual e somente depois de salvar o jogo. Informar que a imagem escolhida permanece naquele dispositivo; arquivos locais podem deixar de existir e devem ter fallback visual. URLs HTTP(S) do backend continuam portáveis. Upload e sincronização de mídia ficam fora desta entrega.

## Dependências justificadas e verificadas

Metadados oficiais npm e pacotes instalados consultados em 2026-10-17:

| Pacote | Versão proposta | Necessidade/compatibilidade |
| --- | --- | --- |
| `bcrypt` / `@types/bcrypt` | 6.0.0 / 6.0.0 | Hash assíncrono; Node >=18, compatível com Node local 25; verificar carregamento nativo no Windows |
| `cookie-parser` / `@types/cookie-parser` | 1.4.7 / 1.4.10 | Ler cookie HttpOnly no adapter Express; Express já fornece escrita de cookie |
| `@nestjs/throttler` | 6.7.1 | Limitar tentativas; peers incluem Nest 12 e reflect-metadata instalado |
| `expo-secure-store` | ~57.0.4 | Credencial nativa; versão declarada pelo bundledNativeModules do Expo 57 |
| `jest-expo`, `jest`, `@types/jest` | ~57.0.5, ^29.7.0, ^29.5.14 | Testes do frontend; preset do SDK 57 ainda usa Jest 29, independentemente do Jest 30 do backend |
| `@react-native/jest-preset` | 0.86.3 | Peer do jest-expo 57 e compatível com React 19.2.3 |
| `@testing-library/react-native`, `react-test-renderer` | 13.3.3, 19.2.3 | Router testing-library no SDK 57 exige Testing Library 13; renderer é peer exigido por essa versão e deve acompanhar exatamente o React |

Não instalar react-server-dom-webpack, peer opcional usado para RSC, pois o app não usa RSC. Não adicionar biblioteca JWT. Preservar versões principais existentes e atualizar lockfiles somente para as dependências justificadas.

## Testes e critérios de aceite

Testes unitários: bcrypt real (hash diferente da senha, salt distinto, custo 12, verificação incorreta, limite UTF-8); DTOs; normalização/duplicidade inclusive corrida unique; token imprevisível/hash/expiração/revogação; seleção pública de usuário; conversor legado com dry-run/recusa/CAS.

Testes HTTP via Supertest: cadastro válido/duplicado/invalidado; login e-mail/username; resposta genérica; cookie/bearer; me; logout repetido; token ausente/malformado/expirado/revogado; autorização de dois usuários em TODOS os endpoints de jogos; rejeição de identidade no body; isolamento em consultas; CSRF/CORS/cookies/rate limit. Testes com doubles de persistência devem ser identificados como integração HTTP, sem alegar validação de PostgreSQL.

Testes frontend fora de `src/app`: formulários e feedback, restauração nativa/Web, falha ao armazenar token, 401 versus rede/403, logout com falha, deep link/retorno malicioso, dados/credenciais que não vazam entre contas, resposta tardia, operações reais da biblioteca e capas locais isoladas. Doubles de rede/armazenamento são somente infraestrutura de testes; produção sempre usa API real.

Verificar schema/migrations/credenciais e persistência com PostgreSQL local descartável em teste separado, guardado por URL explícita loopback e nome de banco de teste. Nunca usar DATABASE_URL de produção como fallback nem executar e2e original com conexão compartilhada. Docker está instalado, mas o daemon não estava rodando na inspeção. Se o ambiente local não puder executar PostgreSQL ou testes de dispositivo, reportar precisamente a limitação, sem alegar que passaram.

Concluir somente com saída dos comandos executados: testes backend/HTTP, testes frontend, testes PostgreSQL quando disponíveis, typechecks, build backend, validação/geração Prisma e revisão de diff. Registrar a falha esperada antes de cada comportamento e os resultados finais. Não rodar deploy, migrate reset, db push, seed nem backfill contra o Neon.

## Referências primárias consultadas

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) e [Router SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/router/).
- [SecureStore SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/securestore/): consultado por HTTP direto após falha do leitor web, versão recomendada ~57.0.4 confirmada.
- [Autenticação com Router](https://docs.expo.dev/router/advanced/authentication/) e [testes Router, incluindo ressalva SDK 57/Testing Library 13](https://docs.expo.dev/router/reference/testing/).
- [Jest/Expo](https://docs.expo.dev/develop/unit-testing/), com atenção à distinção entre SDK 57 e SDK 58.
- [bcrypt oficial](https://github.com/kelektiv/node.bcrypt.js), [orientações OWASP de armazenamento](https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/Password_Storage_Cheat_Sheet.md).
- [CSRF nativo Nest 12.1](https://docs.nestjs.com/security/csrf) e declarações instaladas de `INestApplication.enableCsrfProtection`.
- [Relações Prisma 7](https://docs.prisma.io/docs/orm/v7/prisma-schema/data-model/relations/one-to-many-relations) e [migrations de desenvolvimento/produção](https://docs.prisma.io/docs/orm/v7/prisma-migrate/workflows/development-and-production).

Context7 MCP não está disponível nesta sessão; foram usadas documentação oficial, metadados npm oficiais e código/tipos locais instalados.
