#  Game List

Aplicativo mobile para organizar uma biblioteca pessoal de jogos e acompanhar o andamento de cada título.

##  Sobre o projeto

O Game List é um projeto acadêmico voltado a jogadores que utilizam uma ou mais plataformas. Ele busca resolver a dificuldade de organizar jogos distribuídos entre diferentes plataformas e identificar quais títulos estão em andamento, concluídos ou na lista para jogar.

Esta primeira entrega concentra-se na interface e na navegação. O aplicativo utiliza dados de exemplo e mantém as alterações dos jogos apenas em memória, durante a execução. Os formulários de cadastro e login simulam o fluxo de acesso, sem criar contas ou autenticar usuários em um servidor.

##  Objetivo

Reunir a biblioteca pessoal de jogos em uma interface simples, permitindo consultar títulos, organizar seu status e acompanhar informações de progresso.

##  Funcionalidades

- Preencher formulários de cadastro e login com validações locais e navegação entre telas.
- Visualizar o início com jogos, estatísticas e informações demonstrativas de progresso e conquistas.
- Consultar a biblioteca na tela **Meus jogos** e abrir os detalhes de um título.
- Adicionar e editar jogos, informando nome, plataforma, gênero, status e capa.
- Alterar o status, marcar favoritos e atribuir uma avaliação nos detalhes do jogo.

Os status disponíveis são **Quero jogar**, **Jogando**, **Pausado** e **Concluído**, além da opção **Sem status**. O status **Abandonado** faz parte do planejamento, mas ainda não está implementado.

Descobrir jogos, visualizar o perfil e acessar configurações também permanecem planejados. Não há integração com API externa, banco de dados ou persistência da biblioteca entre execuções.

##  Telas

As 6 telas previstas para a primeira entrega estão relacionadas abaixo, com seu estado atual:

| Tela prevista | Estado no projeto |
| --- | --- |
| Boas-vindas | Implementada em `src/app/index.tsx`, usando `WelcomeScreen`. |
| Entrar (Login) | Formulário e navegação em `src/app/(auth)/login.tsx`; acesso simulado. |
| Criar Conta | Formulário e validações em `src/app/(auth)/register.tsx`; cadastro simulado. |
| Início | Implementada em `src/app/(tabs)/home.tsx`. |
| Adicionar Jogo | Implementada em `src/app/game/add.tsx`, também utilizada para editar. |
| Detalhes do Jogo | Implementada em `src/app/game/[id].tsx`. |

## 🎨 Interface

As telas implementadas adotam um visual escuro (dark mode), com tons de preto e azul escuro e azul como cor de destaque. Cards, capas de jogos, ícones e cantos arredondados compõem uma interface moderna e minimalista. O tema escuro é definido na própria interface, sem seletor de tema implementado.

Confira o design do Game List no [Figma](https://www.figma.com/design/XMQHI5KcPJlubiR7JIaJWS/Game-List-FIGMA?node-id=0-1&t=ki90OBrhoyWO1mQp-1).

##  Tecnologias

- **React Native 0.86 e React 19.2** — construção da interface.
- **Expo SDK 57** — ferramentas e módulos para execução do aplicativo.
- **TypeScript** — tipagem do código.
- **Expo Router** — navegação baseada em arquivos.
- **NativeWind 4 e Tailwind CSS 3** — estilização dos componentes.
- **React Context e hooks** — gerenciamento dos jogos em memória.
- **Expo Image, Linear Gradient, Vector Icons e React Native SVG** — imagens e elementos visuais.
- **Expo Image Picker e Document Picker** — seleção de capas locais.
- **React Native Safe Area Context** — adaptação às áreas seguras da tela.
- **React Native Web** — suporte à execução no navegador.


##  Como executar

Pré-requisitos: Git, npm e Node.js 22.13 ou superior, conforme a [documentação do Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).

```bash
# 1. Clonar o repositório
git clone https://github.com/Demicouto/GameList.git

# 2. Entrar na pasta
cd GameList

# 3. Instalar as dependências do arquivo de lock
npm ci

# 4. Iniciar o projeto
npm start
```

Com o servidor iniciado, utilize um dispositivo com Expo Go compatível com o SDK 57 ou um emulador configurado. Os scripts disponíveis também permitem iniciar diretamente para cada plataforma:

```bash
npm run android
npm run ios
npm run web
```

O simulador iOS requer macOS e Xcode; para Android, é necessário um emulador ou dispositivo configurado. A opção web abre o aplicativo no navegador.

Para verificar a tipagem do projeto:

```bash
npm run typecheck
```

##  Casos de uso

O escopo da primeira entrega contempla:

1. Boas-vindas.
2. Cadastrar-se — fluxo simulado.
3. Realizar Login — fluxo simulado.
4. Visualizar Início.
5. Adicionar Jogo.
6. Visualizar Detalhes do Jogo.
7. Editar Jogo.


O [diagrama de casos de uso em PlantUML](docs/casosdeuso.puml) representa esse escopo, incluindo os itens ainda pendentes.

##  Desenvolvedores

- Demétrio Ribeiro Coutinho da Silva Júnior
- Jucyara Ferreira de Santana

##  Disciplina

Projeto desenvolvido como atividade acadêmica da disciplina **Programação para Dispositivos Móveis**, referente à primeira entrega.
