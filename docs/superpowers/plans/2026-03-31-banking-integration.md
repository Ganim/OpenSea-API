# Banking Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement direct bank API integration (Sicoob first) with multi-bank provider architecture, payment approval flow, boleto emission, PIX charges, and webhook settlement.

**Architecture:** Strategy Pattern — one `BankingProvider` interface with `PluggyProvider` (existing, read-only) and `SicoobProvider` (new, full read+write). Provider resolved per `BankAccount` via factory. Payment orders follow approval workflow (create → approve → execute). Webhooks handle automatic settlement.

**Tech Stack:** TypeScript, Fastify, Prisma, PostgreSQL, Node.js https (mTLS), S3 (Storage module)

**Spec:** `docs/superpowers/specs/2026-03-31-banking-integration-design.md`

---

### Task 1: Schema — Add new models and BankAccount fields

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/constants/rbac/permission-codes.ts`

- [ ] **Step 1: Add API fields to BankAccount model**

In `prisma/schema.prisma`, find `model BankAccount` and add before `deletedAt`:

```prisma
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
```

Add relations in BankAccount:
```prisma
  paymentOrders      PaymentOrder[]
  bankWebhookEvents  BankWebhookEvent[]
```

- [ ] **Step 2: Add PaymentOrder model**

Add after `BankConnection` model:

```prisma
// ============================================================================
// PAYMENT ORDERS (approval workflow for bank payments)
// ============================================================================

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

  @@index([tenantId])
  @@index([entryId])
  @@index([status])
  @@map("payment_orders")
}
```

Note: `requestedById` and `approvedById` are plain strings (userId), no FK to avoid circular dependency issues with User model. The user info is resolved at query time.

- [ ] **Step 3: Add BankWebhookEvent model**

```prisma
// ============================================================================
// BANK WEBHOOK EVENTS (incoming payment notifications)
// ============================================================================

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

  @@index([tenantId])
  @@index([bankAccountId])
  @@index([externalId])
  @@map("bank_webhook_events")
}
```

Add `paymentOrders PaymentOrder[]` to `FinanceEntry` model relations.
Add `bankWebhookEvents BankWebhookEvent[]` to `Tenant` model relations.

- [ ] **Step 4: Add permission codes**

In `src/constants/rbac/permission-codes.ts`, inside the `FINANCE` object, after `RECURRING`:

```typescript
    PAYMENT_ORDERS: {
      ACCESS: 'finance.payment-orders.access' as const,
      REGISTER: 'finance.payment-orders.register' as const,
      MODIFY: 'finance.payment-orders.modify' as const,
      REMOVE: 'finance.payment-orders.remove' as const,
      APPROVE: 'finance.payment-orders.approve' as const,
      ADMIN: 'finance.payment-orders.admin' as const,
    },
    BOLETO: {
      ACCESS: 'finance.boleto.access' as const,
      REGISTER: 'finance.boleto.register' as const,
    },
```

- [ ] **Step 5: Push schema to database**

Run: `npx prisma db push`
Expected: Schema synced successfully.

- [ ] **Step 6: Regenerate Prisma client**

Run: `npx prisma generate`
Expected: Prisma client generated.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma src/constants/rbac/permission-codes.ts
git commit -m "feat(finance): add PaymentOrder, BankWebhookEvent models and API fields on BankAccount"
```

---

### Task 2: Banking Provider Interface + Factory

**Files:**
- Create: `src/services/banking/banking-provider.interface.ts`
- Create: `src/services/banking/banking-provider.factory.ts`
- Modify: `src/services/banking/pluggy.provider.ts` (adapt to new interface)

- [ ] **Step 1: Create the expanded interface**

Create `src/services/banking/banking-provider.interface.ts`:

