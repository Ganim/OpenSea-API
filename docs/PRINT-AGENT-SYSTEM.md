# Print Agent System

## Overview

O sistema de impressão remota (Print Agent System) permite que usuários em dispositivos móveis ou qualquer navegador enviem trabalhos de impressão para impressoras físicas conectadas a computadores no estoque ou balcão. A comunicação em tempo real é feita via WebSocket (Socket.io), e a autenticação do agente desktop utiliza um mecanismo similar ao TOTP para pareamento seguro sem necessidade de configuração manual de rede.

Este sistema abrange três projetos:

| Projeto | Papel |
|---------|-------|
| `OpenSea-API` | Servidor WebSocket, armazenamento de jobs, autenticação, emissão de eventos |
| `OpenSea-Agent` | Aplicativo desktop (Node.js/.exe) instalado no computador do estoque |
| `OpenSea-APP` | Interface web para gerenciar agentes, selecionar impressoras e acompanhar jobs |

---

## Architecture Overview

```
+-----------------------------------------------+
|              FLUXO DE IMPRESSAO               |
+-----------------------------------------------+

  Navegador (Mobile/Desktop)
        |
        |  1. POST /v1/sales/print-jobs  (PDF em base64)
        v
  +------------------+
  |   OpenSea-API    |   <---  Socket.io Server
  |  (Fastify)       |         autenticacao dual:
  |                  |         - JWT (browsers)
  |  PrintJob salvo  |         - deviceToken SHA256 (agents)
  +--------+---------+
           |
           |  2. emit 'job:new'  (via Socket.io room do agente)
           v
  +------------------+
  |  OpenSea-Agent   |   (Windows - computador do estoque)
  |  (Node.js/.exe)  |
  |                  |
  |  3. Decodifica   |
  |     PDF base64   |
  |  4. Imprime via  |
  |     pdf-to-      |
  |     printer      |
  +--------+---------+
           |
           |  5. emit 'agent:job:status'  (PRINTING / SUCCESS / FAILED)
           v
  +------------------+
  |   OpenSea-API    |
  |                  |
  |  6. Atualiza     |
  |     PrintJob     |
  |  7. emit         |
  |     'job:update' |
  |     para browser |
  +------------------+
           |
           v
  Navegador exibe status em tempo real
  (Na fila -> Imprimindo -> Concluido)

  +---------------------+
  |  Impressora Local   |  (USB conectada ao computador do estoque)
  |  (fisicamente)      |
  +---------------------+
```

---

## Database Models

### PrintAgent

Representa um computador registrado como agente de impressão. Um agente pode gerenciar múltiplas impressoras locais.

