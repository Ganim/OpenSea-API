# Module: Tools & Infrastructure

## Overview

Este documento descreve as ferramentas, bibliotecas e configurações de infraestrutura que sustentam o OpenSea-API. Diferentemente dos módulos de domínio, esta documentação cobre as camadas transversais — banco de dados, filas, cache, build, testes, deploy e bibliotecas utilitárias de uso geral.

O stack principal é composto por **Node.js 22**, **TypeScript 5.8**, **Fastify 5**, **Prisma 7**, **BullMQ 5** e **Redis (ioredis 5)**, todos rodando em containers Docker Alpine e implantados na plataforma **Fly.io** com banco de dados gerenciado pela **Neon PostgreSQL**.

---

## 1. Prisma ORM

### Localização e estrutura

| Arquivo / Diretório | Finalidade |
|---|---|
| `prisma/schema.prisma` | Definição de todos os modelos, enums, relações e índices |
| `prisma/migrations/` | Histórico de migrações SQL gerado automaticamente |
| `prisma/seed.ts` | Script de seed: superadmin, planos e tenant demo |
| `prisma/vitest-setup-e2e.ts` | Setup de banco isolado para testes E2E |
| `prisma/generated/prisma/` | Prisma Client gerado — **não editar manualmente** |
| `prisma.config.ts` | Configuração do Prisma CLI (schema path) |

### Client singleton

O client é instanciado em `src/lib/prisma.ts` usando o **driver adapter** `@prisma/adapter-pg` (Prisma v7), que substitui o driver embutido do Prisma por uma conexão `pg` nativa:

```typescript
// src/lib/prisma.ts
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../prisma/generated/prisma/client.js';

const adapter = new PrismaPg(
  { connectionString: databaseUrl },
  schema ? { schema } : undefined,
);

export const prisma = new PrismaClient({ adapter });
```

O parâmetro `?schema=` da `DATABASE_URL` é extraído manualmente porque o `PrismaPg` não o honra automaticamente.

### Path aliases

O `tsconfig.json` declara dois aliases relevantes:

```json
"paths": {
  "@/*": ["./src/*"],
  "@prisma/generated/*": ["./prisma/generated/prisma/*"]
}
```

O alias `@prisma/generated/` permite importar tipos do Prisma Client sem caminhos relativos longos.

### Prisma v7 — Client TypeScript

O Prisma v7 gera o client como arquivo `.ts` (não `.js`). No build de produção com `esbuild` (via `tsup`), o plugin `resolve-ts-extensions` mapeia imports `.js` para `.ts` dentro de `prisma/generated/`. O seed de produção (`build/seed.mjs`) é compilado separadamente com `scripts/build-seed.mjs`.

### Workflow de desenvolvimento

```bash
# Iniciar banco local
docker compose up -d

# Criar e aplicar nova migração
npx prisma migrate dev --name <nome-da-migração>

# Regenerar o client após alterações no schema
npx prisma generate

# Abrir interface visual
npx prisma studio

# Reset completo (apaga dados)
npm run prisma:reset

# Seed manual
npm run prisma:seed
```

### Workflow de produção (deploy)

As migrações e o seed rodam automaticamente via `release_command` no `fly.toml` antes da substituição das máquinas:

```bash
# scripts/release.sh
npx prisma migrate deploy
node build/seed.mjs
```

O seed é idempotente: verifica existência antes de inserir superadmin, planos e tenant demo.

### Convenções de nomenclatura

- Campos no banco: `snake_case` com `@map()` → ex: `legal_name @map("legal_name")`
- Campos na entidade TypeScript: `camelCase` → ex: `legalName`
- Exceção: o campo `address` no banco corresponde a `addressLine1` na entidade; `addressLine2` é sempre `null` vindo do banco

---

## 2. Fastify

### Versão e configuração base

Fastify 5.7 é configurado em `src/app.ts` como instância singleton exportada. O `pluginTimeout` varia por ambiente:

| Ambiente | pluginTimeout | Motivo |
|---|---|---|
| `test` / `VITEST` | `0` (infinito) | `vite-node` pode levar 120 s+ para transpilar |
| `production` com Swagger | `300_000` (5 min) | Compilação Zod→JSON-Schema no Windows |
| `dev` sem Swagger | `60_000` (1 min) | Suficiente para plugins padrão |

