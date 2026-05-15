# Broadcast

Sistema SaaS de disparo de mensagens agendadas, desenvolvido como projeto prático.

## Acesso

**[https://broadcast-d80f6.web.app](https://broadcast-d80f6.web.app)**

## Tecnologias

- React 18 + TypeScript + Vite
- Firebase Auth, Firestore e Cloud Functions
- Material UI + TailwindCSS
- React Router, React Hook Form, Zod, Day.js

## Funcionalidades

- Login e cadastro com e-mail e senha
- CRUD de conexões
- CRUD de contatos por conexão
- Envio e agendamento de mensagens (fake)
- Filtro de mensagens por status (agendadas / enviadas)
- Atualização automática de status via Cloud Function agendada
- Dados em tempo real com Firestore (`onSnapshot`)
- Isolamento total entre usuários (SAAS)

## Estrutura

```
├── functions/        # Cloud Functions (Node.js + TypeScript)
└── web/              # Frontend (React + TypeScript + Vite)
    └── src/
        ├── components/
        ├── contexts/
        ├── hooks/
        ├── lib/
        ├── pages/
        ├── services/
        └── types/
```

## Configuração local

**1. Instale as dependências:**
```bash
cd web && npm install
cd ../functions && npm install
```

**2. Crie o arquivo `web/.env` com as chaves do Firebase:**
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

**3. Rode o projeto:**
```bash
cd web && npm run dev
```

## Deploy

```bash
cd web && npm run build && cd ..
firebase deploy --only hosting
```