```prisma
model PrintAgent {
  id              String      @id @default(cuid())
  tenantId        String      @map("tenant_id")
  name            String      @db.VarChar(128)
  pairingSecret   String      @map("pairing_secret")    @db.VarChar(64)
  deviceTokenHash String?     @unique @map("device_token_hash") @db.VarChar(128)
  deviceLabel     String?     @map("device_label")      @db.VarChar(128)
  pairedAt        DateTime?   @map("paired_at")
  pairedByUserId  String?     @map("paired_by_user_id")
  revokedAt       DateTime?   @map("revoked_at")
  status          AgentStatus @default(OFFLINE)
  lastSeenAt      DateTime?   @map("last_seen_at")
  ipAddress       String?     @map("ip_address")        @db.VarChar(45)
  hostname        String?     @db.VarChar(128)
  osInfo          Json?       @map("os_info")
  version         String?     @db.VarChar(20)
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime?   @updatedAt @map("updated_at")
  deletedAt       DateTime?   @map("deleted_at")

  tenant   Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  printers PosPrinter[]

  @@index([tenantId])
  @@index([deviceTokenHash])
  @@map("print_agents")
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `String` (CUID) | Identificador único |
| `tenantId` | `String` | Tenant ao qual o agente pertence |
| `name` | `String` (128) | Nome descritivo, ex: "Computador do Estoque" |
| `pairingSecret` | `String` (64) | 32 bytes aleatórios em hex, usado para gerar o código TOTP de pareamento |
| `deviceTokenHash` | `String?` (128, unique) | SHA-256 do token do dispositivo; `null` = não pareado |
| `deviceLabel` | `String?` (128) | Hostname do computador, preenchido no pareamento |
| `pairedAt` | `DateTime?` | Momento do pareamento bem-sucedido |
| `pairedByUserId` | `String?` | ID do usuário que iniciou o registro (referência informativa) |
| `revokedAt` | `DateTime?` | Preenchido ao desparear; invalida o token imediatamente |
| `status` | `AgentStatus` | `ONLINE`, `OFFLINE` ou `ERROR` |
| `lastSeenAt` | `DateTime?` | Último heartbeat recebido |
| `ipAddress` | `String?` | IP de origem da conexão WebSocket |
| `hostname` | `String?` | Hostname reportado pelo agente no registro |
| `osInfo` | `Json?` | `{ platform, arch, version, nodeVersion }` |
| `version` | `String?` | Versão do executável do agente |
| `deletedAt` | `DateTime?` | Soft delete |

**Enums relacionados:**

```prisma
enum AgentStatus {
  ONLINE
  OFFLINE
  ERROR
}
```

### PosPrinter (campos expandidos)

O modelo `PosPrinter` foi expandido para suportar a integração com agentes remotos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `status` | `PrinterStatus` | `ONLINE`, `OFFLINE`, `BUSY`, `ERROR`, `UNKNOWN` |
| `lastSeenAt` | `DateTime?` | Última vez que o agente reportou esta impressora |
| `agentId` | `String?` (FK) | Agente responsável por esta impressora |
| `osName` | `String?` | Nome da impressora no sistema operacional (usado para envio ao `pdf-to-printer`) |

```prisma
enum PrinterStatus {
  ONLINE
  OFFLINE
  BUSY
  ERROR
  UNKNOWN
}
```

### PrintJob (campos expandidos)

O modelo `PrintJob` recebeu campos adicionais para suporte ao roteamento via agente:

```prisma
model PrintJob {
  -- campos existentes --
  agentId     String?   @map("agent_id")
  copies      Int       @default(1)
  printerName String?   @map("printer_name") @db.VarChar(255)
  labelData   Json?     @map("label_data")
  startedAt   DateTime? @map("started_at")

  @@index([tenantId, status])
  @@index([printerId])
  @@map("print_jobs")
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `agentId` | `String?` | ID do agente que deve processar o job |
| `copies` | `Int` | Número de cópias (padrão: 1) |
| `printerName` | `String?` | Nome da impressora no OS, resolvido no momento da criação |
| `labelData` | `Json?` | Dados brutos da etiqueta para referência futura |
| `startedAt` | `DateTime?` | Momento em que o agente começou a imprimir |

**Enums:**

```prisma
enum PrintJobStatus {
  CREATED
  QUEUED
  PRINTING
  SUCCESS
  FAILED
  CANCELLED
}

enum PrintJobType {
  RECEIPT
  LABEL
  REPORT
  DOCUMENT
}
```

---

## HTTP Endpoints

Todos os endpoints de impressão remota pertencem ao módulo `SALES`.

### Print Agents

| Método | Caminho | Permissão | Descrição |
|--------|---------|-----------|-----------|
| `POST` | `/v1/sales/print-agents` | `sales.printing.admin` | Registra um novo agente |
| `GET` | `/v1/sales/print-agents` | `sales.printing.access` | Lista agentes do tenant com status e contagem de impressoras |
| `DELETE` | `/v1/sales/print-agents/:id` | `sales.printing.admin` | Remove um agente (soft delete) |
| `GET` | `/v1/sales/print-agents/:id/pairing-code` | `sales.printing.admin` | Retorna o código TOTP atual de 6 caracteres |
| `POST` | `/v1/sales/print-agents/pair` | **Público** (sem JWT) | Pareia um dispositivo usando o código de 6 dígitos |
| `POST` | `/v1/sales/print-agents/:id/unpair` | `sales.printing.admin` | Revoga o token do dispositivo pareado |

### Print Jobs

| Método | Caminho | Permissão | Descrição |
|--------|---------|-----------|-----------|
| `POST` | `/v1/sales/print-jobs` | `sales.printing.print` | Cria um job de impressão de etiqueta |
| `GET` | `/v1/sales/print-jobs` | `sales.printing.access` | Lista jobs com filtros opcionais |
| `POST` | `/v1/sales/print-jobs/:id/retry` | `sales.printing.print` | Recria um job que falhou |

**Nota sobre o endpoint `pair`:** este é o único endpoint público do sistema. A autenticação é feita pelo próprio código de pareamento TOTP, que tem janela de 120 segundos e é globalmente único por design (32 bytes aleatórios de secret por agente).

### Exemplos de Request/Response

**Registrar agente:**
```http
POST /v1/sales/print-agents
Content-Type: application/json
Authorization: Bearer <token>
X-Tenant-ID: <tenantId>

{ "name": "Computador do Estoque" }

HTTP/1.1 201 Created
{ "agentId": "clx1abc..." }
```

**Obter código de pareamento:**
```http
GET /v1/sales/print-agents/clx1abc.../pairing-code
Authorization: Bearer <token>

HTTP/1.1 200 OK
{
  "code": "A3F7KR",
  "expiresAt": "2026-04-10T14:35:00.000Z"
}
```

**Parear dispositivo (chamado pelo agente desktop):**
```http
POST /v1/sales/print-agents/pair
Content-Type: application/json

{
  "pairingCode": "A3F7KR",
  "hostname": "DESKTOP-ESTOQUE01"
}

HTTP/1.1 200 OK
{
  "deviceToken": "a1b2c3...64chars...",
  "agentId": "clx1abc...",
  "agentName": "Computador do Estoque"
}
```

**Criar job de impressão:**
```http
POST /v1/sales/print-jobs
Content-Type: application/json
Authorization: Bearer <token>

{
  "printerId": "clxprinter...",
  "content": "<base64-encoded-pdf>",
  "copies": 2
}

HTTP/1.1 201 Created
{ "jobId": "clxjob...", "status": "queued" }
```

---

## Permissions

| Código | Descrição | Usado em |
|--------|-----------|----------|
| `sales.printing.access` | Visualizar agentes e jobs | `GET /print-agents`, `GET /print-jobs` |
| `sales.printing.print` | Enviar trabalhos de impressão | `POST /print-jobs`, `POST /print-jobs/:id/retry` |
| `sales.printing.admin` | Gerenciar agentes (registrar, parear, excluir) | `POST /print-agents`, `DELETE`, `GET /pairing-code`, `POST /unpair` |

---

## WebSocket Gateway

O servidor Socket.io é inicializado junto com o servidor HTTP do Fastify, compartilhando a mesma porta (3333).

### Inicialização

```typescript
// src/lib/websocket/socket-server.ts
export function initializeSocketServer(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: [process.env.FRONTEND_URL, 'http://localhost:3000'], credentials: true },
    pingInterval: 25_000,
    pingTimeout: 10_000,
  });

  io.use(authenticateSocket);  // autenticacao dual

  io.on('connection', (socket) => {
    // Rooms por tenant e tipo
    socket.join(`tenant:${tenantId}`);
    socket.join(`tenant:${tenantId}:agents`  /* ou :browsers */);

    // Agentes tambem entram na sala individual
    if (type === 'agent') socket.join(`agent:${agentId}`);
  });
}
```

### Autenticação Dual

O middleware `authenticateSocket` aceita dois tipos de credenciais no handshake:

```typescript
// Agente desktop:
io(apiUrl, { auth: { deviceToken: "64-char-hex-token" } })

// Browser (usuario logado):
io(apiUrl, { auth: { token: "eyJ..." /* JWT do tenant */ } })
```

**Fluxo para agentes:** o `deviceToken` é hasheado com SHA-256 e comparado com `deviceTokenHash` no banco. O registro é buscado verificando `deletedAt: null` e `revokedAt: null`. Se encontrado, o socket recebe `SocketData { type: 'agent', tenantId, agentId }`.

**Fluxo para browsers:** o JWT é verificado com `jwt.verify()` usando `issuer: 'opensea-api'` e `audience: 'opensea-client'`. O token deve conter `tenantId`, caso contrário a conexão é rejeitada.

### Socket Rooms

| Room | Quem entra | Usado para |
|------|------------|-----------|
| `tenant:{tenantId}` | Todos (agents + browsers) | Eventos gerais do tenant |
| `tenant:{tenantId}:agents` | Apenas agentes | Reservado para broadcasts futuros |
| `tenant:{tenantId}:browsers` | Apenas browsers | Receber atualizações de status |
| `agent:{agentId}` | Apenas o agente específico | Receber jobs direcionados |

### Protocolo de Eventos

```
Agente  -->  Servidor
  'agent:register'    Enviado ao conectar, com lista de impressoras e info do SO
  'agent:heartbeat'   Enviado a cada 30s com lista atualizada de impressoras
  'agent:job:status'  Reporta mudança de status de um job (PRINTING / SUCCESS / FAILED)

Servidor  -->  Agente
  'job:new'     Novo trabalho de impressão para o agente executar
  'job:cancel'  Solicita cancelamento de um job em andamento

Servidor  -->  Browser
  'printer:status'   Status atualizado de uma impressora (ao receber heartbeat ou disconnect)
  'job:update'       Atualização de status de um job (espelhado do agente)
```

### Payloads Completos

```typescript
// Agente -> Servidor: registro inicial
interface AgentRegisterPayload {
  hostname: string;
  os: { platform: string; arch: string; version: string; nodeVersion: string };
  agentVersion: string;
  printers: AgentPrinterInfo[];
}

interface AgentPrinterInfo {
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  isDefault: boolean;
  portName?: string;
  driverName?: string;
}

// Agente -> Servidor: status de job
interface AgentJobStatusPayload {
  jobId: string;
  status: 'PRINTING' | 'SUCCESS' | 'FAILED';
  error?: string;
}

// Servidor -> Agente: novo job
interface JobNewPayload {
  jobId: string;
  type: 'LABEL' | 'RECEIPT' | 'DOCUMENT';
  content: string;       // PDF em base64
  printerName: string;   // nome da impressora no OS
  copies: number;
}

// Servidor -> Browser: status da impressora
interface PrinterStatusPayload {
  printerId: string;
  printerName: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'ERROR';
  agentName: string;
  agentId: string;
  lastSeenAt: string | null;
}

// Servidor -> Browser: atualização de job
interface JobUpdatePayload {
  jobId: string;
  status: 'QUEUED' | 'PRINTING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  completedAt?: string;
  error?: string;
}
```

### Sincronização de Impressoras

A cada `agent:register` e `agent:heartbeat`, o servidor executa `syncPrintersFromPayload()`, que:

1. Para cada impressora reportada pelo agente: cria o registro `PosPrinter` se não existir (com `type: 'LABEL'`, `connection: 'USB'`), ou atualiza `status` e `lastSeenAt`.
2. Impressoras conhecidas que **não** estão na lista reportada são marcadas como `OFFLINE`.
3. Emite `printer:status` para todos os browsers do tenant com os estados atualizados.

Ao receber `disconnect`, o agente e todas as suas impressoras são marcados `OFFLINE` imediatamente.

### Heartbeat Checker

Um processo periódico (`startHeartbeatChecker`) roda a cada 30 segundos e marca como `OFFLINE` todos os agentes com `status: 'ONLINE'` cujo `lastSeenAt` seja anterior a 90 segundos atrás. Isso garante que agentes que desconectaram abruptamente (sem emitir `disconnect`) sejam detectados dentro de 90 segundos.

```
Intervalo de verificacao: 30s
Limiar de inatividade: 90s
Acao: PrintAgent.status = OFFLINE + PosPrinter.status = OFFLINE + emit 'printer:status'
```

---

## Pairing Flow (TOTP-like)

O mecanismo de pareamento foi construído sobre a mesma biblioteca `pos-pairing-code.ts` usada pelos terminais POS.

### Algoritmo

1. Ao registrar um agente, o sistema gera `pairingSecret = randomBytes(32).toString('hex')` (64 chars hex = 32 bytes).
2. O código é derivado por: `HMAC-SHA256(secret, timeBucket)` onde `timeBucket = Math.floor(Date.now() / 60_000)`.
3. Os primeiros 6 caracteres do hash codificado em base36 são usados como código (alfanumérico uppercase).
4. O código expira em 60 segundos, mas a validação aceita o bucket atual e o anterior (janela de 120s).
5. O código é globalmente único: com 32 bytes de entropia por agente, a probabilidade de colisão é negligenciável.

### Fluxo Completo

```
1. Operador no browser:
   - Cria agente (POST /v1/sales/print-agents) -> recebe agentId
   - Solicita codigo (GET /v1/sales/print-agents/:id/pairing-code) -> recebe { code: "A3F7KR", expiresAt }
   - Interface exibe codigo com contagem regressiva
   - Codigo e renovado automaticamente a cada 55s pelo frontend (antes de expirar)

2. Tecnico no computador do estoque:
   - Executa opensea-print-agent.exe (primeira vez sem device-token.json)
   - Programa solicita interativamente: "Digite o codigo de pareamento:"
   - Tecnico digita o codigo de 6 caracteres

3. Agente faz POST /v1/sales/print-agents/pair { pairingCode, hostname }

4. Servidor:
   - Busca todos os agentes nao-pareados em todos os tenants
   - Valida o codigo contra cada pairingSecret (aceita bucket atual e anterior)
   - Se valido: gera deviceToken = randomBytes(32).toString('hex')
   - Armazena apenas deviceTokenHash = SHA256(deviceToken) no banco
   - Retorna { deviceToken, agentId, agentName }

5. Agente:
   - Salva deviceToken em device-token.json (plain text, nunca enviado ao servidor apos isso)
   - Nas proximas execucoes, carrega device-token.json e conecta diretamente
```

### Segurança

- O `deviceToken` nunca e armazenado no servidor (apenas o hash SHA-256).
- O pareamento pode ser revogado a qualquer momento via `POST /v1/sales/print-agents/:id/unpair`, que define `revokedAt` e invalida imediatamente o token.
- O campo `deviceTokenHash` tem constraint `UNIQUE` no banco, impedindo dois dispositivos de usar o mesmo token.

---

## Fluxo Completo de Impressão de Etiquetas

```
1. Usuario adiciona itens a fila de impressao (funcionalidade existente)

2. Usuario seleciona template de etiqueta (funcionalidade existente)

3. Usuario escolhe "Enviar para impressora remota" no PrintQueueModal
   - Aparece secao "Destino da Impressao"
   - Lista de impressoras remotas com status em tempo real

4. Usuario seleciona uma impressora e confirma

5. Frontend:
   - Gera PDF via jsPDF (funcionalidade existente)
   - Converte PDF para base64
   - Chama POST /v1/sales/print-jobs { printerId, content (base64), copies }

6. API:
   - Valida tamanho do conteudo (max 10MB)
   - Busca a impressora, resolve printerName = printer.osName ?? printer.name
   - Cria PrintJob com status QUEUED e agentId da impressora
   - Emite 'job:new' para a sala 'agent:{agentId}' via Socket.io

7. Agente:
   - Recebe 'job:new' com { jobId, type, content, printerName, copies }
   - Emite 'agent:job:status' { jobId, status: 'PRINTING' }
   - Decodifica base64 para arquivo PDF temporario em ./temp/job-{id}.pdf
   - Chama pdf-to-printer com { printer: printerName, copies }
   - Remove arquivo temporario
   - Emite 'agent:job:status' { jobId, status: 'SUCCESS' } ou { status: 'FAILED', error }

8. API:
   - Recebe 'agent:job:status', atualiza PrintJob no banco
   - Para PRINTING: define startedAt
   - Para SUCCESS/FAILED: define completedAt + errorMessage
   - Emite 'job:update' para 'tenant:{tenantId}:browsers'

9. Browser:
   - Hook usePrintJobTracker recebe 'job:update'
   - Componente PrintJobTracker atualiza status em tempo real
   - Jobs concluidos sao removidos automaticamente apos 10 segundos
```

**Retry:** ao retentar um job falho (`POST /print-jobs/:id/retry`), um **novo** `PrintJob` e criado com os mesmos dados do job original. Somente jobs com `status: 'FAILED'` podem ser retentados.

---

## Use Cases (OpenSea-API)

### Print Agents

| Use Case | Arquivo | Descrição |
|----------|---------|-----------|
| `RegisterPrintAgentUseCase` | `register-print-agent.use-case.ts` | Cria agente com `pairingSecret` gerado automaticamente |
| `ListPrintAgentsUseCase` | `list-print-agents.use-case.ts` | Lista agentes com contagem de impressoras por tenant |
| `DeletePrintAgentUseCase` | `delete-print-agent.use-case.ts` | Soft delete do agente |
| `GetAgentPairingCodeUseCase` | `get-agent-pairing-code.use-case.ts` | Retorna código TOTP atual e `expiresAt` |
| `PairPrintAgentUseCase` | `pair-print-agent.use-case.ts` | Valida código, gera `deviceToken`, persiste hash |
| `UnpairPrintAgentUseCase` | `unpair-print-agent.use-case.ts` | Define `revokedAt`, invalida token |

### Printing

| Use Case | Arquivo | Descrição |
|----------|---------|-----------|
| `CreateLabelPrintJobUseCase` | `create-label-print-job.use-case.ts` | Cria job LABEL, valida tamanho (max 10MB), resolve `printerName` |
| `ListPrintJobsUseCase` | `list-print-jobs.use-case.ts` | Lista jobs com filtros (status, printerId, paginação) |
| `RetryPrintJobUseCase` | `retry-print-job.use-case.ts` | Clona job FAILED como novo job QUEUED |
| `SyncAgentPrintersUseCase` | `sync-agent-printers.use-case.ts` | Sincroniza lista de impressoras a partir do heartbeat |
| `MarkAgentOfflineUseCase` | `mark-agent-offline.use-case.ts` | Marca agentes sem heartbeat recente como OFFLINE |

---

## OpenSea-Agent (Aplicativo Desktop)

Aplicativo Node.js standalone empacotado como `.exe` via `@yao-pkg/pkg`. Desenvolvido para Windows (descoberta de impressoras via `wmic`).

### Estrutura de Arquivos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/index.ts` | Ponto de entrada; orquestra config, pairing, socket, heartbeat e graceful shutdown |
| `src/config.ts` | Carrega e persiste `config.json`; cria o arquivo com valores padrão se não existir |
| `src/pairing.ts` | Gerencia `device-token.json`; executa fluxo interativo de pareamento na primeira execução |
| `src/socket-client.ts` | Conecta ao servidor Socket.io, registra handlers para `job:new` e `job:cancel`, reporta status |
| `src/printer-discovery.ts` | Descobre impressoras locais via `wmic printer get ...`; retorna lista de `AgentPrinterInfo` |
| `src/print-executor.ts` | Decodifica PDF base64 para arquivo temporário e envia à impressora via `pdf-to-printer` |
| `src/heartbeat.ts` | Emite `agent:heartbeat` a cada `heartbeatIntervalMs` (padrão: 30s) |
| `src/logger.ts` | Winston com rotação de logs (max 5MB, 3 arquivos); fallback para console se não inicializado |
| `src/types.ts` | Tipos compartilhados com o servidor (re-exportados do protocolo WebSocket) |

### Arquivo de Configuração (`config.json`)

```json
{
  "apiUrl": "https://sua-api.com",
  "printerMapping": {
    "HP LaserJet Pro": { "enabled": true, "isDefault": true },
    "Microsoft Print to PDF": { "enabled": false, "isDefault": false }
  },
  "heartbeatIntervalMs": 30000,
  "logLevel": "info",
  "logFile": "./logs/agent.log"
}
```

`printerMapping` permite habilitar/desabilitar impressoras específicas. Impressoras sem entrada no mapeamento são incluídas por padrão.

### Arquivo de Token (`device-token.json`)

Criado automaticamente após o primeiro pareamento bem-sucedido:

```json
{
  "deviceToken": "a1b2c3d4...64-chars...",
  "agentId": "clx1abc...",
  "agentName": "Computador do Estoque",
  "pairedAt": "2026-04-10T14:30:00.000Z"
}
```

Para reparear, basta excluir este arquivo e reiniciar o agente.

### Descoberta de Impressoras (Windows)

```typescript
// Comando executado:
wmic printer get Name,PortName,DriverName,PrinterStatus,Default /format:csv

// StatusCode == 0 -> ONLINE, qualquer outro -> ERROR
```

A descoberta funciona **somente no Windows**. Em outras plataformas, o agente registra um aviso e retorna lista vazia.

### Execução do Job de Impressão

```typescript
// 1. Decodifica base64 para buffer
const buffer = Buffer.from(content, 'base64');

// 2. Salva em arquivo temporario
writeFileSync(`./temp/job-${jobId}.pdf`, buffer);

// 3. Envia para impressora
await print(tempFile, { printer: printerName, copies });

// 4. Remove arquivo temporario (no bloco finally)
unlinkSync(tempFile);
```

A biblioteca `pdf-to-printer` é responsável por invocar o subsistema de impressão do Windows. Erros na impressão são capturados e reportados via `agent:job:status { status: 'FAILED', error }`.

### Reconexão Automática

O Socket.io-client está configurado com `reconnection: true`, `reconnectionDelay: 1000`, `reconnectionDelayMax: 30000`. Em caso de queda de rede, o agente reconecta automaticamente e envia `agent:register` novamente ao conectar.

### Build do Executável

```bash
cd OpenSea-Agent

# Desenvolvimento com watch
npm run dev

# Compilar TypeScript
npm run build

# Gerar .exe standalone
npm run build:exe
# Saida: dist/opensea-print-agent.exe
# Target: node18-win-x64, compressao GZip
```

---

## OpenSea-APP (Frontend)

### Hooks

#### `useSocket` (`src/hooks/use-socket.ts`)

Hook singleton para conexão WebSocket. Utiliza contagem de referências (`refCount`) para manter uma única conexão global enquanto houver pelo menos um componente usando o hook, e desconectar automaticamente ao atingir zero.

```typescript
const { isConnected, socket, on } = useSocket();

// Assinar um evento (retorna funcao de cleanup)
const unsub = on<PrinterStatusPayload>('printer:status', (payload) => { ... });
```

A conexão usa o JWT do tenant armazenado em `localStorage` como autenticação.

#### `useRemotePrinters` (`src/core/print-queue/hooks/use-remote-printers.ts`)

Combina dados REST com atualizações ao vivo via Socket.io:

- Busca lista inicial via `GET /v1/sales/printers` (React Query, `refetchInterval: 60000`)
- Sobrescreve `status` de cada impressora com o valor mais recente do evento `printer:status`
- Expõe `onlinePrinters`, `hasOnlinePrinter`, `isSocketConnected`

#### `usePrintJobTracker` (`src/core/print-queue/hooks/use-print-job-tracker.ts`)

Rastreia jobs ativos em memória local:

- `addJob(job)` — adiciona um job recém-criado à lista
- `removeJob(jobId)` — remove manualmente
- `retryJob(jobId)` — chama `POST /print-jobs/:id/retry`, substitui jobId na lista
- `cancelJob(jobId)` — chama `DELETE /print-jobs/:id`
- Escuta `job:update` via Socket.io e atualiza status em tempo real
- Jobs com status `SUCCESS` ou `CANCELLED` são removidos automaticamente após 10 segundos

### Componentes Específicos

| Componente | Responsabilidade |
|------------|-----------------|
| `RemotePrinterSelector` | Dropdown/lista de seleção de impressora remota com indicador de status ao vivo |
| `PrintJobTracker` | Painel flutuante mostrando jobs ativos com status e ações (retry, dismiss) |

### Página de Gerenciamento (`/print/agents`)

Rota: `src/app/(dashboard)/(actions)/print/agents/page.tsx`

Estrutura visual:

```
PageLayout
  PageHeader
    PageActionBar (breadcrumb: Impressao > Impressoras)
  PageBody
    PageHeroBanner ("Impressoras Remotas")
    section: Impressoras Conectadas
      grid de PrinterCard (status ao vivo via useRemotePrinters)
    section: Computadores (Agentes)
      grid de AgentCard (status, hostname, IP, versao, acoes)
    section: Instalar em um Computador
      4 passos ilustrados + botao de download do .exe
```

**Fluxo de registro de agente (wizard em 2 passos):**

```
Passo 1: Nome do Agente
  - Input de texto com validacao min 1 char
  - Botao "Registrar" chama POST /v1/sales/print-agents

Passo 2: Codigo de Pareamento
  - Exibe codigo de 6 chars com contagem regressiva
  - Codigo e renovado automaticamente a cada 55s
  - Indicador colorido: verde (>30s), ambar (>10s), rose pulsante (<10s)
  - Botao "Concluir" fecha o dialog
```

**Acoes sobre agentes:**
- `Exibir Codigo`: abre `PairingCodeDialog` para agentes não pareados
- `Desvincular`: abre `VerifyActionPinModal` para confirmar despareamento
- `Excluir`: abre `VerifyActionPinModal` para confirmar remoção

### Serviços

| Serviço | Arquivo | Métodos |
|---------|---------|---------|
| `printAgentsService` | `src/services/sales/print-agents.service.ts` | `list()`, `register(name)`, `delete(id)`, `getPairingCode(id)`, `unpair(id)` |
| `printJobsService` | `src/services/sales/print-jobs.service.ts` | `list(query?)`, `create(data)`, `retry(jobId)`, `cancel(jobId)` |

### Types

| Interface | Arquivo | Campos principais |
|-----------|---------|-------------------|
| `PrintAgent` | `print-agent.types.ts` | `id`, `name`, `status`, `isPaired`, `deviceLabel`, `printerCount`, `lastSeenAt` |
| `RemotePrinter` | `print-agent.types.ts` | `id`, `name`, `status`, `agentId`, `agentName`, `osName`, `isDefault` |
| `PrintJobSummary` | `print-job.types.ts` | `id`, `printerId`, `printerName`, `type`, `status`, `copies`, `errorMessage` |
| `AgentStatus` | `print-agent.types.ts` | `'ONLINE' \| 'OFFLINE' \| 'ERROR'` |
| `PrinterStatus` | `print-agent.types.ts` | `'ONLINE' \| 'OFFLINE' \| 'BUSY' \| 'ERROR' \| 'UNKNOWN'` |
| `PrintJobStatus` | `print-job.types.ts` | `'CREATED' \| 'QUEUED' \| 'PRINTING' \| 'SUCCESS' \| 'FAILED' \| 'CANCELLED'` |

---

## Guia de Instalação do Agente

### Instalação Rápida (Windows)

1. Acesse o sistema no navegador em `Impressao > Impressoras`
2. Clique em "Baixar Instalador (Windows)" — fará download de `opensea-print-agent-setup.exe`
3. Execute `install.bat` — instala em `C:\OpenSea\PrintAgent\` e cria atalho na Área de Trabalho
4. Clique duas vezes no atalho "OpenSea Print Agent"
5. Na primeira execução, o programa pedirá o código de pareamento
6. No navegador: clique em "Adicionar Computador", insira um nome, copie o código de 6 dígitos
7. Digite o código no terminal do agente
8. Pronto — as impressoras do computador aparecem automaticamente no sistema web

**Conteúdo do instalador (`installer/install.bat`):**
- Cria `C:\OpenSea\PrintAgent\` e `C:\OpenSea\PrintAgent\logs\`
- Copia `opensea-print-agent.exe`
- Cria `config.json` com `apiUrl: "http://localhost:3333"` (deve ser atualizado para URL de produção)
- Cria atalho na Área de Trabalho via VBScript

### Instalação Manual

1. Copie `opensea-print-agent.exe` para qualquer pasta
2. Crie `config.json` no mesmo diretório:
   ```json
   {
     "apiUrl": "https://sua-instancia.opensea.com.br",
     "printerMapping": {},
     "heartbeatIntervalMs": 30000,
     "logLevel": "info",
     "logFile": "./logs/agent.log"
   }
   ```
3. Execute o `.exe`

### Configurar URL da API em Produção

Edite `config.json` e altere `apiUrl` para a URL da instância antes do primeiro pareamento:

```json
{ "apiUrl": "https://api.suaempresa.opensea.com.br" }
```

### Desenvolvimento

```bash
cd OpenSea-Agent
npm install

npm run dev          # TypeScript watch mode (tsx)
npm run build        # Compilar TypeScript para dist/
npm run build:exe    # Gerar dist/opensea-print-agent.exe
```

---

## Business Rules

### Regra 1: Pareamento Exclusivo

Um agente só pode estar pareado com um dispositivo por vez. Para parear um novo dispositivo, é necessário primeiro desvincular o atual (`POST /v1/sales/print-agents/:id/unpair`). A tentativa de parear um agente já pareado resulta em erro 400: `"This agent is already paired. Unpair it first."`

### Regra 2: Tamanho Máximo do Job

O conteúdo do job (PDF em base64) não pode ultrapassar 10MB. Esta validação acontece no use case `CreateLabelPrintJobUseCase` antes de persistir o job. PDFs de etiquetas são tipicamente menores que 500KB; o limite é uma salvaguarda contra uploads acidentais.

### Regra 3: Retry Somente de Jobs Falhos

Apenas jobs com `status: 'FAILED'` podem ser retentados. A operação de retry cria um **novo** `PrintJob` com os mesmos dados do original (incluindo `agentId` e `printerName`), não modifica o job falho. O novo job emite o evento `job:new` normalmente.

### Regra 4: Isolamento por Tenant

Agentes só recebem jobs do seu próprio tenant. O Socket.io usa rooms por `tenantId`, e o middleware `authenticateSocket` extrai o `tenantId` do token do dispositivo (que foi registrado no banco no momento do pareamento). Um agente jamais recebe eventos de outro tenant.

### Regra 5: Detecção Automática de Inatividade

Agentes que param de enviar heartbeats são marcados `OFFLINE` pelo `heartbeat-checker` em até 90 segundos. O checker roda a cada 30 segundos e verifica todos os agentes `ONLINE` com `lastSeenAt` anterior ao limiar. Ao marcar offline, emite `printer:status` para todos os browsers do tenant.

### Regra 6: Sincronização Bidirecional de Impressoras

Impressoras são descobertas automaticamente — não existe cadastro manual. A cada heartbeat, a lista do agente é comparada com o banco: novas impressoras são criadas, existentes têm status atualizado, e impressoras que sumiram da lista são marcadas `OFFLINE`. O nome da impressora no sistema (`PosPrinter.name`) é definido no primeiro registro e mantido; `osName` armazena o nome do OS para envio ao `pdf-to-printer`.

---

## Test Coverage

Os testes unitários cobrem as entidades e use cases com repositórios in-memory.

### Entidade `PrintAgent`

Cenários testados em `print-agent.spec.ts`:

- Criação com `pairingSecret` gerado automaticamente
- Criação com `status: 'OFFLINE'` por padrão
- `pair()`: preenche `deviceTokenHash`, `deviceLabel`, `pairedAt`; limpa `revokedAt`
- `unpair()`: define `revokedAt`
- `isPaired`: `true` somente quando `deviceTokenHash` presente E `revokedAt` ausente
- `recordHeartbeat()`: atualiza `lastSeenAt`, `ipAddress`, `hostname`, define `status: 'ONLINE'`
- `markOffline()`: define `status: 'OFFLINE'`
- Soft delete via `deletedAt`

### Use Cases

| Use Case | Cenários cobertos |
|----------|-------------------|
| `RegisterPrintAgentUseCase` | Registro básico, persistência, retorno de agentId |
| `ListPrintAgentsUseCase` | Lista vazia, lista com agentes, contagem de impressoras |
| `DeletePrintAgentUseCase` | Agente inexistente (404), soft delete bem-sucedido |
| `GetAgentPairingCodeUseCase` | Agente inexistente (404), retorno de code e expiresAt |
| `PairPrintAgentUseCase` | Código inválido (400), código expirado, agente já pareado (400), pareamento bem-sucedido |
| `UnpairPrintAgentUseCase` | Agente inexistente (404), despareamento bem-sucedido |
| `CreateLabelPrintJobUseCase` | Impressora inexistente (404), conteúdo acima de 10MB (400), criação bem-sucedida |
| `ListPrintJobsUseCase` | Paginação, filtro por status, filtro por printerId |
| `RetryPrintJobUseCase` | Job inexistente (404), job não-falho (400), retry bem-sucedido |
| `SyncAgentPrintersUseCase` | Criação de novas impressoras, atualização de existentes, marcação de removidas como OFFLINE |
| `MarkAgentOfflineUseCase` | Nenhum agente stale, múltiplos agentes stale, atualização de impressoras associadas |

**Total de testes unitários:** 63

---

## File Map

### OpenSea-API — Arquivos Novos

**WebSocket Gateway (`src/lib/websocket/`):**

| Arquivo | Descrição |
|---------|-----------|
| `socket-server.ts` | Inicializa o servidor Socket.io, gerencia rooms, expõe `emitJobToAgent()` e `emitToBrowsers()` |
| `socket-auth.ts` | Middleware de autenticação dual (JWT para browsers, deviceToken SHA-256 para agents) |
| `socket-handlers.ts` | Handlers para `agent:register`, `agent:heartbeat`, `agent:job:status`, `disconnect` |
| `heartbeat-checker.ts` | Processo periódico que marca agentes sem heartbeat como OFFLINE |
| `types.ts` | Interfaces TypeScript de todos os payloads do protocolo WebSocket |

**Entidades (`src/entities/sales/`):**

| Arquivo | Descrição |
|---------|-----------|
| `print-agent.ts` | Entidade `PrintAgent` com métodos `pair()`, `unpair()`, `recordHeartbeat()`, `markOffline()` |
| `print-job.ts` | Entidade `PrintJob` com transições de status e campos `agentId`, `copies`, `printerName` |
| `print-agent.spec.ts` | Testes unitários da entidade `PrintAgent` |

**Repositórios (`src/repositories/sales/`):**

| Arquivo | Descrição |
|---------|-----------|
| `print-agents-repository.ts` | Interface do repositório com métodos `findAllUnpairedWithPairingSecret()`, `findStaleAgents()` |
| `in-memory/in-memory-print-agents-repository.ts` | Implementação in-memory para testes |
| `prisma/prisma-print-agents-repository.ts` | Implementação Prisma para produção |

**Mappers:**

| Arquivo | Descrição |
|---------|-----------|
| `src/mappers/sales/print-agent/print-agent-prisma-to-domain.ts` | Converte registro Prisma para entidade de domínio `PrintAgent` |

**Use Cases (`src/use-cases/sales/print-agents/`):**

| Arquivo | Descrição |
|---------|-----------|
| `register-print-agent.use-case.ts` + `.spec.ts` | Registro de novo agente |
| `list-print-agents.use-case.ts` + `.spec.ts` | Listagem com contagem de impressoras |
| `delete-print-agent.use-case.ts` + `.spec.ts` | Soft delete |
| `get-agent-pairing-code.use-case.ts` + `.spec.ts` | Código TOTP atual |
| `pair-print-agent.use-case.ts` + `.spec.ts` | Pareamento com validação global de código |
| `unpair-print-agent.use-case.ts` + `.spec.ts` | Revogação de token |
| `factories/make-*.ts` | Fábricas para cada use case |

**Use Cases (`src/use-cases/sales/printing/`):**

| Arquivo | Descrição |
|---------|-----------|
| `create-label-print-job.use-case.ts` + `.spec.ts` | Criação de job LABEL com validação de tamanho |
| `list-print-jobs.use-case.ts` + `.spec.ts` | Listagem com filtros |
| `retry-print-job.use-case.ts` + `.spec.ts` | Clone de job falho como novo job |
| `sync-agent-printers.use-case.ts` + `.spec.ts` | Sincronização de impressoras do heartbeat |
| `mark-agent-offline.use-case.ts` + `.spec.ts` | Marcação de agentes stale como offline |
| `factories/make-*.ts` | Fábricas para cada use case |

**Controllers (`src/http/controllers/sales/print-agents/`):**

| Arquivo | Descrição |
|---------|-----------|
| `v1-register-print-agent.controller.ts` | `POST /v1/sales/print-agents` |
| `v1-list-print-agents.controller.ts` | `GET /v1/sales/print-agents` |
| `v1-delete-print-agent.controller.ts` | `DELETE /v1/sales/print-agents/:id` |
| `v1-get-pairing-code.controller.ts` | `GET /v1/sales/print-agents/:id/pairing-code` |
| `v1-pair-print-agent.controller.ts` | `POST /v1/sales/print-agents/pair` (público) |
| `v1-unpair-print-agent.controller.ts` | `POST /v1/sales/print-agents/:id/unpair` |
| `routes.ts` | Registro das rotas com split público/autenticado |

**Controllers (`src/http/controllers/sales/printing/`):**

| Arquivo | Descrição |
|---------|-----------|
| `v1-create-label-print-job.controller.ts` | `POST /v1/sales/print-jobs` — cria job e emite via WebSocket |
| `v1-list-print-jobs.controller.ts` | `GET /v1/sales/print-jobs` |
| `v1-retry-print-job.controller.ts` | `POST /v1/sales/print-jobs/:id/retry` |
| `routes.ts` | Registro das rotas de printing |

**Schemas Zod (`src/http/schemas/sales/printing/`):**

| Arquivo | Descrição |
|---------|-----------|
| `print-agent.schema.ts` | Schemas para register, list, params, pairing code, pair, pair response |

### OpenSea-APP — Arquivos Novos

| Arquivo | Descrição |
|---------|-----------|
| `src/hooks/use-socket.ts` | Hook singleton para conexão Socket.io com contagem de referências |
| `src/types/sales/print-agent.types.ts` | `PrintAgent`, `RemotePrinter`, `AgentStatus`, `PrinterStatus`, responses |
| `src/types/sales/print-job.types.ts` | `PrintJobSummary`, `PrintJobStatus`, `CreatePrintJobRequest/Response`, `PrintJobsResponse` |
| `src/services/sales/print-agents.service.ts` | CRUD de agentes: list, register, delete, getPairingCode, unpair |
| `src/services/sales/print-jobs.service.ts` | CRUD de jobs: list, create, retry, cancel |
| `src/core/print-queue/hooks/use-remote-printers.ts` | Combina REST + Socket.io para lista de impressoras com status ao vivo |
| `src/core/print-queue/hooks/use-print-job-tracker.ts` | Rastreia jobs ativos em memória com auto-remoção após conclusão |
| `src/core/print-queue/components/remote-printer-selector.tsx` | Seletor de impressora remota para o modal de impressão |
| `src/core/print-queue/components/print-job-tracker.tsx` | Painel de status de jobs ativos |
| `src/app/(dashboard)/(actions)/print/agents/page.tsx` | Página de gerenciamento de agentes e impressoras remotas |

### OpenSea-Agent — Todos os Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/index.ts` | Ponto de entrada; orquestra todos os módulos e gerencia graceful shutdown |
| `src/config.ts` | Carrega/persiste `config.json`; cria arquivo padrão na primeira execução |
| `src/pairing.ts` | Lê/salva `device-token.json`; executa fluxo interativo de pareamento |
| `src/socket-client.ts` | Conecta ao servidor, registra handlers de job, relata status de execução |
| `src/printer-discovery.ts` | Descobre impressoras Windows via `wmic`; retorna lista com status e metadados |
| `src/print-executor.ts` | Decodifica PDF base64, salva temporariamente, imprime via `pdf-to-printer`, limpa |
| `src/heartbeat.ts` | Emite `agent:heartbeat` com lista de impressoras a cada `heartbeatIntervalMs` |
| `src/logger.ts` | Winston com console colorido + arquivo rotacionado (5MB, 3 arquivos) |
| `src/types.ts` | Tipos do protocolo WebSocket (compartilhados com o servidor) |
| `installer/install.bat` | Instala em `C:\OpenSea\PrintAgent\`, cria config.json e atalho na Área de Trabalho |
| `config.json.example` | Exemplo de configuração empacotado no `.exe` |
| `package.json` | Dependências: `pdf-to-printer`, `socket.io-client`, `winston`; devDep: `@yao-pkg/pkg` |
| `tsconfig.json` | TypeScript para Node.js ESM |

---

## Audit History

| Data | Dimensão | Pontuação | Relatório |
|------|----------|-----------|-----------|
| — | — | — | Nenhum registro. |