```typescript
// ============================================================================
// Multi-Bank Provider Interface
// Strategy Pattern: one interface, one implementation per bank.
// ============================================================================

export type ProviderCapability = 'READ' | 'BOLETO' | 'PIX' | 'PAYMENT' | 'TED';

// ── Read types ──

export interface BankAccountData {
  id: string;
  type: 'BANK' | 'CREDIT';
  name: string;
  number: string;
  balance: number;
  currencyCode: string;
}

export interface AccountBalance {
  available: number;
  current: number;
  currency: string;
  updatedAt: string;
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  category?: string;
  providerCode?: string;
}

// ── Boleto types ──

export interface CreateBoletoInput {
  amount: number;
  dueDate: string; // YYYY-MM-DD
  customerName: string;
  customerCpfCnpj: string;
  description: string;
  isHybrid?: boolean; // barcode + PIX QR
}

export interface BoletoResult {
  nossoNumero: string;
  barcode: string;
  digitableLine: string;
  pixCopyPaste?: string; // EMV payload for hybrid boletos
  pdfUrl?: string;
  status: string;
  dueDate: string;
  amount: number;
}

// ── PIX types ──

export interface CreatePixChargeInput {
  amount: number;
  pixKey: string;
  description: string;
  expiresInSeconds?: number;
  customerName?: string;
  customerCpfCnpj?: string;
}

export interface PixChargeResult {
  txId: string;
  status: string;
  pixCopyPaste: string; // EMV payload
  qrCodeBase64?: string;
  amount: number;
  createdAt: string;
}

export interface ExecutePixPaymentInput {
  amount: number;
  recipientPixKey: string;
  recipientName?: string;
  recipientCpfCnpj?: string;
  description?: string;
}

// ── Payment types ──

export interface ExecutePaymentInput {
  method: 'TED' | 'BOLETO';
  amount: number;
  // For TED:
  recipientBankCode?: string;
  recipientAgency?: string;
  recipientAccount?: string;
  recipientName?: string;
  recipientCpfCnpj?: string;
  // For boleto payment:
  barcode?: string;
  dueDate?: string;
}

export interface PaymentReceipt {
  externalId: string;
  method: string;
  amount: number;
  status: string;
  executedAt: string;
  recipientName?: string;
  receiptData: Record<string, unknown>; // raw bank response
}

export interface PaymentStatus {
  externalId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETURNED';
  amount: number;
  executedAt?: string;
  errorMessage?: string;
}

// ── Webhook types ──

export type WebhookEvent = 'PIX_RECEIVED' | 'BOLETO_PAID' | 'PAYMENT_CONFIRMED';

export interface WebhookResult {
  eventType: WebhookEvent;
  externalId: string;
  amount: number;
  paidAt: string;
  payerName?: string;
  payerCpfCnpj?: string;
  rawPayload: Record<string, unknown>;
}

// ── Provider interface ──

export interface BankingProvider {
  readonly providerName: string;
  readonly capabilities: ProviderCapability[];

  // Auth
  authenticate(): Promise<void>;

  // Read
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

- [ ] **Step 2: Create the factory**

Create `src/services/banking/banking-provider.factory.ts`:

```typescript
import { PluggyProvider } from './pluggy.provider';
import { SicoobProvider } from './sicoob.provider';
import type { BankingProvider } from './banking-provider.interface';

interface BankAccountApiConfig {
  apiProvider: string | null;
  apiClientId: string | null;
  apiScopes: string | null;
  bankCode: string;
  agency: string;
  accountNumber: string;
}

interface CertificateLoader {
  loadCertBuffers(certFileId: string, keyFileId: string): Promise<{
    cert: Buffer;
    key: Buffer;
  }>;
}

export function createBankingProvider(
  config: BankAccountApiConfig,
  certLoader: CertificateLoader,
  certFileId?: string | null,
  keyFileId?: string | null,
): BankingProvider {
  const provider = config.apiProvider?.toUpperCase();

  switch (provider) {
    case 'SICOOB':
      if (!config.apiClientId || !certFileId || !keyFileId) {
        throw new Error('Sicoob requires apiClientId, certificate and key files');
      }
      return new SicoobProvider({
        clientId: config.apiClientId,
        certFileId,
        keyFileId,
        scopes: config.apiScopes?.split(',').map(s => s.trim()) ?? [],
        accountNumber: config.accountNumber,
        agency: config.agency,
        certLoader,
      });

    case 'PLUGGY':
      return new PluggyProvider();

    default:
      throw new Error(`Unknown banking provider: ${provider}`);
  }
}
```

- [ ] **Step 3: Adapt PluggyProvider to new interface**

Modify `src/services/banking/pluggy.provider.ts`:
- Change `implements BankingProvider` to use new interface from `banking-provider.interface.ts`
- Add `readonly capabilities: ProviderCapability[] = ['READ'];`
- Add stub methods for write operations that throw `OperationNotSupportedError`:

```typescript
import { OperationNotSupportedError } from '@/@errors/use-cases/operation-not-supported';
import type {
  BankingProvider,
  ProviderCapability,
  BankAccountData,
  AccountBalance,
  BankTransaction,
  CreateBoletoInput,
  BoletoResult,
  CreatePixChargeInput,
  PixChargeResult,
  ExecutePixPaymentInput,
  ExecutePaymentInput,
  PaymentReceipt,
  PaymentStatus,
  WebhookEvent,
  WebhookResult,
} from './banking-provider.interface';

// ... existing code for authenticate, getAccounts, getBalance, getTransactions stays ...

// Add to the class:
readonly capabilities: ProviderCapability[] = ['READ'];

async createBoleto(_data: CreateBoletoInput): Promise<BoletoResult> {
  throw new OperationNotSupportedError('Pluggy does not support boleto emission');
}
async cancelBoleto(_nossoNumero: string): Promise<void> {
  throw new OperationNotSupportedError('Pluggy does not support boleto cancellation');
}
async getBoleto(_nossoNumero: string): Promise<BoletoResult> {
  throw new OperationNotSupportedError('Pluggy does not support boleto queries');
}
async createPixCharge(_data: CreatePixChargeInput): Promise<PixChargeResult> {
  throw new OperationNotSupportedError('Pluggy does not support PIX charges');
}
async executePixPayment(_data: ExecutePixPaymentInput): Promise<PaymentReceipt> {
  throw new OperationNotSupportedError('Pluggy does not support PIX payments');
}
async getPixCharge(_txId: string): Promise<PixChargeResult> {
  throw new OperationNotSupportedError('Pluggy does not support PIX queries');
}
async executePayment(_data: ExecutePaymentInput): Promise<PaymentReceipt> {
  throw new OperationNotSupportedError('Pluggy does not support payments');
}
async getPaymentStatus(_paymentId: string): Promise<PaymentStatus> {
  throw new OperationNotSupportedError('Pluggy does not support payment status');
}
async registerWebhook(_url: string, _events: WebhookEvent[]): Promise<void> {
  throw new OperationNotSupportedError('Pluggy does not support webhooks');
}
async handleWebhookPayload(_payload: unknown): Promise<WebhookResult> {
  throw new OperationNotSupportedError('Pluggy does not support webhooks');
}
```

Make sure existing methods (`getAccounts`, `getBalance`, `getTransactions`) return types matching the new interface. Adapt the return shapes if needed (e.g., rename `PluggyAccount` fields to match `BankAccountData`).

- [ ] **Step 4: Create OperationNotSupportedError if it doesn't exist**

Check if `src/@errors/use-cases/operation-not-supported.ts` exists. If not, create it:

```typescript
import { DomainError } from '../domain-error';

