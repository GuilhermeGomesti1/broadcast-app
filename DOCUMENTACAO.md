# Documentação Completa — Projeto Broadcast

## O que é o projeto?

O **Broadcast** é um sistema **SaaS** (Software as a Service) de disparo de mensagens. Cada usuário tem sua própria área isolada, onde pode criar **conexões** (canais de envio), **contatos** (destinatários) e **mensagens agendadas**. As mensagens mudam automaticamente de "agendada" para "enviada" no horário programado, via uma função serverless na nuvem.

---

## Tecnologias utilizadas

| Tecnologia | Para que serve no projeto |
|---|---|
| **React 18** | Biblioteca para construir a interface do usuário com componentes |
| **TypeScript** | Adiciona tipagem estática ao JavaScript, evitando erros em tempo de desenvolvimento |
| **Vite** | Ferramenta de build moderna e rápida (substitui o Create React App) |
| **Firebase Auth** | Autenticação de usuários com e-mail e senha |
| **Cloud Firestore** | Banco de dados NoSQL em tempo real da Google |
| **Firebase Functions** | Funções serverless executadas na nuvem (backend sem servidor) |
| **Firebase Hosting** | Hospedagem do frontend na CDN da Google |
| **Material UI (MUI) v5** | Biblioteca de componentes visuais prontos (botões, modais, tabelas, etc.) |
| **TailwindCSS** | Framework de estilização com classes utilitárias |
| **React Router v6** | Controla a navegação entre páginas dentro do app |
| **React Hook Form** | Gerenciamento de formulários de forma eficiente |
| **Zod** | Validação de dados dos formulários com esquemas tipados |
| **Day.js** | Manipulação e formatação de datas (agendamento de mensagens) |

---

## Estrutura de pastas

```
teste/
├── firebase.json           → Configuração geral do Firebase (hosting, functions, firestore)
├── firestore.rules         → Regras de segurança do banco de dados
├── firestore.indexes.json  → Índices para queries compostas no Firestore
├── .firebaserc             → ID do projeto Firebase vinculado
│
├── functions/              → Backend (Cloud Functions)
│   ├── src/
│   │   └── index.ts        → Função agendada que processa mensagens
│   ├── package.json
│   └── tsconfig.json
│
└── web/                    → Frontend (React)
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── .env                → Chaves secretas do Firebase (não vai para o Git)
    └── src/
        ├── main.tsx        → Ponto de entrada da aplicação
        ├── App.tsx         → Raiz do app: tema, rotas e providers
        ├── index.css       → CSS global + diretivas do Tailwind
        │
        ├── types/
        │   └── index.ts    → Interfaces TypeScript (Connection, Contact, Message)
        │
        ├── lib/
        │   └── firebase.ts → Inicialização do Firebase (auth + firestore)
        │
        ├── services/       → Funções que falam diretamente com o Firebase
        │   ├── auth.ts
        │   ├── connections.ts
        │   ├── contacts.ts
        │   └── messages.ts
        │
        ├── hooks/          → Hooks React que encapsulam lógica de estado + tempo real
        │   ├── useAuth.ts
        │   ├── useConnections.ts
        │   ├── useContacts.ts
        │   └── useMessages.ts
        │
        ├── contexts/
        │   └── AuthContext.tsx → Context API para compartilhar o usuário logado
        │
        ├── components/     → Componentes reutilizáveis
        │   ├── AppLayout.tsx
        │   ├── PrivateRoute.tsx
        │   └── ConfirmDialog.tsx
        │
        └── pages/          → Páginas da aplicação
            ├── LoginPage.tsx
            ├── ConnectionsPage.tsx
            ├── ContactsPage.tsx
            └── MessagesPage.tsx
```

---

## Modelo de dados no Firestore

O Firestore é um banco de dados **NoSQL orientado a documentos**. Os dados ficam em **coleções** (como tabelas), e cada item é um **documento** (como uma linha). O projeto usa **3 coleções flat** (sem subcoleções), cada uma com o campo `userId` para garantir isolamento entre usuários.

