# Banking Integration — Direct Bank API Integration

**Date:** 2026-03-31
**Status:** Approved
**Scope:** Multi-bank provider architecture with Sicoob as first implementation

## Context

The Finance module currently uses Pluggy (aggregator) for read-only bank data (transactions, balance). This is limited — no payments, no boletos, no PIX. Direct bank API integration enables the full cycle: read data, emit boletos, create PIX charges, execute payments, and receive webhook notifications for automatic settlement.

The architecture supports multiple banks over time (Sicoob first, then BB, Caixa, Bradesco, Itau, Santander). Pluggy remains as fallback for clients without bank certificates.

## Decisions

1. **Strategy Pattern** — One `BankingProvider` interface, one implementation per bank. Provider resolved by `BankAccount.apiProvider` field.
2. **Credentials per BankAccount** — Each bank account has its own certificate/client_id. Stored in Storage module (S3) in admin-only protected folder.
3. **Payment approval flow** — Analyst creates `PaymentOrder`, director approves (PIN), system executes via bank API. Segregation of duties.
4. **Boleto emission** — Configurable per entry (`autoEmitBoleto` flag). Supports manual, automatic, and API-triggered (from Sales module).
5. **Automatic settlement** — Webhook receives payment confirmation. Below threshold: auto-settle. Above threshold: queued for manual review.
6. **Receipts** — Generated as PDF, stored in Storage as `FinanceAttachment` linked to the entry.

## Interface

```typescript
type ProviderCapability = 'READ' | 'BOLETO' | 'PIX' | 'PAYMENT' | 'TED';

interface BankingProvider {
  readonly providerName: string;
  readonly capabilities: ProviderCapability[];

  // Auth
  authenticate(): Promise<void>;

  // Read (all providers)
  getAccounts(): Promise<BankAccountData[]>;
  getBalance(accountId: string): Promise<AccountBalance>;
  getTransactions(accountId: string, from: string, to: string): Promise<BankTransaction[]>;

  // Boleto
  createBoleto(data: CreateBoletoInput): Promise<BoletoResult>;
  cancelBoleto(nossoNumero: string): Promise<void>;
  getBoleto(nossoNumero: string): Promise<BoletoResult>;

  // PIX
  createPixCharge(data: CreatePixChargeInput): Promise<PixChargeResult>;
  executePixPayment(data: ExecutePixPaymentInput): Promise<PaymentReceipt>;
  getPixCharge(txId: string): Promise<PixChargeResult>;

  // Payments
  executePayment(data: ExecutePaymentInput): Promise<PaymentReceipt>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;

  // Webhook
  registerWebhook(url: string, events: WebhookEvent[]): Promise<void>;
  handleWebhookPayload(payload: unknown): Promise<WebhookResult>;
}
```

PluggyProvider implements READ only; write methods throw `OperationNotSupportedError`.

## Data Model

### BankAccount — New fields

```prisma
model BankAccount {
  // existing fields...

  // API Integration
  apiProvider       String?   @map("api_provider") @db.VarChar(32)
  apiClientId       String?   @map("api_client_id") @db.VarChar(256)
  apiCertFileId     String?   @map("api_cert_file_id")
  apiCertKeyFileId  String?   @map("api_cert_key_file_id")
  apiScopes         String?   @map("api_scopes") @db.VarChar(512)
  apiWebhookSecret  String?   @map("api_webhook_secret") @db.VarChar(256)
  apiEnabled        Boolean   @default(false) @map("api_enabled")

  // Billing config
  autoEmitBoleto    Boolean   @default(false) @map("auto_emit_boleto")
  autoLowThreshold  Decimal?  @map("auto_low_threshold") @db.Decimal(15, 2)

  // Relations
  certFile          StorageFile? @relation("certFile", fields: [apiCertFileId], references: [id])
  certKeyFile       StorageFile? @relation("certKeyFile", fields: [apiCertKeyFileId], references: [id])
}
```

### PaymentOrder — New model

