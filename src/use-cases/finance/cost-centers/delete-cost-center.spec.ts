import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCostCentersRepository } from '@/repositories/finance/in-memory/in-memory-cost-centers-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';

import { DeleteCostCenterUseCase } from './delete-cost-center';

let costCentersRepository: InMemoryCostCentersRepository;
let financeEntriesRepository: InMemoryFinanceEntriesRepository;
let sut: DeleteCostCenterUseCase;

describe('DeleteCostCenterUseCase', () => {
  beforeEach(() => {
    costCentersRepository = new InMemoryCostCentersRepository();
    financeEntriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new DeleteCostCenterUseCase(
      costCentersRepository,
      financeEntriesRepository,
    );
  });

  it('should soft delete a cost center', async () => {
    const costCenter = await costCentersRepository.create({
      tenantId: 'tenant-1',
      code: 'CC-001',
      name: 'Marketing',
    });

    await sut.execute({
      tenantId: 'tenant-1',
      id: costCenter.id.toString(),
    });

    const foundCostCenter = await costCentersRepository.findById(
      costCenter.id,
      'tenant-1',
    );

    expect(foundCostCenter).toBeNull();

    const deletedCostCenter = costCentersRepository.items.find((i) =>
      i.id.equals(costCenter.id),
    );
    expect(deletedCostCenter?.deletedAt).toBeDefined();
  });

  it('should throw ResourceNotFoundError if cost center not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError when cost center has pending entries', async () => {
    const costCenter = await costCentersRepository.create({
      tenantId: 'tenant-1',
      code: 'CC-002',
      name: 'Operations',
    });

    await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-001',
      description: 'Supplier invoice',
      categoryId: new UniqueEntityID().toString(),
      costCenterId: costCenter.id.toString(),
      expectedAmount: 1500,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: costCenter.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should allow deletion when all entries are paid or cancelled', async () => {
    const costCenter = await costCentersRepository.create({
      tenantId: 'tenant-1',
      code: 'CC-003',
      name: 'Completed Projects',
    });

    await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAY-002',
      description: 'Paid invoice',
      categoryId: new UniqueEntityID().toString(),
      costCenterId: costCenter.id.toString(),
      expectedAmount: 1000,
      issueDate: new Date(),
      dueDate: new Date(),
      status: 'PAID',
    });

    await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Cancelled receivable',
      categoryId: new UniqueEntityID().toString(),
      costCenterId: costCenter.id.toString(),
      expectedAmount: 500,
      issueDate: new Date(),
      dueDate: new Date(),
      status: 'CANCELLED',
    });

    await sut.execute({
      tenantId: 'tenant-1',
      id: costCenter.id.toString(),
    });

    const foundCostCenter = await costCentersRepository.findById(
      costCenter.id,
      'tenant-1',
    );

    expect(foundCostCenter).toBeNull();
  });
});
