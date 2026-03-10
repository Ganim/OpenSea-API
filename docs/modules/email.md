# Module: Email

## Overview

O módulo de Email fornece um cliente de e-mail completo embutido no sistema, integrado à arquitetura multi-tenant. Cada tenant pode cadastrar múltiplas contas de e-mail (IMAP/SMTP), compartilhá-las com outros usuários, sincronizar mensagens em segundo plano via BullMQ e enviar e-mails diretamente pela aplicação.

**Responsabilidades principais:**
- Cadastro e gerenciamento de contas IMAP/SMTP com criptografia AES-256-GCM das credenciais
- Sincronização incremental de mensagens por pasta (baseada em `remoteUid` e `uidValidity`)
- Envio de e-mails com suporte a anexos (`multipart/form-data` ou JSON)
- Pool de conexões IMAP com reutilização, fila de espera e circuit breaker por host
- Paginação cursor-based (keyset em `receivedAt + id`) para listas de mensagens de alto volume
- Autocomplete de contatos por histórico de mensagens via `SQL UNION ALL`
- Marcar/desmarcar mensagens como lidas, sinalizadas (IMAP `\\Flagged`) ou movê-las entre pastas
- Compartilhamento granular de contas (`canRead`, `canSend`, `canManage`)
- Registro de auditoria para envios e downloads de anexos

**Dependências de outros módulos:**
- `core/` — autenticação JWT, multi-tenant (`tenantId` em todas as queries)
- `rbac/` — controle de permissões via `PermissionCodes.EMAIL.*`
- `audit/` — `queueAuditLog` para ações críticas (envio, download de anexo)
- `storage/` — `storageKey` em `EmailAttachment` referencia o serviço de arquivos
- `teams/` — `TeamEmailAccount` vincula contas de e-mail a equipes

**Módulo guard:** todas as rotas passam pelo middleware `createModuleMiddleware('EMAIL')`, que verifica se o plano do tenant inclui o módulo `EMAIL`.

---

## Entities

### EmailAccount

Representa uma conta de e-mail cadastrada por um usuário do tenant. As credenciais de acesso (senha / app password) são armazenadas exclusivamente de forma criptografada.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | `string` (UUID) | sim | auto | Identificador único |
| `tenantId` | `UniqueEntityID` | sim | — | Tenant proprietário |
| `ownerUserId` | `UniqueEntityID` | sim | — | Usuário que criou a conta |
| `address` | `string` | sim | — | Endereço de e-mail (único por tenant) |
| `displayName` | `string \| null` | não | `null` | Nome de exibição do remetente |
| `imapHost` | `string` | sim | — | Hostname do servidor IMAP |
| `imapPort` | `number` | sim | — | Porta IMAP (993, 143, etc.) |
| `imapSecure` | `boolean` | não | `true` | Usar TLS/SSL no IMAP |
| `smtpHost` | `string` | sim | — | Hostname do servidor SMTP |
| `smtpPort` | `number` | sim | — | Porta SMTP (587, 465, 25, etc.) |
| `smtpSecure` | `boolean` | não | `true` | Usar TLS/SSL no SMTP |
| `tlsVerify` | `boolean` | não | `false` | Verificar certificado TLS (rejeitar auto-assinados) |
| `username` | `string` | sim | — | Usuário de autenticação IMAP/SMTP |
| `encryptedSecret` | `string` | sim | — | Senha cifrada com AES-256-GCM (nunca exposta) |
| `visibility` | `'PRIVATE' \| 'SHARED'` | não | `'PRIVATE'` | Visibilidade da conta |
| `isActive` | `boolean` | não | `true` | Conta ativa para sincronização |
| `isDefault` | `boolean` | não | `false` | Conta padrão para envio |
| `signature` | `string \| null` | não | `null` | Assinatura HTML |
| `lastSyncAt` | `Date \| null` | não | `null` | Data da última sincronização bem-sucedida |
| `createdAt` | `Date` | não | `now()` | Data de criação |
| `updatedAt` | `Date` | não | `now()` | Data da última atualização |
| `teamId` | `string \| null` | não | `null` | Primeiro time vinculado (read-only, via join) |
| `teamName` | `string \| null` | não | `null` | Nome do primeiro time vinculado (read-only, via join) |

**Constraint:** `@@unique([tenantId, address])` — um endereço de e-mail não pode ser cadastrado mais de uma vez no mesmo tenant.

**Portas IMAP/SMTP válidas:** 25, 110, 143, 465, 587, 993, 995, 2525.

**Proteção SSRF:** durante a criação e atualização, os hosts IMAP e SMTP passam por resolução DNS com bloqueio de IPs privados/reservados.

---

### EmailAccountAccess

