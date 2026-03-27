# Multi-Method Authentication System — Design Spec

**Data:** 2026-03-27
**Módulo:** Core (Auth)
**Criticidade:** Alta — sistema em produção, módulo core

---

## 1. Visão Geral

Sistema de autenticação multi-método que substitui o login único por email, permitindo que usuários autentiquem via **Email, CPF, Matrícula, OAuth (Google/Microsoft/Apple/GitHub)** e **Magic Link**. Cada método é um vínculo (`AuthLink`) associado ao usuário, com estados independentes e gestão centralizada.

### Princípios

- **Campo inteligente**: um único campo de login detecta o tipo de identificador automaticamente
- **Apenas vinculação**: OAuth não cria contas novas, apenas se vincula a contas existentes
- **Controle por tenant**: cada empresa define quais métodos estão disponíveis
- **Compatibilidade total**: login por email+senha existente continua funcionando sem mudanças para o usuário
- **Zero downtime**: migração de dados é aditiva (não remove campos existentes)

---

## 2. Modelo de Dados

### 2.1 AuthLink (novo)

| Campo        | Tipo                   | Descrição                                                                 |
| ------------ | ---------------------- | ------------------------------------------------------------------------- |
| `id`         | UUID                   | PK                                                                        |
| `userId`     | FK → User              | Dono do vínculo                                                           |
| `tenantId`   | FK → Tenant (nullable) | null = global (Email, CPF, OAuth); preenchido = tenant-scoped (Matrícula) |
| `provider`   | Enum                   | EMAIL, CPF, ENROLLMENT, GOOGLE, MICROSOFT, APPLE, GITHUB                  |
| `identifier` | String                 | O valor: email, CPF limpo (11 dígitos), matrícula, OAuth subject ID       |
| `credential` | String?                | Hash bcrypt da senha (para EMAIL/CPF/ENROLLMENT); null para OAuth         |
| `metadata`   | Json?                  | OAuth: { name, email, avatarUrl, refreshToken }; outros: null             |
| `status`     | Enum                   | ACTIVE, INACTIVE                                                          |
| `linkedAt`   | DateTime               | Quando foi vinculado                                                      |
| `unlinkedAt` | DateTime?              | null = vinculado; preenchido = desvinculado (soft delete)                 |
| `lastUsedAt` | DateTime?              | Último uso para login                                                     |
| `createdAt`  | DateTime               |                                                                           |
| `updatedAt`  | DateTime               |                                                                           |

**Índices:**

- `@@unique([provider, identifier, unlinkedAt])` — impede duplicatas ativas
- `@@index([userId, status])`
- `@@index([identifier])`

### 2.2 TenantAuthConfig (novo)

| Campo                | Tipo                     | Descrição                                                              |
| -------------------- | ------------------------ | ---------------------------------------------------------------------- |
| `id`                 | UUID                     | PK                                                                     |
| `tenantId`           | FK → Tenant (unique)     | Um por tenant                                                          |
| `allowedMethods`     | Json                     | Array de providers permitidos: `["EMAIL","CPF","GOOGLE","MAGIC_LINK"]` |
| `magicLinkEnabled`   | Boolean (default: false) | Habilita magic link                                                    |
| `magicLinkExpiresIn` | Int (default: 15)        | Expiração em minutos                                                   |
| `defaultMethod`      | String?                  | Método sugerido na tela de login                                       |
| `createdAt`          | DateTime                 |                                                                        |
| `updatedAt`          | DateTime                 |                                                                        |

### 2.3 MagicLinkToken (novo)

| Campo       | Tipo      | Descrição                      |
| ----------- | --------- | ------------------------------ |
| `id`        | UUID      | PK                             |
| `userId`    | FK → User |                                |
| `token`     | String    | Hash SHA-256 do token enviado  |
| `email`     | String    | Endereço para onde foi enviado |
| `expiresAt` | DateTime  |                                |
| `usedAt`    | DateTime? | null = não usado               |
| `createdAt` | DateTime  |                                |

