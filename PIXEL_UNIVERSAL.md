# Gerenciador de Pixel Universal

Esta implementacao transforma a area "Integracao Universal" em um gerenciador de Pixels individuais por quiz. O sistema nao usa mais um Pixel global: cada quiz recebe `pixel_id`, `public_key`, URL, dominio autorizado, status, heartbeat e metricas proprias.

## Arquivos

- `pixel-integration.js`: interface "Pixels dos Quizzes", criacao ilimitada, tabela, painel do quiz selecionado, codigo de instalacao, teste, diagnostico, edicao, exclusao e status fixo no canto direito.
- `pixel.js`: script unico instalado no quiz. Ele identifica o quiz pelo `data-funnel-id`/Pixel ID, envia `page_view`, `pixel_heartbeat`, cliques, respostas, leads, checkouts e conclusao do quiz, com fila offline em `localStorage`.
- `api/track.js`: endpoint rapido para ingestao de eventos. Responde `200 OK` antes de persistir no Supabase para reduzir timeouts.
- `api/pixel/*.js`: rotas de listagem, status, teste, criacao, atualizacao e exclusao de Pixels individuais.
- `lib/pixel-store.js`: validacao de chave, CORS, status por heartbeat, dominio autorizado, deduplicacao, persistencia e diagnosticos.
- `supabase-schema.sql` e `supabase-migration-vercel.sql`: tabelas `quiz_pixels`, `pixel_events` e `pixel_diagnostics`.

## Variaveis de ambiente

Configure na Vercel:

```bash
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
PIXEL_ALLOWED_ORIGINS=* # desenvolvimento; em producao use dominios separados por virgula
PIXEL_STORE_HEARTBEATS=0
```

`PIXEL_STORE_HEARTBEATS=0` mantem o banco leve: heartbeats atualizam `quiz_pixels.last_heartbeat_at`, mas nao entram em `pixel_events`. Use `1` se quiser auditar todos os heartbeats.

## Rotas

- `POST /api/track`: recebe eventos do `pixel.js`.
- `GET /api/pixel/status?pixel_id=...&public_key=...`: retorna status, metricas e diagnostico do Pixel selecionado.
- `POST /api/pixel/test`: cria um evento `integration_test` para o Pixel selecionado.
- `POST /api/pixel/create`: cria um novo Pixel individual para um quiz.
- `PATCH /api/pixel/update`: atualiza nome, URL, dominio ou gera nova chave.
- `DELETE /api/pixel/delete`: remove um Pixel individual.
- `GET /api/pixel/list`: lista todos os Pixels/quizzes integrados.

## Codigo de instalacao

Cada quiz deve usar seu proprio codigo:

```html
<script 
  async
  src="https://meudominio.com/pixel.js"
  data-funnel-id="PIXEL_ID_AQUI"
  data-public-key="CHAVE_PUBLICA_AQUI"
  data-endpoint="https://meudominio.com/api/track"
  data-heartbeat-interval="30000">
</script>
```

## Status

- `Pixel conectado`: heartbeat recebido ha ate 60 segundos.
- `Instavel`: heartbeat recebido entre 60 e 180 segundos.
- `Pixel offline`: sem heartbeat ha mais de 180 segundos.
- `Aguardando instalacao`: nenhum evento ou heartbeat recebido.
- `Erro de dominio`: evento recebido de dominio diferente do autorizado.

## Eventos automaticos

- `page_view`
- `pixel_heartbeat`
- `button_click`
- `answer_click`
- `form_submit`
- `lead_created`
- `checkout_click`
- `quiz_completed`
- `integration_test`

## Supabase

Execute `supabase-migration-vercel.sql` no SQL Editor do Supabase para criar/ajustar as tabelas. As rotas server-side usam `SUPABASE_SERVICE_ROLE_KEY`, entao as tabelas podem ficar com RLS habilitado sem expor escrita publica.