export class OperationNotSupportedError extends DomainError {
  constructor(message: string = 'Operation not supported by this provider') {
    super(message, 'OPERATION_NOT_SUPPORTED');
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/services/banking/
git commit -m "feat(banking): expanded BankingProvider interface with factory + adapt Pluggy"
```

---

### Task 3: Sicoob Provider — Authentication + Read

**Files:**
- Create: `src/services/banking/sicoob.provider.ts`
- Create: `src/services/banking/sicoob.provider.spec.ts`

- [ ] **Step 1: Write tests for Sicoob auth + balance + transactions**

Create `src/services/banking/sicoob.provider.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SicoobProvider } from './sicoob.provider';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function createProvider() {
  return new SicoobProvider({
    clientId: 'test-client-id',
    certFileId: 'cert-file-id',
    keyFileId: 'key-file-id',
    scopes: ['cob.read', 'cob.write', 'pix.read'],
    accountNumber: '12345',
    agency: '0001',
    certLoader: {
      async loadCertBuffers() {
        return {
          cert: Buffer.from('mock-cert'),
          key: Buffer.from('mock-key'),
        };
      },
    },
  });
}

function mockAuthResponse() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ access_token: 'mock-token', expires_in: 300 }),
  });
}

describe('SicoobProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should authenticate with OAuth2', async () => {
    const provider = createProvider();
    mockAuthResponse();

    await provider.authenticate();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('auth.sicoob.com.br'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('should have full capabilities', () => {
    const provider = createProvider();
    expect(provider.capabilities).toContain('READ');
    expect(provider.capabilities).toContain('BOLETO');
    expect(provider.capabilities).toContain('PIX');
    expect(provider.capabilities).toContain('PAYMENT');
  });

  it('should get balance', async () => {
    const provider = createProvider();
    mockAuthResponse();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        saldo: { disponivel: 15000.50, bloqueado: 0, limite: 50000 },
      }),
    });

    const balance = await provider.getBalance('12345');

    expect(balance.available).toBe(15000.50);
    expect(balance.currency).toBe('BRL');
  });

  it('should get transactions', async () => {
    const provider = createProvider();
    mockAuthResponse();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transacoes: [
          { id: 'tx1', data: '2026-03-30', descricao: 'PIX recebido', valor: 500, tipo: 'CREDITO' },
          { id: 'tx2', data: '2026-03-30', descricao: 'Pagamento boleto', valor: -200, tipo: 'DEBITO' },
        ],
      }),
    });

    const transactions = await provider.getTransactions('12345', '2026-03-01', '2026-03-31');

    expect(transactions).toHaveLength(2);
    expect(transactions[0].amount).toBe(500);
    expect(transactions[0].type).toBe('CREDIT');
    expect(transactions[1].amount).toBe(-200);
    expect(transactions[1].type).toBe('DEBIT');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/services/banking/sicoob.provider.spec.ts`
Expected: FAIL — `SicoobProvider` does not exist yet.

- [ ] **Step 3: Implement SicoobProvider — auth + read**

Create `src/services/banking/sicoob.provider.ts`:

```typescript
import type {
  AccountBalance,
  BankAccountData,
  BankingProvider,
  BankTransaction,
  BoletoResult,
  CreateBoletoInput,
  CreatePixChargeInput,
  ExecutePaymentInput,
  ExecutePixPaymentInput,
  PaymentReceipt,
  PaymentStatus,
  PixChargeResult,
  ProviderCapability,
  WebhookEvent,
  WebhookResult,
} from './banking-provider.interface';

const SICOOB_AUTH_URL =
  'https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token';
const SICOOB_API_URL = 'https://api.sicoob.com.br';

interface SicoobProviderConfig {
  clientId: string;
  certFileId: string;
  keyFileId: string;
  scopes: string[];
  accountNumber: string;
  agency: string;
  certLoader: {
    loadCertBuffers(certFileId: string, keyFileId: string): Promise<{
      cert: Buffer;
      key: Buffer;
    }>;
  };
}

export class SicoobProvider implements BankingProvider {
  readonly providerName = 'SICOOB';
  readonly capabilities: ProviderCapability[] = ['READ', 'BOLETO', 'PIX', 'PAYMENT', 'TED'];

  private config: SicoobProviderConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date = new Date(0);
  private httpsAgent: unknown = null;

