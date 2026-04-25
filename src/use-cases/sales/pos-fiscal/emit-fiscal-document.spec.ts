import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Order } from '@/entities/sales/order';
import { PosFiscalConfig } from '@/entities/sales/pos-fiscal-config';
import { OrderOriginSource } from '@/entities/sales/value-objects/order-origin-source';
import { PosFiscalDocumentType } from '@/entities/sales/value-objects/pos-fiscal-document-type';
import { PosFiscalEmissionMode } from '@/entities/sales/value-objects/pos-fiscal-emission-mode';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { InMemoryPosFiscalConfigsRepository } from '@/repositories/sales/in-memory/in-memory-pos-fiscal-configs-repository';
import { MockedFiscalSefazService } from '@/services/fiscal/mocked-fiscal-sefaz-service';
import type {
  EmitNfceRequest,
  FiscalEmissionResult,
  FiscalSefazService,
} from '@/services/fiscal/fiscal-sefaz-service';

import { EmitFiscalDocumentUseCase } from './emit-fiscal-document';

let ordersRepository: InMemoryOrdersRepository;
let posFiscalConfigsRepository: InMemoryPosFiscalConfigsRepository;
let fiscalSefazService: FiscalSefazService;
let sut: EmitFiscalDocumentUseCase;

const tenantId = 'tenant-fiscal-emit';
const userId = 'user-emit';

function buildAndPersistOrder(): Order {
  const order = Order.create({
    tenantId: new UniqueEntityID(tenantId),
    orderNumber: 'PDV-99999',
    type: 'ORDER',
    customerId: new UniqueEntityID('customer-1'),
    pipelineId: new UniqueEntityID('pipeline-pdv'),
    stageId: new UniqueEntityID('stage-open'),
    channel: 'PDV',
    subtotal: 100,
    originSource: OrderOriginSource.POS_DESKTOP(),
  });
  ordersRepository.items.push(order);
  return order;
}

async function persistConfig(
  overrides: {
    emissionMode?: PosFiscalEmissionMode;
    defaultDocumentType?: PosFiscalDocumentType;
    enabledDocumentTypes?: PosFiscalDocumentType[];
    nfceNextNumber?: number | null;
    nfceSeries?: number | null;
  } = {},
): Promise<PosFiscalConfig> {
  const config = PosFiscalConfig.create({
    tenantId,
    enabledDocumentTypes: overrides.enabledDocumentTypes ?? [
      PosFiscalDocumentType.NFC_E(),
    ],
    defaultDocumentType:
      overrides.defaultDocumentType ?? PosFiscalDocumentType.NFC_E(),
    emissionMode: overrides.emissionMode ?? PosFiscalEmissionMode.ONLINE_SYNC(),
    nfceSeries: overrides.nfceSeries ?? 1,
    nfceNextNumber:
      overrides.nfceNextNumber === undefined ? 100 : overrides.nfceNextNumber,
  });
  await posFiscalConfigsRepository.upsert(config);
  return config;
}