Tabela de controle de acesso compartilhado. Permite que o dono de uma conta conceda permissões granulares a outros usuários do mesmo tenant.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | `string` (UUID) | sim | auto | Identificador único |
| `accountId` | `string` | sim | — | Conta de e-mail compartilhada |
| `tenantId` | `string` | sim | — | Tenant |
| `userId` | `string` | sim | — | Usuário que recebe acesso |
| `canRead` | `boolean` | não | `true` | Permissão de leitura das mensagens |
| `canSend` | `boolean` | não | `false` | Permissão de envio de e-mails |
| `canManage` | `boolean` | não | `false` | Permissão de gerenciar a conta |
| `createdAt` | `Date` | não | `now()` | Data de criação |

**Constraint:** `@@unique([accountId, userId])`.

---

### EmailFolder

Representa uma pasta IMAP sincronizada da conta de e-mail.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | `string` (UUID) | sim | auto | Identificador único |
| `accountId` | `UniqueEntityID` | sim | — | Conta de e-mail proprietária |
| `remoteName` | `string` | sim | — | Caminho original no servidor IMAP (ex.: `INBOX`, `Sent Items`) |
| `displayName` | `string` | sim | — | Nome de exibição traduzido |
| `type` | `EmailFolderType` | não | `'CUSTOM'` | Tipo semântico da pasta |
| `uidValidity` | `number \| null` | não | `null` | `UIDVALIDITY` do IMAP (detecta re-numeração do servidor) |
| `lastUid` | `number \| null` | não | `null` | Último UID sincronizado (ponto de continuação) |
| `updatedAt` | `Date` | não | `now()` | Data da última atualização |

**Enum `EmailFolderType`:** `INBOX` | `SENT` | `DRAFTS` | `TRASH` | `SPAM` | `CUSTOM`

A detecção do tipo é feita pela propriedade `specialUse` do IMAP (ex.: `\\Sent`, `\\Drafts`, `\\Trash`, `\\Junk`) ou pelo path `INBOX`.

---

### EmailMessage

Representa uma mensagem de e-mail armazenada localmente após sincronização IMAP. O corpo HTML é higienizado antes de ser persistido.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | `string` (UUID) | sim | auto | Identificador único |
| `tenantId` | `UniqueEntityID` | sim | — | Tenant |
| `accountId` | `UniqueEntityID` | sim | — | Conta de e-mail |
| `folderId` | `UniqueEntityID` | sim | — | Pasta atual da mensagem |
| `remoteUid` | `number` | sim | — | UID IMAP da mensagem na pasta |
| `messageId` | `string \| null` | não | `null` | RFC 5322 Message-ID (para threading) |
| `threadId` | `string \| null` | não | `null` | ID da thread (agrupamento de respostas) |
| `fromAddress` | `string` | sim | — | Endereço de e-mail do remetente |
| `fromName` | `string \| null` | não | `null` | Nome do remetente |
| `toAddresses` | `string[]` | sim | — | Lista de destinatários To |
| `ccAddresses` | `string[]` | não | `[]` | Lista de destinatários CC |
| `bccAddresses` | `string[]` | não | `[]` | Lista de destinatários BCC |
| `subject` | `string` | sim | — | Assunto da mensagem |
| `snippet` | `string \| null` | não | `null` | Prévia do corpo (máx. 256 chars) |
| `bodyText` | `string \| null` | não | `null` | Corpo em texto simples |
| `bodyHtmlSanitized` | `string \| null` | não | `null` | Corpo HTML higienizado (XSS-safe) |
| `receivedAt` | `Date` | sim | — | Data de recebimento (chave do cursor) |
| `sentAt` | `Date \| null` | não | `null` | Data de envio original |
| `isRead` | `boolean` | não | `false` | Mensagem lida |
| `isFlagged` | `boolean` | não | `false` | Mensagem sinalizada / com estrela (IMAP `\\Flagged`) |
| `isAnswered` | `boolean` | não | `false` | Mensagem respondida (IMAP `\\Answered`) |
| `hasAttachments` | `boolean` | não | `false` | Possui anexos |
| `deletedAt` | `Date \| null` | não | `null` | Soft delete |
| `createdAt` | `Date` | não | `now()` | Data de criação |
| `updatedAt` | `Date` | não | `now()` | Data da última atualização |

**Constraint:** `@@unique([accountId, folderId, remoteUid])` — impede duplicatas na sincronização.

---

### EmailAttachment

Representa os metadados de um anexo de e-mail. O conteúdo binário é buscado sob demanda do IMAP no momento do download (não é armazenado no banco de dados).

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | `string` (UUID) | sim | auto | Identificador único |
| `messageId` | `UniqueEntityID` | sim | — | Mensagem proprietária |
| `filename` | `string` | sim | — | Nome original do arquivo |
| `contentType` | `string` | sim | — | MIME type (ex.: `application/pdf`) |
| `size` | `number` | sim | — | Tamanho em bytes |
| `storageKey` | `string` | sim | — | Chave de referência no serviço de armazenamento |
| `createdAt` | `Date` | não | `now()` | Data de criação |