### Validação com Zod

O pacote `fastify-type-provider-zod` conecta os schemas Zod do domínio ao sistema de validação/serialização nativo do Fastify:

```typescript
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
```

Todos os controllers usam `schema: { body: zodSchema, tags: [...] }` diretamente, sem adaptadores manuais.

### Plugins registrados (ordem importa)

| Ordem | Plugin | Finalidade |
|---|---|---|
| 1 | `@fastify/helmet` | Headers de segurança (HSTS 1 ano, CSP, referrer policy) |
| 2 | `@fastify/cors` | CORS com lista de origens permitidas + `credentials: true` |
| 3 | `@fastify/rate-limit` | Rate limiting global (desabilitado em testes) |
| 4 | `@fastify/swagger` | Documentação OpenAPI 3 (opt-in em dev, sempre em produção) |
| 5 | `@fastify/jwt` | JWT com suporte a RS256 e HS256 |
| 6 | `@fastify/cookie` | Cookies para o refresh token |
| 7 | `@fastify/multipart` | Upload de arquivos (até 25 MB por arquivo, 10 arquivos/req) |
| 8 | `cacheControlPlugin` | Headers `Cache-Control` + `ETag` automáticos |
| 9 | `idempotencyPlugin` | Chave de idempotência para operações POST/PATCH |
| 10 | `prometheusPlugin` | Métricas Prometheus em `/metrics` |
| 11 | `registerRoutes` | Registro de todas as rotas da aplicação |

### Swagger

O Swagger é habilitado apenas quando `NODE_ENV === 'production'` ou `ENABLE_SWAGGER=true` no `.env`. A UI fica disponível em `http://localhost:3333/docs` com o tema **Flattop** da biblioteca `swagger-themes`.

Schemas nomeados para suporte a `$ref` no OpenAPI são registrados via `src/http/schemas/register-named-schemas.ts` antes do plugin Swagger.

### Tratamento de erros globais

O `errorHandler` centralizado em `src/@errors/error-handler.ts` captura todos os erros não tratados. Todos os erros da API incluem `code` (constante semântica de `src/@errors/error-codes.ts`) e `requestId` para rastreamento.

### Graceful shutdown

O `src/server.ts` gerencia o shutdown ordenado ao receber `SIGTERM` ou `SIGINT`:

1. Para schedulers de email
2. Fecha o servidor HTTP (para aceitar novas conexões)
3. Fecha pool de conexões IMAP
4. Fecha filas e workers BullMQ
5. Desconecta Redis
6. Desconecta Prisma

O timeout máximo de shutdown é de **15 segundos**.

---

## 3. BullMQ

### Arquitetura de filas

Todas as filas são gerenciadas pelo módulo singleton `src/lib/queue.ts`, que expõe funções factory (`createQueue`, `createWorker`) com lazy initialization — filas e workers são criados apenas na primeira chamada, evitando conexões Redis desnecessárias em ambiente de teste.

### Filas disponíveis

| Nome da fila (`QUEUE_NAMES`) | Constante | Finalidade |
|---|---|---|
| `notifications` | `NOTIFICATIONS` | Notificações push/in-app |
| `emails` | `EMAILS` | Envio de e-mails via SMTP |
| `email-sync` | `EMAIL_SYNC` | Sincronização de caixas IMAP |
| `audit-logs` | `AUDIT_LOGS` | Gravação assíncrona de logs de auditoria |
| `reports` | `REPORTS` | Geração de relatórios pesados |
| `dead-letter` | `DEAD_LETTER` | Dead Letter Queue (DLQ) |

### Workers

Os workers são definidos em `src/workers/queues/`:

| Arquivo | Worker | Concorrência padrão |
|---|---|---|
| `audit.queue.ts` | `startAuditWorker()` | 5 |
| `email.queue.ts` | — (processamento de envio SMTP) | 5 |
| `email-sync.queue.ts` | `startEmailSyncWorker()` | 5 |
| `notification.queue.ts` | `startNotificationWorker()` | 5 |