### Coleção: `connections`
```
{
  id: string          → ID gerado automaticamente pelo Firestore
  userId: string      → ID do usuário dono desta conexão
  name: string        → Nome da conexão (ex: "WhatsApp Principal")
  createdAt: number   → Timestamp em milissegundos (Date.now())
}
```

### Coleção: `contacts`
```
{
  id: string          → ID gerado automaticamente
  userId: string      → ID do usuário dono
  connectionId: string → A qual conexão este contato pertence
  name: string        → Nome do contato
  phone: string       → Telefone do contato
  createdAt: number   → Timestamp de criação
}
```

### Coleção: `messages`
```
{
  id: string          → ID gerado automaticamente
  userId: string      → ID do usuário dono
  connectionId: string → A qual conexão pertence
  contactIds: string[] → Lista de IDs dos contatos destinatários
  content: string     → Texto da mensagem
  status: 'scheduled' | 'sent'  → Estado atual da mensagem
  scheduledAt: number → Timestamp do momento agendado para disparo
  sentAt: number | null → Timestamp de quando foi marcada como enviada (null enquanto agendada)
  createdAt: number   → Timestamp de criação
}
```

### Por que não usar subcoleções?
O projeto **evita subcoleções** por requisito — isso simplifica as regras de segurança e permite queries cruzadas mais flexíveis. O isolamento por usuário é feito via campo `userId` em todos os documentos, e as queries sempre filtram por ele.

---

## Arquivo por arquivo

---

### `web/src/types/index.ts`
**O que faz:** Define os contratos de dados do projeto usando **interfaces TypeScript**. Todo o código usa esses tipos para garantir que os dados têm a forma correta.

- `Connection` — formato de uma conexão
- `Contact` — formato de um contato
- `MessageStatus` — tipo literal que só aceita os valores `'scheduled'` ou `'sent'`
- `Message` — formato de uma mensagem, incluindo o array `contactIds` (uma mensagem pode ser enviada para vários contatos)

**Por que TypeScript?** Se você tentar acessar uma propriedade que não existe, ou passar o tipo errado, o editor já avisa antes de rodar o código.

---

### `web/src/lib/firebase.ts`
**O que faz:** Inicializa a conexão com o Firebase e exporta as instâncias de `auth` e `db` para o resto da aplicação usar.

```ts
const app = initializeApp(firebaseConfig) // conecta ao projeto Firebase
export const auth = getAuth(app)          // instância de autenticação
export const db = getFirestore(app)       // instância do banco de dados
```

As chaves de configuração (`apiKey`, `projectId`, etc.) vêm do arquivo `.env`, lido pelo Vite via `import.meta.env.VITE_*`. Isso evita expor as chaves diretamente no código fonte.

---

### `web/src/services/auth.ts`
**O que faz:** Encapsula as três operações de autenticação do Firebase Auth.

- `register(email, password)` — cria uma nova conta usando `createUserWithEmailAndPassword`. Retorna uma Promise com o usuário criado.
- `login(email, password)` — autentica um usuário existente usando `signInWithEmailAndPassword`. Retorna uma Promise.
- `logout()` — encerra a sessão do usuário com `signOut`.

**Por que separar em services?** Para não misturar lógica de negócio com componentes visuais. Se o Firebase mudar amanhã, você altera só este arquivo.

---

### `web/src/services/connections.ts`
**O que faz:** Todas as operações de banco de dados relacionadas a conexões.

- `subscribeConnections(userId, callback)` — cria uma **assinatura em tempo real** no Firestore. Sempre que um documento da coleção `connections` do usuário for criado, editado ou deletado, o `callback` é chamado automaticamente com a lista atualizada. Usa `onSnapshot` do Firestore, que mantém uma conexão aberta (WebSocket). Retorna uma função de cancelamento (`unsub`).
  - A query filtra por `userId` e ordena por `createdAt` decrescente (mais recentes primeiro).