  constructor(config: SicoobProviderConfig) {
    this.config = config;
  }

  // ── Auth ──

  async authenticate(): Promise<void> {
    if (this.accessToken && this.tokenExpiry > new Date()) return;

    // Load certificates from Storage
    const { cert, key } = await this.config.certLoader.loadCertBuffers(
      this.config.certFileId,
      this.config.keyFileId,
    );

    // Create HTTPS agent with mTLS
    const https = await import('https');
    this.httpsAgent = new https.Agent({ cert, key, rejectUnauthorized: true });

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      scope: this.config.scopes.join(' '),
    });

    const response = await fetch(SICOOB_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      // @ts-expect-error -- Node.js fetch supports dispatcher/agent
      agent: this.httpsAgent,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Sicoob auth failed (${response.status}): ${err}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 30) * 1000);
  }

  // ── Read ──

  async getAccounts(): Promise<BankAccountData[]> {
    return [{
      id: this.config.accountNumber,
      type: 'BANK',
      name: `Sicoob ${this.config.agency}/${this.config.accountNumber}`,
      number: this.config.accountNumber,
      balance: 0,
      currencyCode: 'BRL',
    }];
  }

  async getBalance(accountId: string): Promise<AccountBalance> {
    const data = await this.request('GET', `/conta-corrente/v4/contas/${accountId}/saldo`);
    const saldo = data.saldo as Record<string, number>;
    return {
      available: saldo.disponivel ?? 0,
      current: (saldo.disponivel ?? 0) + (saldo.bloqueado ?? 0),
      currency: 'BRL',
      updatedAt: new Date().toISOString(),
    };
  }

  async getTransactions(accountId: string, from: string, to: string): Promise<BankTransaction[]> {
    const data = await this.request(
      'GET',
      `/conta-corrente/v4/contas/${accountId}/extrato?dataInicio=${from}&dataFim=${to}`,
    );

    const transacoes = (data.transacoes ?? []) as Record<string, unknown>[];
    return transacoes.map(tx => ({
      id: String(tx.id ?? tx.identificador ?? ''),
      date: String(tx.data ?? ''),
      description: String(tx.descricao ?? ''),
      amount: Number(tx.valor ?? 0),
      type: (Number(tx.valor ?? 0) >= 0 ? 'CREDIT' : 'DEBIT') as 'CREDIT' | 'DEBIT',
      category: tx.categoria as string | undefined,
    }));
  }

  // ── Boleto (placeholder for Task 4) ──

  async createBoleto(_data: CreateBoletoInput): Promise<BoletoResult> {
    throw new Error('Not implemented yet — Task 4');
  }
  async cancelBoleto(_nossoNumero: string): Promise<void> {
    throw new Error('Not implemented yet — Task 4');
  }
  async getBoleto(_nossoNumero: string): Promise<BoletoResult> {
    throw new Error('Not implemented yet — Task 4');
  }

  // ── PIX (placeholder for Task 5) ──

  async createPixCharge(_data: CreatePixChargeInput): Promise<PixChargeResult> {
    throw new Error('Not implemented yet — Task 5');
  }
  async executePixPayment(_data: ExecutePixPaymentInput): Promise<PaymentReceipt> {
    throw new Error('Not implemented yet — Task 5');
  }
  async getPixCharge(_txId: string): Promise<PixChargeResult> {
    throw new Error('Not implemented yet — Task 5');
  }

  // ── Payments (placeholder for Task 5) ──

  async executePayment(_data: ExecutePaymentInput): Promise<PaymentReceipt> {
    throw new Error('Not implemented yet — Task 5');
  }
  async getPaymentStatus(_paymentId: string): Promise<PaymentStatus> {
    throw new Error('Not implemented yet — Task 5');
  }

  // ── Webhook (placeholder for Task 8) ──

  async registerWebhook(_url: string, _events: WebhookEvent[]): Promise<void> {
    throw new Error('Not implemented yet — Task 8');
  }
  async handleWebhookPayload(_payload: unknown): Promise<WebhookResult> {
    throw new Error('Not implemented yet — Task 8');
  }

  // ── Internal ──

  private async request(method: string, path: string, body?: unknown): Promise<Record<string, unknown>> {
    await this.authenticate();

    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      // @ts-expect-error -- Node.js fetch supports agent
      agent: this.httpsAgent,
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${SICOOB_API_URL}${path}`, options);

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Sicoob API error (${response.status}): ${errBody}`);
    }

    return response.json() as Promise<Record<string, unknown>>;
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/services/banking/sicoob.provider.spec.ts`
Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/banking/sicoob.provider.ts src/services/banking/sicoob.provider.spec.ts
git commit -m "feat(banking): SicoobProvider with OAuth2 mTLS auth, balance, and transactions"
```

---

### Task 4: Sicoob Provider — Boleto V3

**Files:**
- Modify: `src/services/banking/sicoob.provider.ts`
- Modify: `src/services/banking/sicoob.provider.spec.ts`

- [ ] **Step 1: Add boleto tests**

Add to `sicoob.provider.spec.ts`:

