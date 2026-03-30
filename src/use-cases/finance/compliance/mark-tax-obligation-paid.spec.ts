import { InMemoryTaxObligationsRepository } from '@/repositories/finance/in-memory/in-memory-tax-obligations-repository';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { beforeEach, describe, expect, it } from 'vitest';
import { MarkTaxObligationPaidUseCase } from './mark-tax-obligation-paid';

let taxObligationsRepository: InMemoryTaxObligationsRepository;
let sut: MarkTaxObligationPaidUseCase;

describe('MarkTaxObligationPaidUseCase', () => {
  beforeEach(async () => {
    taxObligationsRepository = new InMemoryTaxObligationsRepository();
    sut = new MarkTaxObligationPaidUseCase(taxObligationsRepository);

    await taxObligationsRepository.create({
      tenantId: 'tenant-1',
      taxType: 'IRRF',
      referenceMonth: 3,
      referenceYear: 2026,
      dueDate: new Date('2026-04-30'),
      amount: 1500,
      darfCode: '0561',
    });
  });

  it('should mark a pending obligation as paid', async () => {
    const { obligations } = await taxObligationsRepository.findMany({
      tenantId: 'tenant-1',
    });
    const obligationId = obligations[0].id.toString();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      obligationId,
      paidAt: new Date('2026-04-28'),
    });

    expect(result.obligation.status).toBe('PAID');
    expect(result.obligation.paidAt).toEqual(new Date('2026-04-28'));
  });

  it('should link to a finance entry when entryId is provided', async () => {
    const { obligations } = await taxObligationsRepository.findMany({
      tenantId: 'tenant-1',
    });
    const obligationId = obligations[0].id.toString();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      obligationId,
      paidAt: new Date('2026-04-28'),
      entryId: 'entry-123',
    });

    expect(result.obligation.entryId).toBe('entry-123');
  });

  it('should throw ResourceNotFoundError for non-existent obligation', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        obligationId: 'non-existent-id',
        paidAt: new Date(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw error when obligation is already paid', async () => {
    const { obligations } = await taxObligationsRepository.findMany({
      tenantId: 'tenant-1',
    });
    const obligationId = obligations[0].id.toString();

    // Pay first time
    await sut.execute({
      tenantId: 'tenant-1',
      obligationId,
      paidAt: new Date('2026-04-28'),
    });

    // Try to pay again
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        obligationId,
        paidAt: new Date('2026-04-29'),
      }),
    ).rejects.toThrow('Esta obrigação tributária já foi paga');
  });

  it('should throw error when obligation is cancelled', async () => {
    const { obligations } = await taxObligationsRepository.findMany({
      tenantId: 'tenant-1',
    });
    const obligation = obligations[0];
    obligation.cancel();
    await taxObligationsRepository.update(obligation);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        obligationId: obligation.id.toString(),
        paidAt: new Date(),
      }),
    ).rejects.toThrow(
      'Não é possível pagar uma obrigação tributária cancelada',
    );
  });
});