- `createConnection(userId, name)` — cria um novo documento com `addDoc`. O Firestore gera o ID automaticamente.
- `updateConnection(id, name)` — atualiza apenas o campo `name` de um documento existente com `updateDoc`.
- `deleteConnection(id)` — remove um documento com `deleteDoc`.

---

### `web/src/services/contacts.ts`
**O que faz:** Mesma estrutura que `connections.ts`, mas para a coleção `contacts`.

- `subscribeContacts(userId, connectionId, callback)` — filtra por `userId` E por `connectionId`, garantindo que só vêm os contatos da conexão correta do usuário correto.
- `createContact(userId, connectionId, name, phone)` — cria o contato já vinculado à conexão.
- `updateContact(id, name, phone)` — atualiza nome e telefone.
- `deleteContact(id)` — remove o contato.

---

### `web/src/services/messages.ts`
**O que faz:** Operações de banco de dados para mensagens. É o service mais complexo.

- `subscribeMessages(userId, connectionId, statusFilter, callback)` — monta a query dinamicamente. Se `statusFilter` for `'all'`, usa apenas `userId` + `connectionId` + `orderBy`. Se for `'scheduled'` ou `'sent'`, adiciona um `where('status', '==', statusFilter)` no meio da lista de constraints, antes do `orderBy` (o Firestore exige que filters venham antes do orderBy quando há índice composto). Usa `constraints.splice(2, 0, ...)` para inserir na posição correta.
- `createMessage(...)` — cria a mensagem sempre com `status: 'scheduled'` e `sentAt: null`. O `scheduledAt` é o timestamp do momento escolhido pelo usuário.
- `updateMessage(id, data)` — aceita um objeto parcial para atualizar apenas os campos desejados (conteúdo, contatos ou data).
- `deleteMessage(id)` — remove a mensagem.

---

### `web/src/hooks/useAuth.ts`
**O que faz:** Hook que observa o estado de autenticação do Firebase em tempo real.

```ts
onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false) })
```

O `onAuthStateChanged` é um listener que o Firebase dispara sempre que o estado muda: quando o usuário faz login, logout, ou quando a página recarrega e o Firebase restaura a sessão salva. O hook retorna `{ user, loading }`, onde `loading` começa como `true` e vai para `false` assim que o Firebase responde — isso evita piscar a tela de login antes de saber se o usuário está logado.

**O `return unsub`** dentro do `useEffect` é a função de limpeza — cancela o listener quando o componente é desmontado, evitando vazamento de memória.

---

### `web/src/hooks/useConnections.ts`
**O que faz:** Hook que encapsula o `subscribeConnections` e gerencia o estado local.

- Recebe `userId` como parâmetro.
- Se `userId` for `undefined` (usuário não logado), limpa os dados e para.
- Quando `userId` muda, cancela a assinatura anterior e cria uma nova (o array `[userId]` no `useEffect` controla isso).
- Retorna `{ connections, loading }` para o componente usar.

---

### `web/src/hooks/useContacts.ts`
**O que faz:** Mesmo padrão do `useConnections`, mas depende de `userId` **e** `connectionId`. Só cria a assinatura quando ambos existem. Quando o usuário troca de conexão (muda o `connectionId` na URL), o hook cancela a assinatura antiga e assina os dados da nova conexão automaticamente.

---

### `web/src/hooks/useMessages.ts`
**O que faz:** Hook para mensagens. Depende de `userId`, `connectionId` e `statusFilter`. Quando qualquer um dos três muda, o `useEffect` roda de novo — isso faz com que trocar a aba de filtro (Todas / Agendadas / Enviadas) recrie a query com o filtro correto automaticamente.

---

### `web/src/contexts/AuthContext.tsx`
**O que faz:** Implementa o **Context API** do React para compartilhar o usuário logado com qualquer componente da árvore, sem precisar passar props manualmente.

- `AuthContext` — o contexto em si, criado com `createContext`.
- `AuthProvider` — componente que envolve a aplicação e disponibiliza os dados do `useAuth` para todos os filhos via `<AuthContext.Provider value={auth}>`.
- `useAuthContext()` — hook de atalho que qualquer componente pode chamar para acessar `{ user, loading }`.