```typescript
it('should create a hybrid boleto', async () => {
  const provider = createProvider();
  mockAuthResponse();
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      nossoNumero: '00012345',
      codigoBarras: '23793.38128 12345.000009 00012.345001 1 90000000015000',
      linhaDigitavel: '23793381281234500000900012345001190000000015000',
      pixCopiaECola: '00020126580014br.gov.bcb.pix...',
    }),
  });

  const result = await provider.createBoleto({
    amount: 150.00,
    dueDate: '2026-04-15',
    customerName: 'João Silva',
    customerCpfCnpj: '12345678901',
    description: 'Mensalidade abril/2026',
    isHybrid: true,
  });

  expect(result.nossoNumero).toBe('00012345');
  expect(result.barcode).toBeDefined();
  expect(result.pixCopyPaste).toBeDefined();
});

it('should cancel a boleto', async () => {
  const provider = createProvider();
  mockAuthResponse();
  mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

  await expect(provider.cancelBoleto('00012345')).resolves.not.toThrow();
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npx vitest run src/services/banking/sicoob.provider.spec.ts`
Expected: FAIL — boleto methods throw "Not implemented yet".

- [ ] **Step 3: Implement boleto methods**

Replace the boleto placeholders in `sicoob.provider.ts`:

```typescript
async createBoleto(data: CreateBoletoInput): Promise<BoletoResult> {
  const body = {
    numeroCliente: this.config.accountNumber,
    especieDocumento: 'DM', // Duplicata Mercantil
    dataVencimento: data.dueDate,
    valor: data.amount,
    pagador: {
      numeroCpfCnpj: data.customerCpfCnpj,
      nome: data.customerName,
    },
    mensagensInstrucao: {
      mensagem1: data.description,
    },
    gerarPdf: true,
    hibrido: data.isHybrid ?? true,
  };

  const result = await this.request('POST', '/cobranca-bancaria/v3/boletos', body);

  return {
    nossoNumero: String(result.nossoNumero ?? ''),
    barcode: String(result.codigoBarras ?? ''),
    digitableLine: String(result.linhaDigitavel ?? ''),
    pixCopyPaste: result.pixCopiaECola as string | undefined,
    pdfUrl: result.pdfUrl as string | undefined,
    status: 'REGISTERED',
    dueDate: data.dueDate,
    amount: data.amount,
  };
}

async cancelBoleto(nossoNumero: string): Promise<void> {
  await this.request('PATCH', `/cobranca-bancaria/v3/boletos/${nossoNumero}/baixar`, {
    motivo: 'SOLICITACAO_CEDENTE',
  });
}

async getBoleto(nossoNumero: string): Promise<BoletoResult> {
  const result = await this.request('GET', `/cobranca-bancaria/v3/boletos/${nossoNumero}`);

  return {
    nossoNumero: String(result.nossoNumero ?? ''),
    barcode: String(result.codigoBarras ?? ''),
    digitableLine: String(result.linhaDigitavel ?? ''),
    pixCopyPaste: result.pixCopiaECola as string | undefined,
    pdfUrl: result.pdfUrl as string | undefined,
    status: String(result.situacao ?? ''),
    dueDate: String(result.dataVencimento ?? ''),
    amount: Number(result.valor ?? 0),
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/services/banking/sicoob.provider.spec.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/banking/sicoob.provider.ts src/services/banking/sicoob.provider.spec.ts
git commit -m "feat(banking): SicoobProvider boleto V3 hybrid (create, cancel, get)"
```

---

### Task 5: Sicoob Provider — PIX + Payments

**Files:**
- Modify: `src/services/banking/sicoob.provider.ts`
- Modify: `src/services/banking/sicoob.provider.spec.ts`

- [ ] **Step 1: Add PIX + payment tests**

Add to `sicoob.provider.spec.ts`:

```typescript
it('should create a PIX charge', async () => {
  const provider = createProvider();
  mockAuthResponse();
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      txid: 'tx123abc',
      status: 'ATIVA',
      pixCopiaECola: '00020126580014br.gov.bcb.pix...',
      valor: { original: '100.00' },
      calendario: { criacao: '2026-03-31T10:00:00Z' },
    }),
  });

  const result = await provider.createPixCharge({
    amount: 100.00,
    pixKey: '12345678901',
    description: 'Pagamento serviço',
  });

  expect(result.txId).toBe('tx123abc');
  expect(result.status).toBe('ATIVA');
  expect(result.pixCopyPaste).toBeDefined();
});

it('should execute a PIX payment', async () => {
  const provider = createProvider();
  mockAuthResponse();
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      endToEndId: 'E756123456789',
      status: 'REALIZADO',
      valor: '250.00',
      horario: { solicitacao: '2026-03-31T10:30:00Z' },
    }),
  });

  const receipt = await provider.executePixPayment({
    amount: 250.00,
    recipientPixKey: 'joao@email.com',
    recipientName: 'João Silva',
    description: 'Pagamento fornecedor',
  });

  expect(receipt.externalId).toBe('E756123456789');
  expect(receipt.status).toBe('REALIZADO');
  expect(receipt.amount).toBe(250);
});

it('should execute a TED payment', async () => {
  const provider = createProvider();
  mockAuthResponse();
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      idTransacao: 'ted-001',
      status: 'PROCESSANDO',
      valor: 5000.00,
      dataExecucao: '2026-03-31',
    }),
  });

  const receipt = await provider.executePayment({
    method: 'TED',
    amount: 5000.00,
    recipientBankCode: '001',
    recipientAgency: '1234',
    recipientAccount: '56789-0',
    recipientName: 'Empresa XYZ',
    recipientCpfCnpj: '12345678000190',
  });

  expect(receipt.externalId).toBe('ted-001');
  expect(receipt.method).toBe('TED');
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npx vitest run src/services/banking/sicoob.provider.spec.ts`
Expected: FAIL — PIX/payment methods throw "Not implemented yet".