describe('EmitFiscalDocumentUseCase', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    posFiscalConfigsRepository = new InMemoryPosFiscalConfigsRepository();
    fiscalSefazService = new MockedFiscalSefazService();
    sut = new EmitFiscalDocumentUseCase(
      ordersRepository,
      posFiscalConfigsRepository,
      fiscalSefazService,
    );
  });

  it('emits an NFC-e online and stamps the Order with authorization data', async () => {
    const order = buildAndPersistOrder();
    await persistConfig();

    const response = await sut.execute({
      tenantId,
      orderId: order.id.toString(),
      userId,
    });

    expect(response.status).toBe('AUTHORIZED');
    expect(response.documentType).toBe('NFC_E');
    expect(response.documentNumber).toBe(100);
    expect(response.accessKey).toMatch(/^\d{44}$/);
    expect(response.authorizationProtocol).toMatch(/^mock-prot-\d+$/);
    expect(response.xml).toBe('<mock/>');

    // Order persistence: the 6 fiscal columns must be set so the next
    // listing/detail call surfaces the authorization metadata.
    const persistedOrder = ordersRepository.items.find(
      (o) => o.id.toString() === order.id.toString(),
    );
    expect(persistedOrder?.fiscalEmissionStatus).toBe('AUTHORIZED');
    expect(persistedOrder?.fiscalDocumentType?.value).toBe('NFC_E');
    expect(persistedOrder?.fiscalDocumentNumber).toBe(100);
    expect(persistedOrder?.fiscalAccessKey).toMatch(/^\d{44}$/);
    expect(persistedOrder?.fiscalEmittedAt).toBeInstanceOf(Date);
  });

  it('increments the tenant nfceNextNumber after a successful emission', async () => {
    const order = buildAndPersistOrder();
    await persistConfig({ nfceNextNumber: 100 });

    const before = (await posFiscalConfigsRepository.findByTenantId(tenantId))!
      .nfceNextNumber;
    await sut.execute({ tenantId, orderId: order.id.toString(), userId });
    const after = (await posFiscalConfigsRepository.findByTenantId(tenantId))!
      .nfceNextNumber;

    expect(before).toBe(100);
    expect(after).toBe(101);
  });

  it('returns ALREADY_EMITTED when the Order has already been authorized (idempotency)', async () => {
    const order = buildAndPersistOrder();
    await persistConfig();

    const firstResponse = await sut.execute({
      tenantId,
      orderId: order.id.toString(),
      userId,
    });
    expect(firstResponse.status).toBe('AUTHORIZED');

    const initialNfceNumber = (await posFiscalConfigsRepository.findByTenantId(
      tenantId,
    ))!.nfceNextNumber;

    const secondResponse = await sut.execute({
      tenantId,
      orderId: order.id.toString(),
      userId,
    });

    expect(secondResponse.status).toBe('ALREADY_EMITTED');
    expect(secondResponse.documentNumber).toBe(firstResponse.documentNumber);
    expect(secondResponse.accessKey).toBe(firstResponse.accessKey);

    // The counter must NOT have advanced on the resync — that was the bug
    // class in Tasks 22/25/29 we explicitly guard against here.
    const finalNfceNumber = (await posFiscalConfigsRepository.findByTenantId(
      tenantId,
    ))!.nfceNextNumber;
    expect(finalNfceNumber).toBe(initialNfceNumber);
  });

  it('returns SKIPPED when the tenant emissionMode is NONE', async () => {
    const order = buildAndPersistOrder();
    await persistConfig({
      emissionMode: PosFiscalEmissionMode.NONE(),
      nfceNextNumber: null,
      nfceSeries: null,
    });

    const response = await sut.execute({
      tenantId,
      orderId: order.id.toString(),
      userId,
    });

    expect(response.status).toBe('SKIPPED');
    expect(response.reason).toMatch(/disabled/i);

    // Order must NOT be touched — fiscal stays null and the counter does
    // not advance.
    const persistedOrder = ordersRepository.items.find(
      (o) => o.id.toString() === order.id.toString(),
    );
    expect(persistedOrder?.fiscalEmittedAt).toBeFalsy();
    expect(persistedOrder?.fiscalEmissionStatus).toBeFalsy();
  });

  it('rejects with BadRequestError when defaultDocumentType is not NFC_E', async () => {
    const order = buildAndPersistOrder();
    await persistConfig({
      enabledDocumentTypes: [PosFiscalDocumentType.NFE()],
      defaultDocumentType: PosFiscalDocumentType.NFE(),
      nfceNextNumber: null,
      nfceSeries: null,
    });

    await expect(
      sut.execute({ tenantId, orderId: order.id.toString(), userId }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects with BadRequestError when emissionMode is OFFLINE_CONTINGENCY', async () => {
    const order = buildAndPersistOrder();
    await persistConfig({
      emissionMode: PosFiscalEmissionMode.OFFLINE_CONTINGENCY(),
    });

    await expect(
      sut.execute({ tenantId, orderId: order.id.toString(), userId }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('throws ResourceNotFoundError when the fiscal configuration does not exist', async () => {
    const order = buildAndPersistOrder();

    await expect(
      sut.execute({ tenantId, orderId: order.id.toString(), userId }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('throws ResourceNotFoundError when the Order does not exist', async () => {
    await persistConfig();

    await expect(
      sut.execute({
        tenantId,
        orderId: '00000000-0000-0000-0000-000000000000',
        userId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('returns REJECTED and persists the rejection status on the Order when SEFAZ rejects', async () => {
    const order = buildAndPersistOrder();
    await persistConfig();

    // Wire a rejection-only SEFAZ stub so we can exercise the unhappy path
    // without depending on the real provider's internals.
    const rejectingService: FiscalSefazService = {
      async emitNfce(_input: EmitNfceRequest): Promise<FiscalEmissionResult> {
        return {
          status: 'REJECTED',
          errorCode: '539',
          errorMessage: 'Duplicidade de NF-e (mock).',
        };
      },
    };

    sut = new EmitFiscalDocumentUseCase(
      ordersRepository,
      posFiscalConfigsRepository,
      rejectingService,
    );

    const response = await sut.execute({
      tenantId,
      orderId: order.id.toString(),
      userId,
    });

    expect(response.status).toBe('REJECTED');
    expect(response.errorCode).toBe('539');
    expect(response.errorMessage).toMatch(/Duplicidade/);

    const persistedOrder = ordersRepository.items.find(
      (o) => o.id.toString() === order.id.toString(),
    );
    expect(persistedOrder?.fiscalEmissionStatus).toBe('REJECTED');
    expect(persistedOrder?.fiscalEmittedAt).toBeFalsy();
    expect(persistedOrder?.fiscalAccessKey).toBeFalsy();
  });
});
