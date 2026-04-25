import { describe, expect, it } from 'vitest';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Order } from '@/entities/sales/order';
import { PosFiscalConfig } from '@/entities/sales/pos-fiscal-config';
import { OrderOriginSource } from '@/entities/sales/value-objects/order-origin-source';
import { PosFiscalDocumentType } from '@/entities/sales/value-objects/pos-fiscal-document-type';
import { PosFiscalEmissionMode } from '@/entities/sales/value-objects/pos-fiscal-emission-mode';

import {
  generateMockAccessKey,
  type EmitNfceRequest,
} from './fiscal-sefaz-service';
import { MockedFiscalSefazService } from './mocked-fiscal-sefaz-service';

function buildEmitRequest(): EmitNfceRequest {
  const order = Order.create({
    tenantId: new UniqueEntityID('tenant-fiscal-mock'),
    orderNumber: 'PDV-00010',
    type: 'ORDER',
    customerId: new UniqueEntityID('customer-1'),
    pipelineId: new UniqueEntityID('pipeline-pdv'),
    stageId: new UniqueEntityID('stage-open'),
    channel: 'PDV',
    subtotal: 100,
    originSource: OrderOriginSource.POS_DESKTOP(),
  });

  const fiscalConfig = PosFiscalConfig.create({
    tenantId: 'tenant-fiscal-mock',
    enabledDocumentTypes: [PosFiscalDocumentType.NFC_E()],
    defaultDocumentType: PosFiscalDocumentType.NFC_E(),
    emissionMode: PosFiscalEmissionMode.ONLINE_SYNC(),
    nfceSeries: 1,
    nfceNextNumber: 100,
  });

  return { order, fiscalConfig, documentNumber: 100 };
}

describe('generateMockAccessKey()', () => {
  it('returns a 44-character numeric string', () => {
    const key = generateMockAccessKey();
    expect(key).toHaveLength(44);
    expect(key).toMatch(/^\d{44}$/);
  });

  it('produces a fresh value on every call (extremely high probability)', () => {
    const keys = new Set(
      Array.from({ length: 50 }, () => generateMockAccessKey()),
    );
    // 50 random 44-digit strings collide with negligible probability;
    // anything fewer than 50 unique values would indicate a deterministic bug.
    expect(keys.size).toBe(50);
  });
});

describe('MockedFiscalSefazService', () => {
  it('always returns AUTHORIZED with a well-formed access key', async () => {
    const service = new MockedFiscalSefazService();

    const result = await service.emitNfce(buildEmitRequest());

    expect(result.status).toBe('AUTHORIZED');
    if (result.status !== 'AUTHORIZED') return;
    expect(result.documentType).toBe('NFC_E');
    expect(result.documentNumber).toBe(100);
    expect(result.accessKey).toMatch(/^\d{44}$/);
    expect(result.authorizationProtocol).toMatch(/^mock-prot-\d+$/);
    expect(result.xml).toBe('<mock/>');
  });

  it('echoes the documentNumber the caller reserved', async () => {
    const service = new MockedFiscalSefazService();

    const requestWithSpecificNumber = buildEmitRequest();
    requestWithSpecificNumber.documentNumber = 42_777;

    const result = await service.emitNfce(requestWithSpecificNumber);

    expect(result.status).toBe('AUTHORIZED');
    if (result.status !== 'AUTHORIZED') return;
    expect(result.documentNumber).toBe(42_777);
  });
});