- [ ] **Step 3: Implement PIX + payment methods**

Replace PIX and payment placeholders in `sicoob.provider.ts`:

```typescript
// ── PIX ──

async createPixCharge(data: CreatePixChargeInput): Promise<PixChargeResult> {
  const body: Record<string, unknown> = {
    calendario: {
      expiracao: data.expiresInSeconds ?? 3600,
    },
    valor: {
      original: data.amount.toFixed(2),
    },
    chave: data.pixKey,
    infoAdicionais: [
      { nome: 'Descricao', valor: data.description },
    ],
  };

  if (data.customerCpfCnpj) {
    body.devedor = {
      cpf: data.customerCpfCnpj.length === 11 ? data.customerCpfCnpj : undefined,
      cnpj: data.customerCpfCnpj.length === 14 ? data.customerCpfCnpj : undefined,
      nome: data.customerName ?? '',
    };
  }

  const result = await this.request('POST', '/pix/v2/cob', body);

  return {
    txId: String(result.txid ?? ''),
    status: String(result.status ?? ''),
    pixCopyPaste: String(result.pixCopiaECola ?? ''),
    qrCodeBase64: result.qrCodeBase64 as string | undefined,
    amount: data.amount,
    createdAt: String((result.calendario as Record<string, string>)?.criacao ?? new Date().toISOString()),
  };
}

async getPixCharge(txId: string): Promise<PixChargeResult> {
  const result = await this.request('GET', `/pix/v2/cob/${txId}`);
  const valor = result.valor as Record<string, string>;
  const calendario = result.calendario as Record<string, string>;

  return {
    txId: String(result.txid ?? txId),
    status: String(result.status ?? ''),
    pixCopyPaste: String(result.pixCopiaECola ?? ''),
    amount: parseFloat(valor?.original ?? '0'),
    createdAt: calendario?.criacao ?? '',
  };
}

async executePixPayment(data: ExecutePixPaymentInput): Promise<PaymentReceipt> {
  const body = {
    valor: data.amount.toFixed(2),
    pagador: { chave: data.recipientPixKey },
    favorecido: {
      nome: data.recipientName ?? '',
      cpfCnpj: data.recipientCpfCnpj ?? '',
    },
    descricao: data.description ?? '',
  };

  const result = await this.request('POST', '/pix/v2/pagamentos/pix', body);

  return {
    externalId: String(result.endToEndId ?? result.idTransacao ?? ''),
    method: 'PIX',
    amount: data.amount,
    status: String(result.status ?? 'PROCESSANDO'),
    executedAt: new Date().toISOString(),
    recipientName: data.recipientName,
    receiptData: result,
  };
}

// ── Payments (TED / Boleto) ──

async executePayment(data: ExecutePaymentInput): Promise<PaymentReceipt> {
  if (data.method === 'TED') {
    const body = {
      valor: data.amount,
      contaDestino: {
        banco: data.recipientBankCode,
        agencia: data.recipientAgency,
        conta: data.recipientAccount,
        nome: data.recipientName,
        cpfCnpj: data.recipientCpfCnpj,
      },
    };

    const result = await this.request('POST', '/conta-corrente/v4/transferencias/ted', body);

    return {
      externalId: String(result.idTransacao ?? ''),
      method: 'TED',
      amount: data.amount,
      status: String(result.status ?? 'PROCESSANDO'),
      executedAt: new Date().toISOString(),
      recipientName: data.recipientName,
      receiptData: result,
    };
  }

  // Boleto payment
  if (data.method === 'BOLETO' && data.barcode) {
    const body = {
      codigoBarras: data.barcode,
      valor: data.amount,
      dataVencimento: data.dueDate,
    };

    const result = await this.request('POST', '/pagamentos/v2/boletos', body);

    return {
      externalId: String(result.idPagamento ?? ''),
      method: 'BOLETO',
      amount: data.amount,
      status: String(result.status ?? 'PROCESSANDO'),
      executedAt: new Date().toISOString(),
      receiptData: result,
    };
  }

  throw new Error(`Unsupported payment method: ${data.method}`);
}

async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
  const result = await this.request('GET', `/pagamentos/v2/${paymentId}`);

  return {
    externalId: paymentId,
    status: this.mapPaymentStatus(String(result.status ?? '')),
    amount: Number(result.valor ?? 0),
    executedAt: result.dataExecucao as string | undefined,
    errorMessage: result.mensagemErro as string | undefined,
  };
}

private mapPaymentStatus(status: string): PaymentStatus['status'] {
  const map: Record<string, PaymentStatus['status']> = {
    PROCESSANDO: 'PROCESSING',
    REALIZADO: 'COMPLETED',
    AGENDADO: 'PENDING',
    REJEITADO: 'FAILED',
    DEVOLVIDO: 'RETURNED',
  };
  return map[status] ?? 'PENDING';
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/services/banking/sicoob.provider.spec.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/banking/sicoob.provider.ts src/services/banking/sicoob.provider.spec.ts
git commit -m "feat(banking): SicoobProvider PIX charges, PIX payments, TED, boleto payment"
```