---

### TeamEmailAccount

Modelo de junção que vincula contas de e-mail a equipes.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Identificador único |
| `tenantId` | `string` | Tenant |
| `teamId` | `string` | Equipe vinculada |
| `accountId` | `string` | Conta de e-mail vinculada |
| `linkedBy` | `string` | Usuário que realizou a vinculação |

---

## Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/v1/email/accounts` | `email.accounts.create` | Cadastra nova conta de e-mail |
| `GET` | `/v1/email/accounts` | `email.accounts.list` | Lista contas visíveis ao usuário |
| `GET` | `/v1/email/accounts/:id` | `email.accounts.read` | Obtém detalhes de uma conta |
| `PATCH` | `/v1/email/accounts/:id` | `email.accounts.update` | Atualiza configurações da conta |
| `DELETE` | `/v1/email/accounts/:id` | `email.accounts.delete` | Remove conta e todos os dados |
| `POST` | `/v1/email/accounts/:id/test` | `email.accounts.read` | Testa conectividade IMAP/SMTP |
| `POST` | `/v1/email/accounts/:id/sync` | `email.sync.execute` | Aciona sincronização manual |
| `POST` | `/v1/email/accounts/:id/share` | `email.accounts.share` | Compartilha conta com outro usuário |
| `DELETE` | `/v1/email/accounts/:id/share/:userId` | `email.accounts.share` | Remove compartilhamento |
| `GET` | `/v1/email/folders` | `email.messages.read` | Lista pastas de uma conta |
| `GET` | `/v1/email/messages` | `email.messages.list` | Lista mensagens com filtros e paginação cursor |
| `GET` | `/v1/email/messages/central-inbox` | `email.messages.list` | Caixa de entrada unificada (múltiplas contas) |
| `GET` | `/v1/email/messages/contacts/suggest` | `email.messages.read` | Autocomplete de contatos |
| `GET` | `/v1/email/messages/:id` | `email.messages.read` | Obtém detalhes de uma mensagem |
| `GET` | `/v1/email/messages/:id/thread` | `email.messages.read` | Lista todas as mensagens da mesma thread |
| `POST` | `/v1/email/messages/send` | `email.messages.send` | Envia e-mail (JSON ou multipart com anexos) |
| `POST` | `/v1/email/messages/draft` | `email.messages.send` | Salva rascunho no IMAP |
| `PATCH` | `/v1/email/messages/:id/read` | `email.messages.update` | Marca como lida/não lida |
| `PATCH` | `/v1/email/messages/:id/flag` | `email.messages.update` | Sinaliza/dessinaliza mensagem |
| `PATCH` | `/v1/email/messages/:id/move` | `email.messages.update` | Move para outra pasta |
| `DELETE` | `/v1/email/messages/:id` | `email.messages.delete` | Remove mensagem |
| `GET` | `/v1/email/messages/:messageId/attachments/:attachmentId/download` | `email.messages.read` | Download do anexo (binário, sob demanda do IMAP) |

**Rate limits aplicados:**
- Endpoints de contas: `rateLimitConfig.mutation` (100 req/min)
- Endpoints de mensagens: `rateLimitConfig.emailSend` (30 req/min)

---

### Request/Response Examples

#### POST /v1/email/accounts

```json
// Request body
{
  "address": "vendas@empresa.com.br",
  "displayName": "Vendas - Empresa Demo",
  "imapHost": "imap.empresa.com.br",
  "imapPort": 993,
  "imapSecure": true,
  "smtpHost": "smtp.empresa.com.br",
  "smtpPort": 587,
  "smtpSecure": false,
  "tlsVerify": false,
  "username": "vendas@empresa.com.br",
  "secret": "minha-senha-ou-app-password",
  "isDefault": true,
  "visibility": "SHARED",
  "signature": "<p>Atenciosamente,<br>Equipe de Vendas</p>"
}

// Response 201
{
  "account": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "address": "vendas@empresa.com.br",
    "displayName": "Vendas - Empresa Demo",
    "imapHost": "imap.empresa.com.br",
    "imapPort": 993,
    "imapSecure": true,
    "smtpHost": "smtp.empresa.com.br",
    "smtpPort": 587,
    "smtpSecure": false,
    "tlsVerify": false,
    "username": "vendas@empresa.com.br",
    "visibility": "SHARED",
    "isActive": true,
    "isDefault": true,
    "signature": "<p>Atenciosamente,<br>Equipe de Vendas</p>",
    "lastSyncAt": null,
    "teamId": null,
    "teamName": null,
    "createdAt": "2026-03-10T14:00:00.000Z",
    "updatedAt": "2026-03-10T14:00:00.000Z"
  }
}
```

