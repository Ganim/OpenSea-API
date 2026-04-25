# ADR 030 — POS device-token routes + public pair-by-code endpoint

**Status:** Accepted
**Date:** 2026-04-25

## Contexto

Emporion (terminal POS desktop, Electron) precisa abrir/fechar sessões de
caixa, registrar movimentos de caixa e parear-se contra a API. Antes deste
ADR, todas as rotas de POS exigiam JWT + tenant + permissão RBAC, mas o
terminal Emporion **não tem usuário JWT**:

1. **Pareamento inicial** — instalação fresh sem credenciais nenhumas.
2. **Operação contínua** — o terminal autentica como dispositivo, não
   como usuário; o operador real (employee) muda durante o turno.

A primeira tentativa de Plan C usou JWT bridge no terminal, mas isso exige
embutir credencial de service account no instalador (vazamento amplifica).
Reviews paralelos identificaram dois críticos:

- **Plan C F-01** — `POST /v1/sales/pos/pair-this-device` exige JWT, mas
  Emporion fresh install não tem JWT.
- **Plan C F-06** — `POST /v1/pos/sessions/open` exige JWT, mas device
  só tem device-token.

## Decisão

### 1. Rota pública pair-by-code

Novo endpoint `POST /v1/pos/devices/pair-public` **sem JWT**, com:

- Body: `{ pairingCode (6 chars Crockford), deviceLabel }`.
- Rate limit por IP: **5 tentativas/min** (`rateLimitConfig.posPairPublic`).
- Cross-tenant scan via `PosTerminalsRepository.findAllWithActivePairingSecret()`.
- Pairing code rotaciona a cada 60s (bucket-based via `rotating-code.ts`).

O **código de 6 chars Crockford** é o secret. Espaço de busca é
`32^6 ≈ 1.07 × 10^9` combinações; com rate limit de 5/min/IP e janela de
validade de ~120s (current bucket + 1 anterior), brute-force prático é
inviável.

`pairedByUserId` recebe sentinel `'public'` (coluna não tem FK para User).

### 2. Variantes device-token de sessions/cash

Três novos endpoints autenticados via `verifyDeviceToken` middleware:

- `POST /v1/pos/device/sessions/open`
- `POST /v1/pos/device/sessions/:sessionId/close`
- `POST /v1/pos/device/cash/movement`

Cada um:

- Lê `tenantId` + `terminalId` do contexto do device (`request.device`).
- Recebe `operatorEmployeeId` / `performedByEmployeeId` no body.
- Valida via `PosTerminalOperator.findByTerminalAndEmployee()` que o
  employee é operador ativo do terminal.
- Resolve `employee.userId` (linked user) — se ausente, retorna 400.
- Delega para o use case JWT existente, repassando `userId` resolvido.

Wrappers vivem em `OpenPosSessionFromDeviceUseCase`,
`ClosePosSessionFromDeviceUseCase`,
`CreatePosCashMovementFromDeviceUseCase`. O FK `PosSession.operatorUserId`
continua apontando para um User real, preservando audit trail e queries
existentes.

### 3. Alternativas rejeitadas

- **BFF/proxy autenticado em RP** (Plan B age como bridge): adiciona
  hop de rede em cada operação do terminal, complica handling de timeouts
  e degradação. O secret rotativo + rate limit já protege contra brute
  force; BFF não traz benefício de segurança real.
- **Service account JWT embutido no terminal**: embutir credencial de
  serviço no instalador é amplification de risco — se um instalador
  vaza, todo o tenant é comprometido. Device-token é vinculado a um
  pairing específico, revogável individualmente.
- **PrintServer endpoints no backend** (Plan C F-05): adiar para Fase 2;
  Emporion v0.2 usa impressora local nativa via `webContents.print` do
  Electron (decisão fora deste ADR — ver Plano de Fix v0.1 → v0.2).

## Consequências

- Repositório `PosTerminalsRepository` ganha método cross-tenant
  `findAllWithActivePairingSecret()`. Esse é o **único** método
  cross-tenant da interface; todos os outros permanecem tenant-scoped.
- Repositório `WarehousesRepository` ganha `findManyByIds(ids, tenantId)`
  para enrichment de zone listing (não relacionado ao device-token, mas
  parte da mesma fase).
- Operadores POS precisam ter `Employee.userId` setado (linked user
  account); fluxo de admissão deve garantir isso quando atribui o
  funcionário como operador. Endpoints retornam 400 com mensagem clara
  caso contrário.
- Device-token continua sendo o único canal autenticado para operação
  contínua do terminal — JWT users no painel RP cuidam de pairing,
  configuração e admin (resolver conflitos, revogar device, etc.).

## Referências

- Implementação: `src/http/controllers/sales/pos/devices/v1-pair-public.controller.ts`,
  `src/http/controllers/sales/pos/sessions/v1-{open,close}-session-from-device.controller.ts`,
  `src/http/controllers/sales/pos/cash/v1-cash-movement-from-device.controller.ts`.
- Rate limit: `src/config/rate-limits.ts` → `posPairPublic`.
- Middleware device-token: `src/http/middlewares/verify-device-token.ts`.
- Plano de Fix v0.1 → v0.2 (Phase A — backend additions).