**Índice:** `@@index([token])`

### 2.4 Mudanças em modelos existentes

| Modelo                              | Mudança                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| `User.email`                        | Passa a ser **nullable** (usuários só com CPF)                                        |
| `User.password_hash`                | Passa a ser **nullable** (usuários só com OAuth/Magic Link)                           |
| `User.email` e `User.password_hash` | Permanecem preenchidos para compatibilidade; AuthLink é a fonte de verdade para login |

---

## 3. Fluxos de Autenticação

### 3.1 Login Unificado (campo inteligente)

```
Input: identificador + senha
  │
  ├─ Contém "@" → provider = EMAIL
  ├─ 11 dígitos numéricos → provider = CPF
  └─ Outro → provider = ENROLLMENT
  │
  ├─ Busca AuthLink(provider, identifier) onde unlinkedAt IS NULL
  ├─ Não encontrou → erro genérico "Credenciais inválidas"
  ├─ status = INACTIVE → "Método de login desabilitado. Contate o administrador."
  └─ status = ACTIVE:
       ├─ bcrypt.compare(senha, credential) → falhou → incrementa failedLoginAttempts no User
       ├─ Verifica lockout (blockedUntil no User)
       ├─ Verifica forcePasswordReset no User
       ├─ Atualiza AuthLink.lastUsedAt
       ├─ Cria sessão (loginMethod = provider.toLowerCase())
       └─ Retorna JWT + tenants
```

**Validação do tenant:** Quando o AuthLink tem `tenantId` preenchido (Matrícula), o login retorna apenas os tenants correspondentes. Quando é global (Email/CPF), retorna todos os tenants do usuário.

### 3.2 Magic Link

```
Solicitar:
  ├─ Input: identificador (email ou CPF)
  ├─ Resolve AuthLink → encontra userId
  ├─ Busca email do usuário (AuthLink EMAIL ou User.email)
  │    └─ Sem email → erro "Cadastre um email para usar Magic Link"
  ├─ Verifica TenantAuthConfig.magicLinkEnabled
  │    └─ Como o tenant não é conhecido antes do login, verifica se QUALQUER tenant
  │       do usuário tem magic link habilitado
  ├─ Gera token (32 bytes, crypto.randomBytes, base64url)
  ├─ Salva MagicLinkToken(token=SHA256(token), expiresAt=now+15min)
  ├─ Envia email com link: {APP_URL}/auth/magic-link?token={token_raw}
  └─ Resposta: "Se o identificador estiver cadastrado, um email foi enviado"
       (mensagem genérica por segurança)

Verificar:
  ├─ Input: token (raw)
  ├─ Calcula SHA256(token), busca MagicLinkToken
  ├─ Não encontrou → "Link inválido"
  ├─ expiresAt < now → "Link expirado, solicite um novo"
  ├─ usedAt != null → "Link já utilizado"
  ├─ Marca usedAt = now
  ├─ Cria sessão (loginMethod = 'magic_link')
  └─ Retorna JWT + tenants
```

### 3.3 OAuth Login

```
Vinculação (usuário autenticado, no perfil):
  ├─ POST /v1/auth/oauth/:provider/link → retorna redirect URL
  ├─ Usuário autoriza no provedor → callback com code
  ├─ Backend troca code por access_token → obtém user info (sub, email, name, avatar)
  ├─ Verifica: AuthLink(provider, identifier=sub) já existe para OUTRO user?
  │    └─ Sim → erro "Esta conta já está vinculada a outro usuário"
  ├─ Cria AuthLink(provider, identifier=sub, metadata={...}, status=ACTIVE)
  └─ Retorna sucesso

Login (usuário não autenticado):
  ├─ OAuth flow → obtém sub
  ├─ Busca AuthLink(provider, identifier=sub, status=ACTIVE)
  ├─ Não encontrou → "Vincule sua conta pelo perfil primeiro"
  ├─ Encontrou → cria sessão (loginMethod = 'oauth')
  └─ Retorna JWT + tenants
```