#### GET /v1/email/messages

```
GET /v1/email/messages?accountId=550e8400-...&folderId=...&flagged=true&limit=20
GET /v1/email/messages?accountId=550e8400-...&cursor=eyJyZWNlaXZlZEF0IjoiMjAyNi0wMy0xMFQxNDowMDowMC4wMDBaIiwiaWQiOiI1NTBlODQwMC0uLi4ifQ==
```

```json
// Response 200
{
  "data": [
    {
      "id": "...",
      "accountId": "...",
      "folderId": "...",
      "messageId": "<abc123@mail.gmail.com>",
      "threadId": "<abc123@mail.gmail.com>",
      "subject": "Proposta comercial atualizada",
      "fromAddress": "cliente@parceiro.com",
      "fromName": "João Silva",
      "snippet": "Segue em anexo a proposta revisada conforme...",
      "receivedAt": "2026-03-10T14:00:00.000Z",
      "isRead": false,
      "isFlagged": true,
      "isAnswered": false,
      "hasAttachments": true
    }
  ],
  "meta": {
    "total": 342,
    "page": 1,
    "limit": 20,
    "pages": 18,
    "nextCursor": "eyJyZWNlaXZlZEF0IjoiMjAyNi0wMy0xMFQxMzowMDowMC4wMDBaIiwiaWQiOiI2NjZlODQwMC0uLi4ifQ=="
  }
}
```

#### POST /v1/email/messages/send (com anexos)

```
Content-Type: multipart/form-data

accountId: 550e8400-...
to: cliente@empresa.com
to: cc@empresa.com
subject: Contrato de prestação de serviços
bodyHtml: <p>Prezado cliente,</p><p>Segue em anexo o contrato...</p>
inReplyTo: <abc123@mail.gmail.com>
[file]: contrato.pdf (application/pdf)
```

```json
// Response 202
{ "messageId": "<unique-id@empresa.com.br>" }
```

#### GET /v1/email/messages/contacts/suggest

```
GET /v1/email/messages/contacts/suggest?q=joão&limit=5
```

```json
// Response 200
{
  "contacts": [
    { "email": "joao.silva@parceiro.com", "name": "João Silva", "frequency": 14 },
    { "email": "joao.costa@cliente.com.br", "name": null, "frequency": 3 }
  ]
}
```

---

## Business Rules

### Regra 1: Verificação de conexão obrigatória no cadastro

Ao cadastrar uma nova conta (e ao atualizá-la), o sistema valida a conectividade antes de persistir qualquer dado:

1. Resolução DNS dos hosts IMAP e SMTP com bloqueio de IPs privados/reservados (proteção SSRF)
2. Tentativa de login real no servidor IMAP com as credenciais fornecidas
3. Tentativa de autenticação real no servidor SMTP

Se qualquer uma das etapas falhar, a operação é abortada com `400 Bad Request` e uma mensagem de erro descritiva. O campo `tlsVerify` controla se certificados TLS auto-assinados são aceitos.

### Regra 2: Criptografia AES-256-GCM das credenciais

As senhas de acesso às contas de e-mail nunca são armazenadas em texto simples. O fluxo é:

1. A senha recebida no campo `secret` é cifrada via `CredentialCipherService.encrypt()` usando AES-256-GCM com IV aleatório de 12 bytes
2. O payload cifrado é serializado como JSON Base64: `{ v: 1, iv, tag, content }`
3. Apenas o campo `encryptedSecret` é persistido no banco
4. A resposta de leitura da conta **nunca inclui** `encryptedSecret` nem `secret`

**Rotação de chave:** o serviço suporta `EMAIL_CREDENTIALS_KEY_PREVIOUS`. Durante a sincronização, se a decriptação com a chave atual falhar, a chave anterior é tentada. Se bem-sucedido, o campo é re-criptografado automaticamente com a chave nova (`needsReEncrypt: true`).

### Regra 3: Controle de acesso por ownership e compartilhamento

Operações de leitura, envio e gerenciamento seguem a hierarquia:

- **Dono (`ownerUserId`):** acesso irrestrito a todas as operações
- **Usuário compartilhado:** acesso limitado pelas flags `canRead`, `canSend`, `canManage` da tabela `EmailAccountAccess`
- **Outros usuários:** sem acesso — retorna `403 Forbidden`

Contas com `visibility = 'SHARED'` aparecem para todos na listagem, mas operações específicas ainda exigem o registro em `EmailAccountAccess`.

### Regra 4: Sincronização incremental por UID

A sincronização IMAP é incremental e resiliente:

1. Para cada pasta, busca as mensagens com UID maior que `lastUid` (ou todas se `lastUid` é null)
2. Ao detectar mudança de `uidValidity`, a pasta é re-sincronizada completamente (reset do `lastUid`)
3. Em caso de falha por pasta, é aplicado backoff exponencial com até 3 tentativas (`MAX_FOLDER_RETRIES = 3`, `BASE_BACKOFF_MS = 1000ms`)
4. Falha em uma pasta não interrompe a sincronização das demais
5. Ao final, `lastSyncAt` da conta é atualizado