Os schedulers periódicos ficam em `src/workers/`:
- `email-sync-scheduler.ts` — agenda sincronizações IMAP recorrentes
- `notifications-scheduler.ts` — agenda notificações programadas
- `calendar-reminders-scheduler.ts` — agenda lembretes de eventos

### Inicialização inline vs. container separado

Em **desenvolvimento**, os workers sobem no mesmo processo que o servidor HTTP (inline), evitando a necessidade de um segundo container. Pode ser desabilitado com `DISABLE_INLINE_WORKERS=true`.

Em **produção no Fly.io**, existe um container separado (`Dockerfile.worker`) que executa `node build/workers/index.js`, garantindo isolamento de recursos:

```dockerfile
CMD ["node", "--stack-size=8192", "build/workers/index.js"]
```

### Configuração de conexão BullMQ

A conexão Redis para o BullMQ **deve** ter `maxRetriesPerRequest: null`, pois BullMQ usa comandos blocking (`BRPOPLPUSH`) incompatíveis com retry automático do ioredis:

```typescript
const getConnection = () => ({
  maxRetriesPerRequest: null,   // obrigatório para BullMQ
  enableReadyCheck: false,
  retryStrategy(times) {
    return Math.min(times * 200, 5000);
  },
});
```

### Opções padrão de jobs

| Opção | Valor | Descrição |
|---|---|---|
| `attempts` | `3` | Tentativas antes de ir para a DLQ |
| `backoff.type` | `exponential` | Estratégia de reenvio |
| `backoff.delay` | `5000 ms` | Delay base entre tentativas |
| `removeOnComplete.count` | `1000` | Mantém os últimos 1.000 jobs concluídos |
| `removeOnComplete.age` | `86400 s` (24 h) | Remove jobs concluídos após 24 horas |
| `removeOnFail.count` | `5000` | Mantém os últimos 5.000 jobs falhos |
| `removeOnFail.age` | `604800 s` (7 dias) | Remove jobs falhos após 7 dias |

### Dead Letter Queue (DLQ)

Quando um job esgota todas as tentativas, o worker move automaticamente uma cópia para a fila `dead-letter` com metadados de diagnóstico (`originalQueue`, `lastError`, `attempts`, `failedAt`). A DLQ é monitorada via Sentry com nível `warning`.

Jobs na DLQ podem ser reenviados à fila original via `retryDeadLetterJob(jobId)`, e listados via `listDeadLetterJobs(limit)`.

---

## 4. Redis

### Client singleton

O client Redis é instanciado de forma lazy em `src/lib/redis.ts` via `getRedisClient()`. A instância é compartilhada por todo o processo. Para testes, é preferível não chamar `getRedisClient()` diretamente.

```typescript
export const redis = {
  get client() { return getRedisClient(); }
};
```

### Configuração (`src/config/redis.ts`)

| Parâmetro | Valor | Descrição |
|---|---|---|
| `host` | `env.REDIS_HOST` | Host do Redis |
| `port` | `env.REDIS_PORT` | Porta (padrão 6379) |
| `password` | `env.REDIS_PASSWORD` | Senha (opcional) |
| `db` | `env.REDIS_DB` | Banco Redis (padrão 0) |
| `tls` | `env.REDIS_TLS` | TLS habilitado para Upstash |
| `maxRetriesPerRequest` | `3` | Para cliente regular (não BullMQ) |

### TTLs de cache

| Cache | TTL | Chave (`cacheKeys`) |
|---|---|---|
| Permissões | 300 s (5 min) | `permissions:user:{userId}` |
| Sessões | 1800 s (30 min) | `session:{sessionId}` |
| Usuários | 600 s (10 min) | `user:{userId}` |
| Rate limit | por endpoint | `rate-limit:{ip}:{endpoint}` |
| Padrão genérico | 300 s (5 min) | — |

### Camadas de cache para permissões (L1/L2/L3)

O `PermissionService` implementa três camadas:

1. **L1** — cache em memória (Map) no processo Node.js
2. **L2** — cache Redis com TTL de 5 minutos
3. **L3** — banco de dados (PostgreSQL via Prisma)