### 3.4 Fast-Login (PIN) — Sem mudanças

O fluxo `POST /v1/auth/login/access-pin` permanece inalterado. Usa `User.accessPinHash` diretamente, não passa pelo AuthLink.

---

## 4. Gestão de Vínculos

### 4.1 Perfil do Usuário (seção "Contas Conectadas")

- Lista todos os AuthLinks do usuário (apenas provedores permitidos pelo tenant ativo)
- Ações: Vincular, Desativar, Reativar, Desvincular
- **Regra crítica**: não permite desativar/desvincular o último método ativo
- Vincular CPF: digita CPF + confirma senha atual
- Vincular OAuth: inicia OAuth flow

### 4.2 Admin → Usuários

- Visualiza e gerencia todos os vínculos de qualquer usuário
- **Override**: pode desativar/desvincular o último método (ex: desligamento)
- Pode vincular CPF/Matrícula em nome do usuário
- Todas as ações logadas no Audit

### 4.3 HR → Criar Funcionário com Conta

- Se CPF preenchido e tenant permite CPF: checkbox "Habilitar login por CPF" (default on)
- Se matrícula preenchida e tenant permite: checkbox "Habilitar login por matrícula"
- Cria User + AuthLinks correspondentes automaticamente

### 4.4 Admin → Configurações → Autenticação

- Toggle para cada método disponível
- Ao desabilitar um método: todos os AuthLinks desse provider no tenant passam para INACTIVE
- Configurações de Magic Link (habilitar, tempo de expiração)

---

## 5. Endpoints

### 5.1 Novos endpoints

| Método | Rota                                | Auth | Permissão             | Propósito                                      |
| ------ | ----------------------------------- | ---- | --------------------- | ---------------------------------------------- |
| POST   | `/v1/auth/login/unified`            | Não  | —                     | Login unificado (email/CPF/matrícula + senha)  |
| POST   | `/v1/auth/magic-link/request`       | Não  | —                     | Solicitar magic link                           |
| POST   | `/v1/auth/magic-link/verify`        | Não  | —                     | Autenticar via magic link                      |
| POST   | `/v1/auth/oauth/:provider/callback` | Não  | —                     | Callback OAuth para login                      |
| POST   | `/v1/auth/oauth/:provider/link`     | Sim  | —                     | Iniciar vinculação OAuth (retorna URL)         |
| GET    | `/v1/auth/methods`                  | Não  | —                     | Listar métodos disponíveis (query: tenantSlug) |
| GET    | `/v1/users/me/auth-links`           | Sim  | —                     | Listar meus vínculos                           |
| POST   | `/v1/users/me/auth-links`           | Sim  | —                     | Vincular novo método (CPF/Matrícula)           |
| PATCH  | `/v1/users/me/auth-links/:id`       | Sim  | —                     | Ativar/desativar vínculo próprio               |
| DELETE | `/v1/users/me/auth-links/:id`       | Sim  | —                     | Desvincular método próprio                     |
| GET    | `/v1/users/:id/auth-links`          | Sim  | admin.users.access    | Listar vínculos de um usuário                  |
| POST   | `/v1/users/:id/auth-links`          | Sim  | admin.users.modify    | Vincular método para um usuário                |
| PATCH  | `/v1/users/:id/auth-links/:linkId`  | Sim  | admin.users.modify    | Ativar/desativar vínculo (admin)               |
| DELETE | `/v1/users/:id/auth-links/:linkId`  | Sim  | admin.users.admin     | Desvincular método (admin, com override)       |
| GET    | `/v1/tenant-auth-config`            | Sim  | admin.settings.access | Ler config de autenticação                     |
| PUT    | `/v1/tenant-auth-config`            | Sim  | admin.settings.admin  | Atualizar config de autenticação               |