```prisma
enum PaymentOrderStatus {
  PENDING_APPROVAL
  APPROVED
  REJECTED
  PROCESSING
  COMPLETED
  FAILED
}

enum PaymentMethod {
  PIX
  TED
  BOLETO
}

model PaymentOrder {
  id              String              @id @default(uuid())
  tenantId        String              @map("tenant_id")
  entryId         String              @map("entry_id")
  bankAccountId   String              @map("bank_account_id")
  method          PaymentMethod
  amount          Decimal             @db.Decimal(15, 2)
  recipientData   Json                @map("recipient_data")
  status          PaymentOrderStatus  @default(PENDING_APPROVAL)

  requestedById   String              @map("requested_by_id")
  approvedById    String?             @map("approved_by_id")
  approvedAt      DateTime?           @map("approved_at")
  rejectedReason  String?             @map("rejected_reason") @db.VarChar(500)

  externalId      String?             @map("external_id") @db.VarChar(256)
  receiptData     Json?               @map("receipt_data")
  receiptFileId   String?             @map("receipt_file_id")
  errorMessage    String?             @map("error_message") @db.VarChar(1000)

  createdAt       DateTime            @default(now()) @map("created_at")
  updatedAt       DateTime            @updatedAt @map("updated_at")

  tenant          Tenant              @relation(fields: [tenantId], references: [id])
  entry           FinanceEntry        @relation(fields: [entryId], references: [id])
  bankAccount     BankAccount         @relation(fields: [bankAccountId], references: [id])
  requestedBy     User                @relation("paymentRequester", fields: [requestedById], references: [id])
  approvedBy      User?               @relation("paymentApprover", fields: [approvedById], references: [id])
  receiptFile     StorageFile?        @relation(fields: [receiptFileId], references: [id])

  @@index([tenantId])
  @@index([entryId])
  @@index([status])
  @@map("payment_orders")
}
```

### BankWebhookEvent — New model

```prisma
model BankWebhookEvent {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  bankAccountId   String    @map("bank_account_id")
  provider        String    @db.VarChar(32)
  eventType       String    @map("event_type") @db.VarChar(64)
  externalId      String    @map("external_id") @db.VarChar(256)
  amount          Decimal   @db.Decimal(15, 2)
  payload         Json
  matchedEntryId  String?   @map("matched_entry_id")
  autoSettled     Boolean   @default(false) @map("auto_settled")
  processedAt     DateTime? @map("processed_at")
  createdAt       DateTime  @default(now()) @map("created_at")

  tenant          Tenant       @relation(fields: [tenantId], references: [id])
  bankAccount     BankAccount  @relation(fields: [bankAccountId], references: [id])
  matchedEntry    FinanceEntry? @relation(fields: [matchedEntryId], references: [id])

  @@index([tenantId])
  @@index([bankAccountId])
  @@index([externalId])
  @@map("bank_webhook_events")
}
```

## Business Flows

### Flow 1 — Pay supplier (Accounts Payable)

1. Analyst clicks "Pagar via Banco" on a PENDING/OVERDUE entry
2. Selects method (PIX/TED/Boleto), fills recipient data, confirms with PIN
3. System creates `PaymentOrder` with status `PENDING_APPROVAL`
4. Director receives notification, reviews order
5. Director approves with PIN → status `APPROVED` → `PROCESSING`
6. System calls `provider.executePixPayment()` or `provider.executePayment()`
7. On success: status `COMPLETED`, generates receipt PDF, saves to Storage, marks entry as `PAID`
8. On failure: status `FAILED`, stores error message, entry stays unchanged

### Flow 2 — Bill customer (Accounts Receivable)

1. User creates receivable entry
2. If `autoEmitBoleto = true` on the bank account:
   - System calls `provider.createBoleto()` (Sicoob V3 hybrid: barcode + PIX QR)
   - Saves boleto PDF as `FinanceAttachment`
   - Optionally sends email to customer
3. If manual: user clicks "Gerar Boleto" or "Gerar PIX" on demand
4. Sales module integration: API call triggers emission automatically

### Flow 3 — Automatic settlement via webhook

1. Sicoob sends webhook to `POST /v1/finance/webhooks/sicoob`
2. System validates webhook signature using `apiWebhookSecret`
3. Finds matching entry by `nossoNumero` (boleto) or `txId` (PIX)
4. If amount <= `autoLowThreshold`: auto-settle entry to `RECEIVED`
5. If amount > threshold: create `BankWebhookEvent` with `autoSettled: false`, notify financial team
6. Stores raw webhook payload for audit

### Flow 4 — Statement sync

1. Cron job every 4 hours (or manual "Sincronizar" button)
2. For each `BankAccount` with `apiEnabled = true`:
   - `getBalance()` → update `currentBalance`
   - `getTransactions(last 7 days)` → create reconciliation items
   - `autoMatchTransactions()` → match with existing entries
3. For Pluggy connections (fallback): existing sync flow unchanged

## Sicoob Provider — API Details

### Authentication
- OAuth2 + mTLS (mutual TLS with client certificate)
- Certificate `.pem` + private key `.key` stored in Storage
- Scopes: `cob.read`, `cob.write`, `cobv.read`, `cobv.write`, `pix.read`, `pix.write`, `pagamentos_pix.write`, `pagamentos_ted.write`
- Token cached for 5 minutes, auto-refreshed

