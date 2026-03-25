import { PixCharge } from '@/entities/cashier/pix-charge';
import { InMemoryPixChargesRepository } from '@/repositories/cashier/in-memory/in-memory-pix-charges-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPixChargesUseCase } from './list-pix-charges';

let pixChargesRepository: InMemoryPixChargesRepository;
let sut: ListPixChargesUseCase;

function createSampleCharge(
  overrides: Partial<{
    tenantId: string;
    txId: string;
    status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  }>,
): PixCharge {
  return PixCharge.create({
    tenantId: overrides.tenantId ?? 'tenant-1',
    txId: overrides.txId ?? `tx-${Math.random().toString(36).slice(2, 10)}`,
    location: 'https://pix.example.com/qr/test',
    pixCopiaECola: '00020126580014br.gov.bcb.pix',
    amount: 100.0,
    status: overrides.status ?? 'ACTIVE',
    expiresAt: new Date('2026-03-26T00:00:00Z'),
    provider: 'MOCK',
  });
}

describe('ListPixChargesUseCase', () => {
  beforeEach(() => {
    pixChargesRepository = new InMemoryPixChargesRepository();
    sut = new ListPixChargesUseCase(pixChargesRepository);
  });

  it('should list charges for a tenant', async () => {
    await pixChargesRepository.create(
      createSampleCharge({ tenantId: 'tenant-1', txId: 'tx-1' }),
    );
    await pixChargesRepository.create(
      createSampleCharge({ tenantId: 'tenant-1', txId: 'tx-2' }),
    );
    await pixChargesRepository.create(
      createSampleCharge({ tenantId: 'tenant-2', txId: 'tx-3' }),
    );

    const { charges, total } = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 20,
    });

    expect(charges).toHaveLength(2);
    expect(total).toBe(2);
  });

  it('should filter charges by status', async () => {
    await pixChargesRepository.create(
      createSampleCharge({
        tenantId: 'tenant-1',
        txId: 'tx-active',
        status: 'ACTIVE',
      }),
    );
    await pixChargesRepository.create(
      createSampleCharge({
        tenantId: 'tenant-1',
        txId: 'tx-completed',
        status: 'COMPLETED',
      }),
    );

    const { charges, total } = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 20,
      status: 'ACTIVE',
    });

    expect(charges).toHaveLength(1);
    expect(total).toBe(1);
    expect(charges[0].status).toBe('ACTIVE');
  });

  it('should paginate results', async () => {
    for (let i = 0; i < 5; i++) {
      await pixChargesRepository.create(
        createSampleCharge({
          tenantId: 'tenant-1',
          txId: `tx-page-${i}`,
        }),
      );
    }

    const page1 = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 2,
    });
    const page2 = await sut.execute({
      tenantId: 'tenant-1',
      page: 2,
      limit: 2,
    });

    expect(page1.charges).toHaveLength(2);
    expect(page1.total).toBe(5);
    expect(page2.charges).toHaveLength(2);
  });

  it('should return empty list when no charges exist', async () => {
    const { charges, total } = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 20,
    });

    expect(charges).toHaveLength(0);
    expect(total).toBe(0);
  });
});