O `PermissionService` é um singleton registrado uma única vez nas factories, evitando que cada requisição crie uma nova instância.

### Uso em desenvolvimento local

O `docker-compose.yml` sobe um Redis 7 Alpine com persistência AOF:

```yaml
redis:
  image: redis:7-alpine
  command: redis-server --appendonly yes
  ports:
    - '6379:6379'
```

---

## 5. S3 / MinIO (Armazenamento de Arquivos)

### SDK utilizado

O projeto usa o AWS SDK v3 (`@aws-sdk/client-s3` e `@aws-sdk/s3-request-presigner`) configurado para ser compatível com MinIO em desenvolvimento e S3 real em produção, via variáveis de ambiente:

| Variável | Descrição |
|---|---|
| `S3_ENDPOINT` | URL do endpoint (MinIO local ou S3 AWS) |
| `S3_BUCKET` | Nome do bucket |
| `S3_ACCESS_KEY_ID` | Chave de acesso |
| `S3_SECRET_ACCESS_KEY` | Chave secreta |
| `S3_REGION` | Região (ex: `us-east-1`) |

### Funcionalidades implementadas

| Operação | Descrição |
|---|---|
| Upload simples | PUT direto via SDK com stream |
| Multipart upload | Upload em partes para arquivos grandes (>5 MB) |
| Presigned URL | URLs temporárias para download seguro sem exposição de credenciais |
| Download via proxy | O backend faz proxy do arquivo para o cliente |
| ZIP de pasta | `archiver` comprime múltiplos arquivos em ZIP antes de enviar |
| Thumbnail | `sharp` gera thumbnails de imagens; `ffmpeg` para vídeos; LibreOffice para documentos Office |
| Criptografia | Arquivos podem ser criptografados em repouso (AES-GCM via `node-forge`) |

O módulo de storage está em `src/services/storage/` e `src/use-cases/storage/`.

---

## 6. Sentry

### Inicialização

O Sentry é inicializado em `src/lib/sentry.ts` via `initSentry()`, chamado no topo de `src/app.ts` antes de qualquer plugin. A inicialização é idempotente (guarda via `isInitialized`).

Se `SENTRY_DSN` não estiver configurado, o Sentry é silenciosamente desabilitado.

### Configuração

| Parâmetro | Produção | Dev/Staging |
|---|---|---|
| `tracesSampleRate` | `0.1` (10%) | `1.0` (100%) |
| `profilesSampleRate` | `0.1` (10%) | `0.5` (50%) |
| `environment` | `production` | `dev` / `staging` |
| `release` | `opensea-api@{npm_version}` | idem |

### Erros ignorados (`ignoreErrors`)

Erros de domínio esperados não são reportados ao Sentry:

- `UnauthorizedError`, `ForbiddenError`, `ResourceNotFoundError`
- `BadRequestError`, `UserBlockedError`, `PasswordResetRequiredError`
- `Too Many Requests` (rate limiting)
- `Validation error` (erros de validação Zod)

### Sanitização de dados sensíveis

O callback `beforeSend` remove automaticamente:
- Headers: `authorization`, `cookie`, `x-api-key`
- Campos do body: `password`, `currentPassword`, `newPassword`, `token`, `refreshToken`

O callback `beforeBreadcrumb` filtra queries SQL que contenham `password` ou `token`.

### Funções exportadas

| Função | Uso |
|---|---|
| `captureException(error, context?)` | Captura exceção com contexto de usuário/endpoint |
| `captureMessage(message, level?, context?)` | Captura mensagem manual |
| `setUser(user \| null)` | Define contexto de usuário para eventos subsequentes |
| `addBreadcrumb(message, category, data?)` | Adiciona breadcrumb para rastreamento |

---

## 7. Pino Logger

### Configuração (`src/lib/logger.ts`)

| Ambiente | Nível | Formato |
|---|---|---|
| `production` | `info` | JSON estruturado (sem pretty-print) |
| `dev` / `test` | `debug` | `pino-pretty` com cores e timestamp `HH:MM:ss Z` |

Em produção, o formatter de nível usa `{ level: label }` para compatibilidade com agregadores de log (Datadog, Loki, etc.).