### Regra 5: Pool de conexões IMAP (singleton por processo)

O `ImapConnectionPool` é um singleton com as seguintes garantias:

- **Uma conexão por conta:** se a conexão está em uso, novos chamadores aguardam em fila FIFO
- **Timeout de aquisição:** 30 segundos (`ACQUIRE_TIMEOUT_MS`)
- **TTL de ociosidade:** 60 segundos (`DEFAULT_IDLE_TTL_MS`) — conexão fechada automaticamente após inatividade
- **Circuit breaker por host:** `opossum` protege servidores de e-mail instáveis de serem martelados
- **Reconexão automática:** conexões mortas são descartadas e recriadas na próxima aquisição
- **Graceful shutdown:** `destroyAll()` fecha todas as conexões antes do encerramento do processo

### Regra 6: Paginação cursor-based (keyset)

Para listas de mensagens de alto volume, o módulo implementa paginação por cursor baseada nos campos `receivedAt + id`:

- O cursor é um JSON codificado em Base64: `{ receivedAt: "ISO8601", id: "UUID" }`
- A query filtra por `(receivedAt, id) < (cursor.receivedAt, cursor.id)` para garantir estabilidade ao inserir novas mensagens
- Compatível com paginação por offset (`page`/`limit`) como fallback
- O campo `nextCursor` no response é `null` quando não há mais páginas

### Regra 7: Mensagens sinalizadas (IMAP `\\Flagged`)

A sinalização de mensagens é bidirecional entre o banco local e o servidor IMAP:

1. O use case busca a mensagem, valida acesso e obtém a pasta remota
2. Executa `messageFlagsAdd` ou `messageFlagsRemove` com `['\\Flagged']` via IMAP UID
3. Persiste o novo estado no campo `isFlagged` da mensagem local
4. Em caso de falha IMAP, a conexão é destruída do pool e erro `400` é retornado

O mesmo padrão é aplicado para `isRead` (flag IMAP `\\Seen`).

### Regra 8: Envio de e-mail e auditoria

Ao enviar um e-mail:

1. Valida ownership ou `canSend` na conta
2. Decripta a senha e chama `SmtpClientService.send()`
3. Fire-and-forget (não bloqueia o response):
   - Appenda a mensagem na pasta `SENT` do IMAP via `MailComposer + client.append()`
   - Marca a mensagem original como `isAnswered` se `inReplyTo` foi fornecido
4. Registra auditoria via `queueAuditLog` com ação `EMAIL_SEND`

**Proteção contra header injection:** o campo `subject` é validado para não conter `\r` ou `\n`.

### Regra 9: Autocomplete de contatos

O `SuggestEmailContactsUseCase` consulta o histórico de mensagens de todas as contas visíveis ao usuário usando `SQL UNION ALL` nos campos `from_address`, `to_addresses` e `cc_addresses`, ordenado pela frequência de aparição. Retorna no máximo 50 sugestões.

### Regra 10: Download de anexos sob demanda

Os binários dos anexos não são armazenados no banco. O download funciona assim:

1. Localiza o `EmailAttachment` pelo ID e valida o acesso do usuário
2. Busca o conteúdo diretamente do servidor IMAP via pool de conexões
3. Retorna o binário via `reply.raw.writeHead(200, headers)` com `Content-Disposition: attachment`
4. Registra auditoria via `queueAuditLog` com ação de download
5. Define `Access-Control-Allow-Origin` dinamicamente com base no header `Origin` da requisição (nunca usa `*`)

---

## Services

### CredentialCipherService

Localização: `src/services/email/credential-cipher.service.ts`

Responsável pela criptografia e decriptação das senhas de contas de e-mail.

```typescript
// Fluxo de criptografia
const cipher = new CredentialCipherService();
const encrypted = cipher.encrypt('minha-senha');
// payload: { v: 1, iv: "<base64>", tag: "<base64>", content: "<base64>" }
// armazenado como: Buffer.from(JSON.stringify(payload)).toString('base64')

// Decriptação com suporte a rotação de chave
const result = cipher.decryptWithRotation(encrypted);
// result.needsReEncrypt === true  → chave anterior foi usada, re-criptografar
// result.needsReEncrypt === false → chave atual foi usada
```

**Variáveis de ambiente obrigatórias:**
- `EMAIL_CREDENTIALS_KEY` — chave AES-256 (32 chars raw ou base64 de 32 bytes)
- `EMAIL_CREDENTIALS_KEY_PREVIOUS` — chave anterior para rotação sem downtime (opcional)

### ImapConnectionPool