### Endpoints consumed

| Operation | Method | Sicoob Endpoint |
|-----------|--------|-----------------|
| Auth token | POST | `https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token` |
| Balance | GET | `/conta-corrente/v4/contas/{conta}/saldo` |
| Statement | GET | `/conta-corrente/v4/contas/{conta}/extrato` |
| Create boleto | POST | `/cobranca-bancaria/v3/boletos` |
| Get boleto | GET | `/cobranca-bancaria/v3/boletos/{nossoNumero}` |
| Cancel boleto | PATCH | `/cobranca-bancaria/v3/boletos/{nossoNumero}/baixar` |
| Create PIX charge | POST | `/pix/v2/cob` |
| Get PIX charge | GET | `/pix/v2/cob/{txId}` |
| PIX payment | POST | `/pix/v2/pagamentos/pix` |
| Register webhook | PUT | `/pix/v2/webhook/{chave}` |

### Certificate handling
1. On provider instantiation, download cert files from S3 (via Storage service) to memory buffers
2. Use `https.Agent` with `cert` + `key` buffers for mTLS
3. Never write certificates to disk
4. Cache the `https.Agent` instance per bank account (invalidate when cert is updated)

## File Structure

### Backend — New files

```
src/services/banking/
  banking-provider.interface.ts      (expanded interface, replaces pluggy-provider.interface.ts)
  banking-provider.factory.ts        (resolves provider by BankAccount)
  pluggy.provider.ts                 (existing, adapts to new interface)
  sicoob.provider.ts                 (NEW)

src/use-cases/finance/payment-orders/
  create-payment-order.ts
  approve-payment-order.ts
  reject-payment-order.ts
  list-payment-orders.ts
  get-payment-order.ts
  factories/

src/use-cases/finance/boleto/
  emit-boleto.ts
  cancel-boleto.ts
  get-boleto.ts
  factories/

src/use-cases/finance/pix/
  create-pix-charge.ts
  get-pix-charge.ts
  factories/

src/use-cases/finance/webhooks/
  process-bank-webhook.ts
  factories/

src/http/controllers/finance/payment-orders/   (CRUD + approve + reject)
src/http/controllers/finance/boleto/           (emit, cancel, get, download)
src/http/controllers/finance/pix/              (create charge, get)
src/http/controllers/finance/webhooks/         (POST per provider)

src/repositories/finance/
  payment-orders-repository.ts
  bank-webhook-events-repository.ts
  prisma/prisma-payment-orders-repository.ts
  prisma/prisma-bank-webhook-events-repository.ts
  in-memory/in-memory-payment-orders-repository.ts
  in-memory/in-memory-bank-webhook-events-repository.ts
```

### Frontend — New components/pages

```
src/components/finance/
  bank-api-setup-modal.tsx             (upload cert, config scopes, test connection)
  payment-order-modal.tsx              (create payment order: choose method, fill data)
  payment-approval-card.tsx            (approve/reject with details)
  boleto-emit-modal.tsx                (generate boleto on demand)
  payment-receipt-viewer.tsx           (view PDF receipt)

src/app/(dashboard)/(modules)/finance/
  payment-orders/page.tsx              (pending approvals queue)
```

### Tests

```
src/services/banking/sicoob.provider.spec.ts
src/use-cases/finance/payment-orders/create-payment-order.spec.ts
src/use-cases/finance/payment-orders/approve-payment-order.spec.ts
src/use-cases/finance/payment-orders/reject-payment-order.spec.ts
src/use-cases/finance/boleto/emit-boleto.spec.ts
src/use-cases/finance/pix/create-pix-charge.spec.ts
src/use-cases/finance/webhooks/process-bank-webhook.spec.ts
```

All tests use in-memory repositories. SicoobProvider tests mock HTTP responses.

## Permissions

New permission codes under `FINANCE`:

```typescript
PAYMENT_ORDERS: {
  ACCESS: 'finance.payment-orders.access',
  REGISTER: 'finance.payment-orders.register',   // create order (analyst)
  APPROVE: 'finance.payment-orders.approve',      // approve/reject (director)
  ADMIN: 'finance.payment-orders.admin',
}
BOLETO: {
  ACCESS: 'finance.boleto.access',
  REGISTER: 'finance.boleto.register',            // emit boleto
}
```

## Out of Scope (future)

- BB, Caixa, Bradesco, Itau, Santander providers (architecture supports them)
- Scheduled/batch payments (multiple orders in one approval)
- CNAB 240/400 file generation (legacy alternative to API)
- Credit card bill integration
- Investment portfolio sync
