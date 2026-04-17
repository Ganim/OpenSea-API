import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { InMemoryCustomerPortalAccessesRepository } from '@/repositories/finance/in-memory/in-memory-customer-portal-accesses-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GeneratePortalPaymentUseCase } from './generate-portal-payment';

let portalRepository: InMemoryCustomerPortalAccessesRepository;
let entriesRepository: InMemoryFinanceEntriesRepository;
let sut: GeneratePortalPaymentUseCase;

describe('GeneratePortalPaymentUseCase', () => {
  beforeEach(() => {
    portalRepository = new InMemoryCustomerPortalAccessesRepository();
    entriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new GeneratePortalPaymentUseCase(portalRepository, entriesRepository);
  });

  it('should generate a PIX payment for a pending invoice', async () => {
    await portalRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      customerName: 'Acme Corporation',
      accessToken: 'cpt_valid_token',
    });

    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Fatura Janeiro',
      categoryId: 'cat-1',
      expectedAmount: 1500,
      issueDate: new Date(),
      dueDate: new Date(),
      customerName: 'Acme Corporation',
    });

    const result = await sut.execute({
      token: 'cpt_valid_token',
      invoiceId: entry.id.toString(),
      method: 'PIX',
    });

    expect(result.invoiceId).toBe(entry.id.toString());
    expect(result.method).toBe('PIX');
    expect(result.amount).toBe(1500);
  });

  it('should return pixCopiaECola as a real EMV BR Code (not the raw key) when invoice has a pixKey', async () => {
    await portalRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      customerName: 'Acme Corporation',
      accessToken: 'cpt_valid_token',
    });

    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Fatura Fevereiro',
      categoryId: 'cat-1',
      expectedAmount: 250.5,
      issueDate: new Date(),
      dueDate: new Date(),
      customerName: 'Acme Corporation',
      pixKey: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    });

    const result = await sut.execute({
      token: 'cpt_valid_token',
      invoiceId: entry.id.toString(),
      method: 'PIX',
    });

    expect(result.pixKey).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    expect(result.pixCopiaECola).not.toBeNull();
    expect(result.pixCopiaECola).not.toBe(result.pixKey);
    expect(result.pixCopiaECola!.startsWith('000201')).toBe(true);
    expect(result.pixCopiaECola).toContain('br.gov.bcb.pix');
  });

  it('should return pixCopiaECola as null when invoice has no pixKey', async () => {
    await portalRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      customerName: 'Acme Corporation',
      accessToken: 'cpt_valid_token',
    });

    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Fatura sem PIX',
      categoryId: 'cat-1',
      expectedAmount: 100,
      issueDate: new Date(),
      dueDate: new Date(),
      customerName: 'Acme Corporation',
    });

    const result = await sut.execute({
      token: 'cpt_valid_token',
      invoiceId: entry.id.toString(),
      method: 'PIX',
    });

    expect(result.pixKey).toBeNull();
    expect(result.pixCopiaECola).toBeNull();
  });

  it('should generate a BOLETO payment for a pending invoice', async () => {
    await portalRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      customerName: 'Acme Corporation',
      accessToken: 'cpt_valid_token',
    });

    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Fatura Janeiro',
      categoryId: 'cat-1',
      expectedAmount: 2000,
      issueDate: new Date(),
      dueDate: new Date(),
      customerName: 'Acme Corporation',
    });

    const result = await sut.execute({
      token: 'cpt_valid_token',
      invoiceId: entry.id.toString(),
      method: 'BOLETO',
    });

    expect(result.invoiceId).toBe(entry.id.toString());
    expect(result.method).toBe('BOLETO');
    expect(result.amount).toBe(2000);
  });

  it('should reject an invalid token', async () => {
    await expect(
      sut.execute({
        token: 'cpt_invalid_token',
        invoiceId: 'any-id',
        method: 'PIX',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('should reject payment for non-existent invoice', async () => {
    await portalRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      customerName: 'Acme Corporation',
      accessToken: 'cpt_valid_token',
    });

    await expect(
      sut.execute({
        token: 'cpt_valid_token',
        invoiceId: 'non-existent-id',
        method: 'PIX',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should reject payment for already paid invoice', async () => {
    await portalRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      customerName: 'Acme Corporation',
      accessToken: 'cpt_valid_token',
    });

    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Fatura Janeiro',
      categoryId: 'cat-1',
      expectedAmount: 1500,
      issueDate: new Date(),
      dueDate: new Date(),
      customerName: 'Acme Corporation',
      status: 'RECEIVED',
      paymentDate: new Date(),
      actualAmount: 1500,
    });

    await expect(
      sut.execute({
        token: 'cpt_valid_token',
        invoiceId: entry.id.toString(),
        method: 'PIX',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
