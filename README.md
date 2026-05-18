# Gestor de Dados

Ecossistema SaaS estatico com API Vercel para tracking, Pixel Universal, painel de funis, perfil avancado, notificacoes e AI Studio em modo assistido.

## Fluxos principais

- `login.html`, `cadastro.html` e `recuperar-senha.html` oferecem autenticacao com validacao em tempo real.
- Sem Supabase configurado, o app usa modo local/demo com o usuario `admin@gestor.com` e senha `Admin123!`.
- Com Supabase configurado, `services/auth.js` fica pronto para usar Supabase Auth quando o client estiver disponivel.
- O dashboard usa dados reais do Supabase quando `SUPABASE_URL` e `SUPABASE_ANON_KEY` forem salvos em Configuracoes; caso contrario usa `localStorage`.
- O Pixel Universal envia eventos para `/api/track`, que grava via `SUPABASE_SERVICE_ROLE_KEY` nas variaveis da Vercel.

## Variaveis da Vercel

Configure no projeto `gestordedados`:

```bash
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

## Banco de dados

Execute `supabase-schema.sql` no Supabase para criar:

- funis, eventos, leads e respostas;
- perfis, sessoes conectadas e preferencias de notificacao;
- fila de solicitacoes do AI Studio.

## Desenvolvimento local

```bash
npm install
npm test
python3 -m http.server 3000
```

Abra `http://localhost:3000/login.html`.

## Deploy

O projeto esta ligado ao Vercel pelo GitHub `thsuporte2005-sys/Gestordedados`, branch `main`. Todo push na branch dispara um novo deploy do projeto Vercel `gestordedados`.