---

### Task 6: Payment Orders — Repository + Use Cases

**Files:**
- Create: `src/repositories/finance/payment-orders-repository.ts`
- Create: `src/repositories/finance/prisma/prisma-payment-orders-repository.ts`
- Create: `src/repositories/finance/in-memory/in-memory-payment-orders-repository.ts`
- Create: `src/use-cases/finance/payment-orders/create-payment-order.ts`
- Create: `src/use-cases/finance/payment-orders/create-payment-order.spec.ts`
- Create: `src/use-cases/finance/payment-orders/approve-payment-order.ts`
- Create: `src/use-cases/finance/payment-orders/approve-payment-order.spec.ts`
- Create: `src/use-cases/finance/payment-orders/reject-payment-order.ts`
- Create: `src/use-cases/finance/payment-orders/list-payment-orders.ts`
- Create: `src/use-cases/finance/payment-orders/get-payment-order.ts`
- Create: `src/use-cases/finance/payment-orders/factories/`

This task is large — implement the repository interface, in-memory implementation, then each use case with TDD. Follow the exact same patterns as existing finance use cases (e.g., `src/use-cases/finance/entries/`).

Key business rules:
- `createPaymentOrder`: validates entry exists + is PENDING/OVERDUE, validates bank account has `apiEnabled`, creates order with `PENDING_APPROVAL`
- `approvePaymentOrder`: validates order is `PENDING_APPROVAL`, validates approver !== requester (segregation), calls `bankingProvider.executePixPayment()` or `executePayment()`, on success marks `COMPLETED` + generates receipt + marks entry as `PAID`, on failure marks `FAILED`
- `rejectPaymentOrder`: validates order is `PENDING_APPROVAL`, sets `REJECTED` with reason

Each use case follows the project's factory pattern with `make-*-use-case.ts` files.

- [ ] **Step 1-15: Implement repository + 5 use cases with tests (TDD for each)**

Follow the standard create-test-first, implement, verify, commit cycle for each use case.

- [ ] **Step 16: Commit all**

```bash
git add src/repositories/finance/payment-orders* src/use-cases/finance/payment-orders/
git commit -m "feat(finance): PaymentOrder use cases with approval workflow"
```

---

### Task 7: Boleto + PIX Use Cases

**Files:**
- Create: `src/use-cases/finance/boleto/emit-boleto.ts`
- Create: `src/use-cases/finance/boleto/emit-boleto.spec.ts`
- Create: `src/use-cases/finance/boleto/cancel-boleto.ts`
- Create: `src/use-cases/finance/boleto/get-boleto.ts`
- Create: `src/use-cases/finance/pix/create-pix-charge.ts`
- Create: `src/use-cases/finance/pix/create-pix-charge.spec.ts`
- Create: `src/use-cases/finance/pix/get-pix-charge.ts`
- Create: factories for each

Key business rules:
- `emitBoleto`: validates entry is RECEIVABLE + PENDING, resolves provider from bank account, calls `provider.createBoleto()`, saves PDF as `FinanceAttachment`, updates entry with `boletoBarcode`/`boletoDigitLine`
- `createPixCharge`: validates entry is RECEIVABLE, calls `provider.createPixCharge()`, saves QR code data on entry

- [ ] **Step 1-10: Implement with TDD**

- [ ] **Step 11: Commit**

```bash
git add src/use-cases/finance/boleto/ src/use-cases/finance/pix/
git commit -m "feat(finance): boleto emission and PIX charge use cases"
```

---

### Task 8: Webhook Processing

**Files:**
- Create: `src/repositories/finance/bank-webhook-events-repository.ts`
- Create: `src/repositories/finance/prisma/prisma-bank-webhook-events-repository.ts`
- Create: `src/repositories/finance/in-memory/in-memory-bank-webhook-events-repository.ts`
- Create: `src/use-cases/finance/webhooks/process-bank-webhook.ts`
- Create: `src/use-cases/finance/webhooks/process-bank-webhook.spec.ts`

Key business rules:
- Validate webhook signature
- Parse payload via `provider.handleWebhookPayload()`
- Match entry by `nossoNumero` (boleto) or `txId` (PIX)
- If matched + amount <= bank account `autoLowThreshold`: auto-settle entry (change status to `RECEIVED`/`PAID`)
- If matched + amount > threshold: create `BankWebhookEvent` with `autoSettled: false`
- If not matched: create `BankWebhookEvent` with `matchedEntryId: null`
- Always store raw payload

Implement webhook handler in `sicoob.provider.ts`:

```typescript
async registerWebhook(url: string, _events: WebhookEvent[]): Promise<void> {
  await this.request('PUT', `/pix/v2/webhook/${this.config.accountNumber}`, {
    webhookUrl: url,
  });
}

async handleWebhookPayload(payload: unknown): Promise<WebhookResult> {
  const data = payload as Record<string, unknown>;
  const pix = (data.pix as Record<string, unknown>[])?.[0];

  if (pix) {
    return {
      eventType: 'PIX_RECEIVED',
      externalId: String(pix.txid ?? pix.endToEndId ?? ''),
      amount: parseFloat(String(pix.valor ?? '0')),
      paidAt: String(pix.horario ?? new Date().toISOString()),
      payerName: (pix.pagador as Record<string, string>)?.nome,
      payerCpfCnpj: (pix.pagador as Record<string, string>)?.cpf,
      rawPayload: data,
    };
  }

  throw new Error('Unknown webhook payload format');
}
```

- [ ] **Step 1-8: Implement with TDD**

- [ ] **Step 9: Commit**

```bash
git add src/repositories/finance/bank-webhook* src/use-cases/finance/webhooks/ src/services/banking/sicoob.provider.ts
git commit -m "feat(finance): webhook processing with auto-settlement and threshold"
```

---

### Task 9: HTTP Controllers + Routes

**Files:**
- Create: `src/http/controllers/finance/payment-orders/` (6 controllers)
- Create: `src/http/controllers/finance/boleto/` (3 controllers)
- Create: `src/http/controllers/finance/pix/` (2 controllers)
- Create: `src/http/controllers/finance/webhooks/` (1 controller)
- Modify: `src/http/controllers/finance/routes.ts` (register new routes)

Follow existing controller patterns exactly. Each controller:
1. Uses `preHandler: [verifyJwt, verifyTenant, createPermissionMiddleware({...})]`
2. Has Zod schema for request validation
3. Calls the use case via factory

Webhook controller is special — no auth middleware (banks call it directly), but validates signature.

Endpoints:
```
POST   /v1/finance/payment-orders                    (create)
GET    /v1/finance/payment-orders                    (list)
GET    /v1/finance/payment-orders/:id                (get)
POST   /v1/finance/payment-orders/:id/approve        (approve)
POST   /v1/finance/payment-orders/:id/reject         (reject)
POST   /v1/finance/boleto/emit                       (emit boleto for entry)
DELETE /v1/finance/boleto/:nossoNumero                (cancel)
GET    /v1/finance/boleto/:nossoNumero                (get)
POST   /v1/finance/pix/charge                        (create PIX charge for entry)
GET    /v1/finance/pix/charge/:txId                   (get)
POST   /v1/finance/webhooks/sicoob                   (webhook receiver)
```

- [ ] **Step 1-12: Create each controller following project pattern**

- [ ] **Step 13: Register routes**

- [ ] **Step 14: Commit**

```bash
git add src/http/controllers/finance/payment-orders/ src/http/controllers/finance/boleto/ src/http/controllers/finance/pix/ src/http/controllers/finance/webhooks/
git commit -m "feat(finance): HTTP controllers for payment orders, boleto, PIX, and webhooks"
```

---

### Task 10: Frontend — Payment Orders Page + Modals

**Files:**
- Create: `OpenSea-APP/src/app/(dashboard)/(modules)/finance/payment-orders/page.tsx`
- Create: `OpenSea-APP/src/components/finance/payment-order-modal.tsx`
- Create: `OpenSea-APP/src/components/finance/payment-approval-card.tsx`
- Create: `OpenSea-APP/src/components/finance/payment-receipt-viewer.tsx`
- Create: `OpenSea-APP/src/hooks/finance/use-payment-orders.ts`
- Create: `OpenSea-APP/src/services/finance/payment-orders.service.ts`
- Create: `OpenSea-APP/src/types/finance/payment-order.types.ts`
- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/finance/page.tsx` (add to dashboard nav)

Follow all existing frontend patterns (PageLayout, EntityGrid, infinite scroll, permission-gating, PIN confirmation for approve/reject).

The payment-orders listing shows cards grouped by status with approve/reject actions for directors.

- [ ] **Step 1-8: Implement types, service, hooks, page, modals**

- [ ] **Step 9: Commit**

```bash
git add OpenSea-APP/src/
git commit -m "feat(finance): payment orders page with approval workflow UI"
```

---

### Task 11: Frontend — Bank API Setup + Boleto/PIX Modals

**Files:**
- Create: `OpenSea-APP/src/components/finance/bank-api-setup-modal.tsx`
- Create: `OpenSea-APP/src/components/finance/boleto-emit-modal.tsx`
- Modify: `OpenSea-APP/src/components/finance/pix-charge-modal.tsx` (adapt for real Sicoob)
- Modify: `OpenSea-APP/src/app/(dashboard)/(modules)/finance/(entities)/bank-accounts/[id]/page.tsx` (add API setup tab)

The bank-api-setup-modal allows:
1. Select provider (Sicoob, etc.)
2. Enter client_id
3. Upload certificate files (integrates with Storage file manager)
4. Select scopes via checkboxes
5. Toggle apiEnabled
6. Test connection button
7. Configure autoEmitBoleto and autoLowThreshold

- [ ] **Step 1-6: Implement modals and integrate into bank account detail page**

- [ ] **Step 7: Commit**

```bash
git add OpenSea-APP/src/
git commit -m "feat(finance): bank API setup modal, boleto emission, PIX charge integration"
```