**Analogia:** funciona como uma variável global, mas de forma controlada e reativa.

---

### `web/src/components/PrivateRoute.tsx`
**O que faz:** Componente de proteção de rotas.

- Enquanto o Firebase ainda está verificando a sessão (`loading === true`), mostra um spinner.
- Se o usuário **está logado** (`user !== null`), renderiza o conteúdo da rota normalmente.
- Se o usuário **não está logado**, redireciona para `/login` usando `<Navigate to="/login" replace />`. O `replace` substitui a entrada no histórico do navegador em vez de empilhar, para que o botão "voltar" não leve de volta à rota protegida.

---

### `web/src/components/AppLayout.tsx`
**O que faz:** Layout padrão de todas as telas autenticadas — barra superior (AppBar) + menu lateral (Drawer) + área de conteúdo.

**Responsividade:**
- Detecta se é mobile com `useMediaQuery(theme.breakpoints.down('md'))`.
- No **mobile**: o Drawer é `variant="temporary"` — aparece como overlay por cima do conteúdo, fecha ao clicar fora.
- No **desktop**: o Drawer é `variant="permanent"` — fica fixo ao lado. Pode ser escondido com `translateX` via o botão de menu.

**Outras funções:**
- `handleLogout()` — chama `logout()` do service e navega para `/login`.
- O `drawerContent` é compartilhado entre os dois modos (mobile/desktop).
- Um `<Toolbar variant="dense" />` invisível no topo do conteúdo principal serve de espaçador, garantindo que o conteúdo sempre começa abaixo do AppBar fixo.
- O item de menu usa `location.pathname.startsWith('/connections')` para ficar marcado como ativo em qualquer subrota de conexões.

---

### `web/src/components/ConfirmDialog.tsx`
**O que faz:** Modal de confirmação reutilizável para exclusões. Recebe via props:
- `open` — se o modal está visível.
- `title` — título do modal.
- `description` — texto explicativo.
- `onConfirm` — função chamada ao confirmar.
- `onCancel` — função chamada ao cancelar ou fechar.

É usado em todas as páginas para confirmar deleções de conexões, contatos e mensagens.

---

### `web/src/App.tsx`
**O que faz:** Componente raiz da aplicação. Configura três camadas:

1. **`ThemeProvider`** — aplica o tema customizado do MUI com a cor primária azul (`#1d4ed8`).
2. **`CssBaseline`** — reset de CSS do MUI (garante consistência entre navegadores).
3. **`AuthProvider`** — disponibiliza o usuário logado para toda a árvore.
4. **`BrowserRouter` + `Routes`** — define as rotas da aplicação:
   - `/login` → `LoginPage` (pública)
   - `/connections` → `ConnectionsPage` (protegida)
   - `/connections/:connectionId/contacts` → `ContactsPage` (protegida)
   - `/connections/:connectionId/messages` → `MessagesPage` (protegida)
   - Qualquer rota desconhecida → redireciona para `/connections`

As rotas protegidas são envoltas em `<PrivateRoute>` e `<AppLayout>`.

---

### `web/src/pages/LoginPage.tsx`
**O que faz:** Tela de login e cadastro com duas abas.

- **`useForm` + `zodResolver`** — conecta o formulário com o esquema de validação Zod. O campo `email` só aceita e-mails válidos, e `password` exige mínimo de 6 caracteres. Os erros aparecem embaixo dos campos automaticamente.
- **`tab`** — estado que controla se está na aba "Entrar" (0) ou "Cadastrar" (1).
- **`showPassword`** — estado que alterna visibilidade da senha.
- **`onSubmit(data)`** — chamada pelo React Hook Form após validação. Chama `login()` ou `register()` dependendo da aba ativa. Em caso de erro do Firebase, converte os códigos de erro em mensagens amigáveis em português.
- Após sucesso, navega para `/connections`.

---

### `web/src/pages/ConnectionsPage.tsx`
**O que faz:** Tela principal de gerenciamento de conexões (CRUD completo).