### Loggers contextuais disponíveis

```typescript
import { logger, httpLogger, dbLogger, authLogger, errorLogger, perfLogger } from '@/lib/logger';
```

| Export | Contexto | Uso recomendado |
|---|---|---|
| `logger` | — | Logger raiz, uso geral |
| `httpLogger` | `HTTP` | Requisições e respostas HTTP |
| `dbLogger` | `DATABASE` | Queries e conexões de banco |
| `authLogger` | `AUTH` | Login, logout, token refresh |
| `errorLogger` | `ERROR` | Erros não tratados |
| `perfLogger` | `PERFORMANCE` | Métricas de latência e throughput |

### Criação de logger filho

```typescript
import { createLogger } from '@/lib/logger';

const emailLogger = createLogger('EMAIL');
emailLogger.info({ accountId }, 'IMAP sync started');
```

O child logger herda configuração do pai e adiciona o campo `context` a todos os eventos.

---

## 8. tsup (Build)

### Arquivo de configuração: `tsup.config.ts`

```typescript
export default defineConfig({
  entry: ['src/server.ts', 'src/app.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'build',
  clean: true,
  sourcemap: false,
  splitting: false,
  skipNodeModulesBundle: true,   // node_modules ficam externos
  noExternal: [/^@\//],          // aliases @/* são internalizados no bundle
});
```

### Estratégia de bundle

- **`skipNodeModulesBundle: true`** — todas as dependências do `node_modules` ficam como `require`/`import` externos no container de produção.
- **`noExternal: [/^@\//]`** — os aliases internos (`@/lib`, `@/entities`, etc.) são resolvidos e embutidos no bundle, pois não existem como módulos reais em `node_modules`.
- **Dois entrypoints** — `server.ts` (processo principal) e `app.ts` (instância Fastify, usada nos testes E2E).

### Saída

```
build/
  server.js    # Entrypoint principal
  app.js       # Instância Fastify isolada
  workers/
    index.js   # Entrypoint dos workers BullMQ
```

### Script especial de seed

O seed de produção é compilado por `scripts/build-seed.mjs` usando `esbuild` diretamente (não tsup), com as seguintes dependências mantidas externas: `@prisma/client/runtime/client`, `@prisma/adapter-pg`, `bcryptjs`, `pg`.

---

## 9. Vitest (Testes)

### Configuração base: `vite.config.mjs`

O Vitest usa `vite-tsconfig-paths` para resolver os aliases `@/*` e `@prisma/generated/*` definidos no `tsconfig.json`.

### Projetos configurados

| Projeto | Include | Setup | Pool |
|---|---|---|---|
| `unit` | `src/use-cases/**/*.spec.ts`, `src/entities/**/*.spec.ts`, `src/repositories/**/*.spec.ts` | Nenhum | Padrão |
| `e2e` | `src/http/controllers/**/*.e2e.spec.ts` | `prisma/vitest-setup-e2e.ts` | `forks` (singleFork) |

### Configuração especial dos testes E2E

```javascript
pool: 'forks',
poolOptions: {
  forks: {
    singleFork: true,          // todos os specs compartilham um único processo
    execArgv: ['--stack-size=16384'],  // 16 MB de stack (Fastify ~450+ plugins)
  },
},
fileParallelism: false,        // evita contention no advisory lock do Prisma migrate
testTimeout: 30000,            // 30 s por teste
hookTimeout: 300000,           // 5 min para beforeAll (migrate + seed)
```

O `singleFork` é crítico para performance: o app Fastify é inicializado **uma única vez** e reutilizado por todos os arquivos de teste, evitando cold-start de ~130 s por arquivo.

### Coverage

| Métrica | Threshold |
|---|---|
| Lines | 70% |
| Functions | 65% |
| Branches | 60% |
| Statements | 70% |

Cobertura inclui: `src/use-cases/**`, `src/entities/**`, `src/services/**`.
Cobertura exclui: `node_modules`, `*.spec.ts`, `*.e2e.spec.ts`, `**/factories/**`.

Reporters disponíveis: `text`, `json`, `html`, `lcov`.