Localização: `src/services/email/imap-connection-pool.ts`

Pool singleton de conexões IMAP usando `imapflow`. Utilizado por `SyncEmailAccountUseCase`, `ToggleEmailMessageFlagUseCase`, `MarkEmailMessageReadUseCase`, `MoveEmailMessageUseCase`, `DeleteEmailMessageUseCase`, `SendEmailMessageUseCase` e `DownloadEmailAttachmentUseCase`.

```typescript
// Padrão de uso nos use cases
const pool = getImapConnectionPool();
const client = await pool.acquire(accountId, config);
try {
  const lock = await client.getMailboxLock(folder.remoteName);
  try {
    await client.messageFlagsAdd(uid, ['\\Flagged'], { uid: true });
  } finally {
    lock.release();
  }
} catch {
  pool.destroy(accountId); // remove conexão corrompida
  throw error;
} finally {
  pool.release(accountId); // retorna ao pool (ou fecha após TTL)
}
```

### HtmlSanitizerService

Localização: `src/services/email/html-sanitizer.service.ts`

Higieniza o corpo HTML das mensagens recebidas antes de persistir, prevenindo XSS. Aplicado durante a sincronização de mensagens no `SyncEmailFolderUseCase`.

---

## BullMQ Queues

### EMAIL_SYNC — Sincronização periódica

**Arquivo:** `src/workers/queues/email-sync.queue.ts`

```typescript
export interface EmailSyncJobData {
  tenantId: string;
  accountId: string;
}
```

**Worker:**
- Concorrência: `2` workers simultâneos
- Rate limiter: `5 jobs/segundo`
- Em caso de falha, o job relança o erro para o mecanismo de retry do BullMQ

**Inicialização lazy:** a fila Redis só é criada na primeira chamada a `queueEmailSync()`, evitando conexão Redis no boot da aplicação.

**Fallback inline:** quando `DISABLE_INLINE_WORKERS=true` ou o Redis está indisponível, a sincronização é executada inline no mesmo processo com throttle de 30 segundos por conta.

### Email Sync Scheduler

**Arquivo:** `src/workers/email-sync-scheduler.ts`

Executado no container Docker worker (`Dockerfile.worker`), o scheduler:

1. Percorre todas as contas ativas agrupadas por tenant
2. Enfileira um job com `jobId = email-sync-{accountId}` fixo
3. Ignora contas cujo job já está nos estados `active`, `waiting` ou `delayed`
4. Remove jobs `completed` ou `failed` antes de re-enfileirar
5. Repete a cada 5 minutos (`INTERVAL_MS = 300_000ms`)
6. Auto-para após 5 erros consecutivos (`MAX_CONSECUTIVE_ERRORS`)

**Isolamento multi-tenant:** a iteração é feita primeiro por `tenantId` para garantir isolamento.

---

## Permissions

| Code | Description | Scope |
|------|-------------|-------|
| `email.accounts.create` | Cadastrar nova conta de e-mail | Por tenant |
| `email.accounts.read` | Visualizar detalhes de uma conta | Por tenant |
| `email.accounts.update` | Atualizar configurações de uma conta | Por tenant (owner/canManage) |
| `email.accounts.delete` | Excluir conta de e-mail | Por tenant (owner) |
| `email.accounts.list` | Listar contas visíveis ao usuário | Por tenant |
| `email.accounts.share` | Compartilhar/remover acesso a uma conta | Por tenant (owner/canManage) |
| `email.messages.read` | Ler mensagens, pastas, contatos, anexos | Por conta (owner/canRead) |
| `email.messages.list` | Listar mensagens e caixa unificada | Por conta (owner/canRead) |
| `email.messages.send` | Enviar e-mails e salvar rascunhos | Por conta (owner/canSend) |
| `email.messages.update` | Marcar lida, sinalizar, mover mensagens | Por conta (owner/canRead) |
| `email.messages.delete` | Excluir mensagens | Por conta (owner/canRead) |
| `email.sync.execute` | Acionar sincronização manual | Por tenant |

**Total: 12 códigos de permissão** (`PermissionCodes.EMAIL.*`).

---

## Data Model

Trecho do `prisma/schema.prisma` (módulo EMAIL):