**Estado local:**
- `dialogOpen` — controla se o modal de criar/editar está aberto.
- `editing` — guarda a conexão que está sendo editada (ou `null` se for criação).
- `name` / `nameError` — valor e erro do campo de nome.
- `saving` — desabilita o botão enquanto aguarda o Firestore.
- `deleteTarget` — conexão marcada para exclusão (abre o ConfirmDialog).

**Funções:**
- `openCreate()` — limpa o estado e abre o modal no modo criação.
- `openEdit(e, conn)` — chama `e.stopPropagation()` para não propagar o clique, preenche o formulário com os dados da conexão e abre o modal no modo edição.
- `handleSave()` — decide se chama `createConnection` ou `updateConnection` com base em `editing`.
- `handleDelete()` — chama `deleteConnection` e fecha o ConfirmDialog.

Os dados vêm do hook `useConnections(user?.uid)` que é atualizado em tempo real pelo Firestore.

---

### `web/src/pages/ContactsPage.tsx`
**O que faz:** Tela de contatos de uma conexão específica (CRUD completo).

- O `connectionId` vem da URL via `useParams<{ connectionId: string }>()`.
- Usa `useContacts(user?.uid, connectionId)` para obter os contatos em tempo real.
- Usa `useConnections` apenas para exibir o nome da conexão no cabeçalho.
- O formulário usa `react-hook-form` com validação Zod diretamente.
- O `reset({ name, phone })` preenche o formulário ao editar um contato existente.
- O form tem `id="contact-form"` para que o botão Salvar fora do `<form>` (dentro do `DialogActions`) possa submeter via `form="contact-form"`.

---

### `web/src/pages/MessagesPage.tsx`
**O que faz:** Tela mais complexa — listagem, criação, edição e exclusão de mensagens com agendamento.

**Filtro de status:**
- O estado `statusFilter` (`'all'`, `'scheduled'` ou `'sent'`) é passado direto para o hook `useMessages`, que cria uma query diferente no Firestore para cada valor.

**Seleção de contatos:**
- `selectedContactIds` — array de IDs dos contatos marcados com checkbox.
- `toggleContact(id)` — adiciona o ID se não está na lista, ou remove se já está.

**Agendamento:**
- Usa `DateTimePicker` do `@mui/x-date-pickers` com `AdapterDayjs` para selecionar data e hora.
- `scheduledAt` é armazenado como número (timestamp em milissegundos) no Firestore.
- Mensagens agendadas no passado são rejeitadas pela validação (`scheduledAt.isBefore(dayjs())`).

**`handleSave()`** — valida os três campos (conteúdo, contatos e data) antes de salvar. Se algum falhar, seta o erro correspondente e retorna sem salvar.

**Mensagens enviadas** não podem ser editadas — o botão de editar não aparece para elas (`msg.status === 'scheduled'`).

---

### `functions/src/index.ts`
**O que faz:** Única Cloud Function do projeto — responsável por processar mensagens agendadas automaticamente.

```ts
export const processScheduledMessages = onSchedule(
  { schedule: 'every 1 minutes', timeZone: 'America/Sao_Paulo' },
  async () => { ... }
)
```

- É uma **Scheduled Function** (função agendada), que o Firebase executa automaticamente a cada 1 minuto.
- Busca todos os documentos da coleção `messages` onde `status === 'scheduled'` E `scheduledAt <= agora`.
- Usa **batch write** (`db.batch()`) para atualizar todos os documentos encontrados de uma só vez — mais eficiente do que fazer um `update` por documento individualmente.
- Atualiza `status` para `'sent'` e define `sentAt` com o timestamp atual.
- Como o Firestore do frontend está ouvindo em tempo real com `onSnapshot`, a mudança aparece automaticamente na tela do usuário sem refresh.

**Por que usar `firebase-admin`?** As Cloud Functions rodam no servidor e têm acesso privilegiado ao Firestore, sem passar pelas regras de segurança. O `firebase-admin` é o SDK para esse ambiente.