### Comandos

```bash
npm run test              # Testes unitários
npm run test:e2e          # Testes E2E
npm run test:watch        # Unitários em watch mode
npm run test:coverage     # Unitários com cobertura
```

---

## 10. Docker

### Dockerfile principal (multi-stage)

| Stage | Base image | Finalidade |
|---|---|---|
| `deps` | `node:22-alpine` | Instala apenas dependências de produção (`--only=production`) |
| `builder` | `node:22-alpine` | Instala todas as deps, executa `prisma generate`, `npm run build` e `build-seed.mjs` |
| `runner` | `node:22-alpine` | Imagem final mínima com instâncias non-root |

O stage `runner` instala ferramentas de sistema necessárias:

```dockerfile
RUN apk add --no-cache libreoffice-writer libreoffice-calc libreoffice-impress \
    font-noto font-noto-cjk poppler-utils ffmpeg
```

Estas ferramentas são usadas para geração de thumbnails no módulo de storage.

**Segurança:** o container roda como usuário `fastify` (UID 1001), nunca como `root`.

### Health check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3333/health/live || exit 1
```

O `start-period=120s` garante que o container não seja marcado como unhealthy durante o cold-start (Swagger compilation pode levar até 3 min em produção no primeiro boot).

### Dockerfile.worker

Imagem separada para os workers BullMQ. Mais leve — não inclui LibreOffice, ffmpeg nem poppler. Entrypoint:

```dockerfile
CMD ["node", "--stack-size=8192", "build/workers/index.js"]
```

### docker-compose.yml (desenvolvimento local)

Sobe três serviços:

| Serviço | Imagem | Porta(s) | Notas |
|---|---|---|---|
| `postgres` | `bitnami/postgresql:latest` | `5432` | Persistência em volume; healthcheck via `pg_isready` |
| `redis` | `redis:7-alpine` | `6379` | AOF habilitado; healthcheck via `redis-cli ping` |
| `greenmail` | `greenmail/standalone:2.1.2` | `3025/3143/3465/3993/8080` | Servidor SMTP/IMAP para testes de e-mail |

---

## 11. Fly.io (Deploy)

### Arquivo de configuração: `fly.toml`

```toml
app = 'opensea-api'
primary_region = 'gru'   # São Paulo

[deploy]
  release_command = "sh scripts/release.sh"   # migrations + seed antes das máquinas novas

[http_service]
  internal_port = 3333
  force_https = true
  auto_stop_machines = 'suspend'
  auto_start_machines = true
  min_machines_running = 2      # mínimo 2 instâncias para HA

[vm]
  memory = '512mb'
  cpu_kind = 'shared'
  cpus = 1
```

### Estratégia de deploy

1. O `release_command` roda `scripts/release.sh` **uma única vez** por deploy, antes de substituir as máquinas antigas.
2. `scripts/release.sh` executa `npx prisma migrate deploy` seguido de `node build/seed.mjs`.
3. Se o release command falhar, o deploy é cancelado automaticamente (rollback seguro).

### Concorrência configurada

| Tipo | Limite soft | Limite hard |
|---|---|---|
| `requests` | 200 | 250 |

### Health check no Fly.io

| Parâmetro | Valor |
|---|---|
| `interval` | 15 s |
| `timeout` | 5 s |
| `grace_period` | 120 s |
| `path` | `GET /health/live` |

### Métricas Prometheus

O endpoint `/metrics` é exposto na porta 3333 e declarado no `fly.toml` para coleta automática:

```toml
[metrics]
  port = 3333
  path = '/metrics'