```prisma
enum EmailAccountVisibility {
  PRIVATE
  SHARED
  @@map("email_account_visibility")
}

enum EmailFolderType {
  INBOX | SENT | DRAFTS | TRASH | SPAM | CUSTOM
  @@map("email_folder_type")
}

model EmailAccount {
  id              String                 @id @default(uuid())
  tenantId        String                 @map("tenant_id")
  ownerUserId     String                 @map("owner_user_id")
  address         String                 @db.VarChar(256)
  imapHost        String                 @map("imap_host")  @db.VarChar(256)
  imapPort        Int                    @map("imap_port")
  imapSecure      Boolean                @default(true)  @map("imap_secure")
  smtpHost        String                 @map("smtp_host") @db.VarChar(256)
  smtpPort        Int                    @map("smtp_port")
  smtpSecure      Boolean                @default(true)  @map("smtp_secure")
  tlsVerify       Boolean                @default(false) @map("tls_verify")
  username        String                 @db.VarChar(256)
  encryptedSecret String                 @map("encrypted_secret") @db.Text
  visibility      EmailAccountVisibility @default(PRIVATE)
  isActive        Boolean                @default(true)  @map("is_active")
  isDefault       Boolean                @default(false) @map("is_default")
  signature       String?                @db.Text
  lastSyncAt      DateTime?              @map("last_sync_at")

  @@unique([tenantId, address])
  @@index([tenantId])
  @@index([ownerUserId])
  @@index([tenantId, isActive])
  @@map("email_accounts")
}

model EmailMessage {
  -- (campos principais omitidos para brevidade)
  @@unique([accountId, folderId, remoteUid])
  @@index([tenantId])
  @@index([accountId])
  @@index([folderId])
  @@index([tenantId, isRead])
  @@index([tenantId, receivedAt(sort: Desc)])    -- usado pelo cursor
  @@index([deletedAt])
  @@index([accountId, messageId])                -- lookup de threading
  @@index([accountId, threadId])                 -- lookup de thread
  @@index([accountId, folderId, receivedAt(sort: Desc)])  -- listagem com filtro de pasta
  @@map("email_messages")
}
```

**Índices críticos para performance:**
- `[tenantId, receivedAt(sort: Desc)]` — listagem geral de mensagens com cursor
- `[accountId, folderId, receivedAt(sort: Desc)]` — listagem por pasta com cursor
- `[accountId, messageId]` — resolução de threading (`In-Reply-To`)
- `[accountId, threadId]` — agrupamento de thread

---

## Use Cases

### Contas (`src/use-cases/email/accounts/`)

| Use Case | Arquivo | Descrição |
|----------|---------|-----------|
| `CreateEmailAccountUseCase` | `create-email-account.ts` | Valida hosts (SSRF), testa IMAP/SMTP, cifra senha, persiste conta |
| `GetEmailAccountUseCase` | `get-email-account.ts` | Busca conta com validação de acesso |
| `ListEmailAccountsUseCase` | `list-email-accounts.ts` | Lista contas owned + shared com canRead |
| `UpdateEmailAccountUseCase` | `update-email-account.ts` | Atualiza configurações, re-testa conexão se host/porta alterados |
| `DeleteEmailAccountUseCase` | `delete-email-account.ts` | Remove conta (cascade deleta pastas, mensagens e anexos) |
| `TestEmailConnectionUseCase` | `test-email-connection.ts` | Testa conectividade sem persistir |
| `ShareEmailAccountUseCase` | `share-email-account.ts` | Cria/atualiza `EmailAccountAccess`; registra auditoria |
| `UnshareEmailAccountUseCase` | `unshare-email-account.ts` | Remove `EmailAccountAccess`; registra auditoria |

### Mensagens (`src/use-cases/email/messages/`)

| Use Case | Arquivo | Descrição |
|----------|---------|-----------|
| `ListEmailMessagesUseCase` | `list-email-messages.ts` | Lista mensagens de uma conta/pasta com filtros e cursor |
| `ListCentralInboxUseCase` | `list-central-inbox.ts` | Caixa unificada de múltiplas contas (máx. 20) |
| `GetEmailMessageUseCase` | `get-email-message.ts` | Busca mensagem com anexos incluídos |
| `ListThreadMessagesUseCase` | `list-thread-messages.ts` | Agrupa mensagens pelo mesmo `threadId` |
| `SendEmailMessageUseCase` | `send-email-message.ts` | Envia e-mail SMTP, appenda na pasta Sent, registra auditoria |
| `SaveEmailDraftUseCase` | `save-email-draft.ts` | Appenda rascunho na pasta Drafts IMAP |
| `MarkEmailMessageReadUseCase` | `mark-email-message-read.ts` | Atualiza flag IMAP `\\Seen` + campo local `isRead` |
| `ToggleEmailMessageFlagUseCase` | `toggle-email-message-flag.ts` | Atualiza flag IMAP `\\Flagged` + campo local `isFlagged` |
| `MoveEmailMessageUseCase` | `move-email-message.ts` | Move mensagem para outra pasta IMAP + atualiza `folderId` |
| `DeleteEmailMessageUseCase` | `delete-email-message.ts` | Soft delete local + move para Trash no IMAP |
| `DownloadEmailAttachmentUseCase` | `download-email-attachment.ts` | Busca binário do anexo no IMAP sob demanda |
| `SuggestEmailContactsUseCase` | `suggest-email-contacts.ts` | Autocomplete de contatos via SQL UNION ALL |