---

### `firestore.rules`
**O que faz:** Define as regras de segurança do Firestore. Garante o isolamento entre usuários (SAAS).

```
allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
```

- `request.auth != null` — exige que o usuário esteja autenticado.
- `request.auth.uid == resource.data.userId` — para leitura/escrita: o `userId` do documento precisa ser igual ao UID do usuário que está fazendo a requisição.
- `request.resource.data.userId` — para criação: verifica o dado que **vai ser salvo** (ainda não existe no banco), garantindo que ninguém crie um documento com o `userId` de outra pessoa.

Isso significa que mesmo que alguém descubra o ID de um documento, não consegue ler ou alterar se não for o dono.

---

### `firestore.indexes.json`
**O que faz:** Define índices compostos no Firestore.

O Firestore exige índices compostos quando uma query tem `where` em mais de um campo, ou tem `where` + `orderBy` em campos diferentes. Sem o índice, a query falha com erro `failed-precondition`.

O projeto tem índices para:
- `connections`: `userId` + `createdAt`
- `contacts`: `userId` + `connectionId` + `createdAt`
- `messages`: `userId` + `connectionId` + `createdAt`
- `messages` com filtro de status: `userId` + `connectionId` + `status` + `createdAt`
- `messages` para a Function: `status` + `scheduledAt`

---

### `firebase.json`
**O que faz:** Arquivo de configuração central do Firebase CLI.

- `hosting.public: "web/dist"` — a pasta que será publicada no Firebase Hosting (resultado do `npm run build`).
- `hosting.rewrites` — redireciona todas as rotas para `index.html`, necessário para o React Router funcionar em produção (SPA — Single Page Application).
- `functions.source: "functions"` — onde está o código das Cloud Functions.
- `functions.runtime: "nodejs20"` — versão do Node.js no servidor.

---

### `web/vite.config.ts`
**O que faz:** Configuração mínima do Vite. Registra o plugin `@vitejs/plugin-react` que habilita o suporte a JSX/TSX e o Fast Refresh (atualização do browser sem perder o estado durante o desenvolvimento).

---

### `web/tailwind.config.js`
**O que faz:** Configuração do TailwindCSS.

- `content` — lista de arquivos onde o Tailwind vai procurar classes para incluir no CSS final (tree-shaking automático).
- `important: '#root'` — garante que as classes do Tailwind têm prioridade sobre os estilos do MUI.
- `corePlugins.preflight: false` — desativa o reset CSS do Tailwind para não conflitar com o `CssBaseline` do MUI.

---

## Conceitos importantes para a entrevista

### Paradigma funcional
O projeto não usa classes em nenhum lugar. Toda a lógica é feita com **funções puras**, **arrow functions** e **hooks** do React. Isso segue o paradigma funcional exigido pelo projeto.

### Tempo real com Firestore
O `onSnapshot` mantém uma **conexão persistente** (via WebSocket) com o Firestore. Quando qualquer dado muda no banco, o Firestore notifica o app instantaneamente — sem polling (sem ficar consultando a cada X segundos).

### SAAS e isolamento de dados
O isolamento é feito em **duas camadas**:
1. **Código**: todas as queries filtram por `userId` do usuário logado.
2. **Banco de dados**: as `firestore.rules` bloqueiam qualquer acesso a documentos onde o `userId` não bate com o usuário autenticado — mesmo que o código seja manipulado no browser.

### SPA (Single Page Application)
O React carrega um único `index.html` e o React Router simula a navegação entre páginas sem recarregar o browser. Por isso o `firebase.json` redireciona todas as rotas para `index.html`.

### Deploy
- `firebase deploy --only firestore:rules,firestore:indexes` — publica as regras e índices do banco.
- `npm run build` — compila o TypeScript e gera os arquivos estáticos em `web/dist`.
- `firebase deploy --only hosting` — publica o `web/dist` no Firebase Hosting (CDN global).
- `firebase deploy --only functions` — publica as Cloud Functions no servidor da Google.