```

### Staging

Existe um arquivo `fly.staging.toml` para o ambiente de staging, com configurações equivalentes mas apontando para banco e secrets separados.

---

## 12. ESLint + Commitlint

### ESLint: `eslint.config.mjs`

Usa a flat config do ESLint 9 com:

| Conjunto de regras | Aplicação |
|---|---|
| `js/recommended` | Regras JavaScript padrão |
| `tseslint.configs.recommended` | Regras TypeScript (strict) |
| `eslint-plugin-prettier/recommended` | Formatação via Prettier integrada ao lint |

**Regras customizadas:**

- `@typescript-eslint/no-unused-vars: error` — variáveis não usadas são erro; exceção para prefixo `_` (parâmetros ignorados intencionalmente: `_hint`, `_err`, etc.)
- `prettier/prettier: error` com `endOfLine: 'auto'` — compatível com Windows/Linux

**Diretórios ignorados:** `build/`, `build-test/`, `node_modules/`, `generated/`, `prisma/`

### Commitlint

O arquivo `commitlint.config.js` na raiz do repositório raiz (`D:\Code\Projetos\OpenSea\`) define a convenção de commits para ambos os projetos (API e APP).

Commits seguem o padrão **Conventional Commits**:

```
<tipo>(<escopo>): <mensagem>

Exemplos:
feat(stock): adicionar campo de peso ao produto
fix(auth): corrigir expiração do refresh token
docs(calendar): atualizar documentação de recorrência
chore(deps): atualizar prisma para 7.4.0
```

O CHANGELOG é gerado automaticamente via `standard-version`:

```bash
npm run release          # patch
npm run release:minor    # minor
npm run release:major    # major
```

---

## 13. node-forge (Criptografia)

### Uso no projeto

A biblioteca `node-forge` (v1.3.3) é usada exclusivamente no módulo de e-mail para criptografar credenciais IMAP/SMTP em repouso no banco de dados.

**Algoritmo:** AES-GCM (256 bits)

As credenciais (`imapPassword`, `smtpPassword`) são criptografadas antes de persistir e descriptografadas na hora de abrir conexões IMAP/SMTP.

**Localização:** `src/services/email/credential-encryption.ts`

### Por que node-forge e não a Web Crypto API nativa?

O `node-forge` foi escolhido por oferecer uma API síncrona e bem tipada para AES-GCM, sem necessidade de converter entre `Buffer` e `ArrayBuffer` que a Web Crypto API exige.

---

## 14. rrule (Regras de Recorrência)

### Uso no projeto

A biblioteca `rrule` (v2.8.1) é usada no módulo de Calendário para expandir regras de recorrência no formato iCalendar (RFC 5545).

**Localização:** `src/use-cases/calendar/events/`

### Funcionalidade principal

Dado um `RRULE` string (ex: `FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10`), o use case expande as ocorrências dentro de um intervalo de datas:

```typescript
import { RRule } from 'rrule';

const rule = RRule.fromString(event.rrule);
const occurrences = rule.between(rangeStart, rangeEnd);
```

### Limitações documentadas

- Expansão limitada a **90 dias** por consulta para evitar processamento excessivo
- `RRULE` inválido faz fallback para retornar apenas o evento original (sem expansão)
- Suporte a timezone via campo `timezone` (IANA) no modelo `CalendarEvent`

---

## 15. ical-generator (Exportação iCal)

### Uso no projeto

A biblioteca `ical-generator` (v10.0.0) é usada para exportar eventos do calendário no formato `.ics` (iCalendar, RFC 5545).

**Endpoint:** `GET /v1/calendar/events/export`

**Localização:** `src/use-cases/calendar/events/export-calendar-events.ts`

### Campos exportados

| Campo iCal | Campo do modelo | Observação |
|---|---|---|
| `SUMMARY` | `title` | Substituído por `"Ocupado"` para eventos privados |
| `DESCRIPTION` | `description` | Omitido para eventos privados de terceiros |
| `DTSTART` / `DTEND` | `startAt` / `endAt` | Com suporte a `TZID` quando `timezone` está preenchido |
| `RRULE` | `rrule` | Passado diretamente se presente |
| `UID` | `id` + `@opensea` | Identificador único global do evento |
| `ORGANIZER` | `createdBy` user email | — |

### Resposta HTTP

O controller define os headers de download corretos:

```typescript
reply
  .header('Content-Type', 'text/calendar; charset=utf-8')
  .header('Content-Disposition', 'attachment; filename="agenda.ics"')
  .send(icsContent);
```

---

## Audit History

| Data | Dimensão | Score | Relatório |
|---|---|---|---|
| 2026-03-10 | Infraestrutura geral | — | Documentação inicial criada |