### Sincronização (`src/use-cases/email/sync/`)

| Use Case | Arquivo | Descrição |
|----------|---------|-----------|
| `SyncEmailAccountUseCase` | `sync-email-account.ts` | Sincroniza todas as pastas de uma conta; suporta rotação de chave |
| `SyncEmailFolderUseCase` | `sync-email-folder.ts` | Sincroniza uma pasta específica (incremental por UID) |

### Pastas (`src/use-cases/email/folders/`)

| Use Case | Arquivo | Descrição |
|----------|---------|-----------|
| `ListEmailFoldersUseCase` | `list-email-folders.ts` | Lista pastas de uma conta com contadores de mensagens |

---

## Tests

- **Testes unitários:** 23 arquivos, 153 testes (todos passando)
  - `src/use-cases/email/accounts/create-email-account.spec.ts`
  - `src/use-cases/email/accounts/update-email-account.spec.ts`
  - `src/use-cases/email/accounts/list-email-accounts.spec.ts`
  - `src/use-cases/email/accounts/get-email-account.spec.ts`
  - `src/use-cases/email/accounts/share-email-account.spec.ts`
  - `src/use-cases/email/accounts/unshare-email-account.spec.ts`
  - `src/use-cases/email/accounts/test-email-connection.spec.ts`
  - `src/use-cases/email/accounts/delete-email-account.spec.ts`
  - `src/use-cases/email/folders/list-email-folders.spec.ts`
  - `src/use-cases/email/messages/list-email-messages.spec.ts`
  - `src/use-cases/email/messages/get-email-message.spec.ts`
  - `src/use-cases/email/messages/list-thread-messages.spec.ts`
  - `src/use-cases/email/messages/send-email-message.spec.ts`
  - `src/use-cases/email/messages/save-email-draft.spec.ts`
  - `src/use-cases/email/messages/mark-email-message-read.spec.ts`
  - `src/use-cases/email/messages/toggle-email-message-flag.spec.ts`
  - `src/use-cases/email/messages/move-email-message.spec.ts`
  - `src/use-cases/email/messages/delete-email-message.spec.ts`
  - `src/use-cases/email/messages/download-email-attachment.spec.ts`
  - `src/use-cases/email/messages/suggest-email-contacts.spec.ts`
  - `src/use-cases/email/sync/sync-email-account.spec.ts`
  - `src/use-cases/email/sync/sync-email-folder.spec.ts`
  - `src/services/email/imap-connection-pool.spec.ts`
  - `src/services/email/credential-cipher.service.spec.ts`

- **Testes E2E:** 3 arquivos, 91+ testes
  - `src/http/controllers/email/accounts/v1-email-accounts.e2e.spec.ts`
  - `src/http/controllers/email/messages/v1-email-messages.e2e.spec.ts`
  - `src/http/controllers/email/folders/v1-email-folders.e2e.spec.ts`

- **Testes de isolamento multi-tenant:** 1 arquivo, 15 testes
  - `src/http/controllers/email/v1-email-multi-tenant-isolation.e2e.spec.ts`

**Cenários críticos cobertos:**
- Bloqueio de host IMAP/SMTP apontando para IPs privados (SSRF)
- Rotação de chave de criptografia (`needsReEncrypt`)
- Sincronização incremental (respeitando `lastUid` e `uidValidity`)
- Backoff exponencial em falhas de pasta
- Paginação cursor-based (estabilidade ao inserir mensagens novas durante paginação)
- Isolamento multi-tenant (conta de tenant A não visível para tenant B)
- Compartilhamento granular (`canRead`, `canSend`, `canManage`)
- Header injection no campo subject
- Download de anexo com CORS dinâmico

---

## Audit History

| Date | Dimension | Score | Report |
|------|-----------|-------|--------|
| 2026-03-10 | Auditoria completa do módulo | ✅ 27/27 itens resolvidos | `central-implementation/email/email-audit-report.md` |

**Itens implementados na auditoria (Mar 2026):**
- Campo `tlsVerify` por conta (23 arquivos alterados, retrocompatível com padrão `false`)
- Paginação cursor-based (keyset em `receivedAt + id`, Base64 encoded)
- Autocomplete de contatos (`suggestContacts` com SQL UNION ALL em `from/to/cc`)
- Mensagens sinalizadas/com estrela (sync IMAP `\\Flagged` + filtro `isFlagged`)
- Registro de auditoria em `share`, `unshare`, `send`, download de anexo
- Memoização do editor TipTap no frontend (`useMemo` em extensions/editorProps)
- Factory de dados de teste: `src/utils/tests/factories/email/create-email-test-data.ts`
- 15 testes E2E de isolamento multi-tenant
- Pool de conexões IMAP (`imap-connection-pool.ts`) — singleton com mutex, TTL 60s e graceful shutdown