### 5.2 Endpoints existentes modificados

| Rota                              | Mudança                                                                  |
| --------------------------------- | ------------------------------------------------------------------------ |
| `POST /v1/auth/login/password`    | Mantido como alias → internamente usa lógica do unified (provider=EMAIL) |
| `POST /v1/users`                  | Também cria AuthLink(EMAIL) automaticamente                              |
| `POST /v1/hr/employees-with-user` | Cria AuthLinks (EMAIL + CPF se habilitado + Matrícula se habilitada)     |
| `POST /v1/auth/register/password` | Também cria AuthLink(EMAIL)                                              |

---

## 6. Segurança

### 6.1 Proteções

| Aspecto           | Implementação                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Brute force       | Mesma proteção atual: 5 tentativas → 15min lockout (User.failedLoginAttempts)                       |
| Mensagens de erro | Genéricas no login: "Credenciais inválidas" (não revela se identificador existe)                    |
| Magic link tokens | Armazenados como SHA-256, raw token só no email                                                     |
| Magic link replay | Token marcado como usado após primeiro uso                                                          |
| OAuth state       | CSRF protection via state parameter no OAuth flow                                                   |
| OAuth tokens      | Refresh tokens dos provedores armazenados criptografados no metadata                                |
| CPF em trânsito   | Sempre limpo (só dígitos) no backend, formatado só no frontend                                      |
| Último método     | Usuário não pode remover seu último método ativo                                                    |
| Admin override    | Admin pode remover último método (ação logada no Audit)                                             |
| Credential sync   | Ao alterar senha, atualiza credential em TODOS os AuthLinks com credential (EMAIL, CPF, ENROLLMENT) |

### 6.2 Validações (Error Handler)

| Erro                             | Código | Mensagem                                                                 |
| -------------------------------- | ------ | ------------------------------------------------------------------------ |
| Identificador não encontrado     | 401    | "Credenciais inválidas"                                                  |
| Método inativo                   | 403    | "Este método de login está desabilitado. Contate o administrador."       |
| Conta bloqueada                  | 423    | "Conta temporariamente bloqueada. Tente novamente em {minutos} minutos." |
| CPF já vinculado a outro user    | 409    | "Este CPF já está vinculado a outra conta."                              |
| OAuth já vinculado a outro user  | 409    | "Esta conta {provider} já está vinculada a outro usuário."               |
| Último método ativo              | 422    | "Não é possível desativar o único método de login ativo."                |
| Magic link expirado              | 410    | "Link expirado. Solicite um novo."                                       |
| Magic link já usado              | 410    | "Link já utilizado. Solicite um novo."                                   |
| Sem email para magic link        | 422    | "Cadastre um email para utilizar Magic Link."                            |
| Magic link desabilitado          | 403    | "Magic Link não está habilitado para nenhuma das suas empresas."         |
| Método não permitido pelo tenant | 403    | "Este método de login não está disponível para sua empresa."             |
| Provedor OAuth inválido          | 400    | "Provedor de autenticação inválido."                                     |

---

## 7. Migração de Dados

Migração automática e idempotente executada como seed/migration:

1. Para cada `User` com `email` preenchido:
   - Cria `AuthLink(provider=EMAIL, identifier=email, credential=password_hash, status=ACTIVE)`
   - Skipa se AuthLink já existe

2. Para cada `Employee` com CPF que tem `userId`:
   - Cria `AuthLink(provider=CPF, identifier=cpf_limpo, credential=User.password_hash, status=ACTIVE)`
   - Skipa se AuthLink já existe

3. Para cada `Tenant`:
   - Cria `TenantAuthConfig(allowedMethods=["EMAIL"], magicLinkEnabled=false)`
   - Skipa se config já existe

4. Campos `User.email` e `User.password_hash` permanecem preenchidos
5. Endpoint `POST /v1/auth/login/password` continua funcionando (alias)

