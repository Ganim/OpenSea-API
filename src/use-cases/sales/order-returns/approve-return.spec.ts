import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOrderReturnsRepository } from '@/repositories/sales/in-memory/in-memory-order-returns-repository';
import { makeOrderReturn } from '@/utils/tests/factories/sales/make-order-return';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApproveReturnUseCase } from './approve-return';

let orderReturnsRepository: InMemoryOrderReturnsRepository;
let sut: ApproveReturnUseCase;

const tenantId = 'tenant-1';

describe('Approve Return', () => {
  beforeEach(() => {
    orderReturnsRepository = new InMemoryOrderReturnsRepository();
    sut = new ApproveReturnUseCase(orderReturnsRepository);
  });

  it('should approve a requested return', async () => {
    const orderReturn = makeOrderReturn({
      tenantId: new UniqueEntityID(tenantId),
    });
    orderReturnsRepository.items.push(orderReturn);

    const result = await sut.execute({
      returnId: orderReturn.id.toString(),
      tenantId,
      userId: 'approver-1',
    });

    expect(result.orderReturn.status).toBe('APPROVED');
    expect(result.orderReturn.approvedByUserId?.toString()).toBe('approver-1');
    expect(result.orderReturn.approvedAt).toBeTruthy();
  });

  it('should not approve a non-existing return', async () => {
    await expect(
      sut.execute({
        returnId: 'non-existing',
        tenantId,
        userId: 'approver-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not approve an already approved return', async () => {
    const orderReturn = makeOrderReturn({
      tenantId: new UniqueEntityID(tenantId),
    });
    orderReturn.approve(new UniqueEntityID('approver-1'));
    orderReturnsRepository.items.push(orderReturn);

    await expect(
      sut.execute({
        returnId: orderReturn.id.toString(),
        tenantId,
        userId: 'approver-2',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