---

## 8. Escopo Explícito

### Incluído neste spec

- Modelo de dados (AuthLink, TenantAuthConfig, MagicLinkToken)
- Login unificado (email/CPF/matrícula + senha)
- Magic Link (request + verify)
- Gestão de vínculos (perfil, admin, HR)
- Config de autenticação por tenant
- Migração de dados existentes
- Validações completas com error handler
- Testes unitários e E2E

### NÃO incluído (futuro)

- OAuth providers (Google, Microsoft, Apple, GitHub) — requer registro de apps, SDKs, e infraestrutura de callback. Será implementado como fase posterior.
- Tela de login no frontend (será feita após backend validado)
- Configuração de matrícula no módulo HR (página de configurações)

---

## 9. LoginMethod Enum Update

O enum `LoginMethod` do `Session` deve ser expandido:

```typescript
// Atual
type LoginMethod =
  | 'password'
  | 'oauth'
  | 'magic_link'
  | 'access_pin'
  | 'api_key';

// Novo
type LoginMethod =
  | 'email'
  | 'cpf'
  | 'enrollment'
  | 'oauth'
  | 'magic_link'
  | 'access_pin'
  | 'api_key';
```

Isso permite rastrear exatamente qual método foi usado para criar cada sessão.

---

## 10. Revisão de Compatibilidade (Auto-Review)

Verificação cruzada com o codebase existente, realizada em 2026-03-27:

### 10.1 Conflitos Identificados e Resoluções

| Área                           | Problema                                                          | Resolução                                                                                                                                                                     |
| ------------------------------ | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User.email` unique constraint | `@@unique([email, deletedAt])` no schema impede nullable direto   | Manter campo NOT NULL por ora; AuthLink é fonte de verdade para login; User.email continua obrigatório na criação mas pode ser um placeholder para usuários futuros sem email |
| `User.password_hash` NOT NULL  | Referenciado em change-password e reset flows                     | Tornar nullable; adicionar guard clauses nos use cases existentes                                                                                                             |
| LoginMethod = "password"       | Sessions existentes usam "password", spec muda para "email"/"cpf" | Manter "password" como alias válido para compatibilidade; novas sessions usam o provider específico                                                                           |
| `admin.settings.*` permissions | Não existem no `permission-codes.ts`                              | Criar `admin.settings.access` e `admin.settings.admin`                                                                                                                        |
| Password change sync           | `ChangeMyPasswordUseCase` só atualiza `User.password_hash`        | Adicionar sync: ao mudar senha, atualizar `credential` em todos AuthLinks do usuário                                                                                          |
| Employee CPF hash              | Employee usa `cpfHash` para uniqueness                            | AuthLink pode usar identifier direto (CPF limpo, 11 dígitos); unique constraint via `@@unique([provider, identifier, unlinkedAt])`                                            |
| Frontend login service         | `auth.service.ts` envia `{ email }` hardcoded                     | Mudar para `{ identifier }` no endpoint unified                                                                                                                               |
| E2E test factories             | `create-and-authenticate-user.e2e.ts` cria user sem AuthLink      | Atualizar factory para criar AuthLink(EMAIL) junto                                                                                                                            |

### 10.2 Decisões de Compatibilidade

1. **`POST /v1/auth/login/password`** — mantido funcionando, internamente cria AuthLink se não existir (graceful migration)
2. **`User.email`** — permanece NOT NULL no schema; é o email principal do perfil, separado dos AuthLinks de login
3. **`User.password_hash`** — torna-se nullable; guard clauses adicionados
4. **Sessions com loginMethod="password"** — válidas historicamente, não precisam de migração
5. **Infraestrutura de email** — `src/services/email-service.ts` com nodemailer já existe e será estendido com `sendMagicLinkEmail()`

### 10.3 Zero Conflitos de Rotas

Todas as 16 novas rotas verificadas — nenhum conflito com rotas existentes.
