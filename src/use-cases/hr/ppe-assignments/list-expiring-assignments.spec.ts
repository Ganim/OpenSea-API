import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPPEAssignmentsRepository } from '@/repositories/hr/in-memory/in-memory-ppe-assignments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListExpiringAssignmentsUseCase } from './list-expiring-assignments';

let ppeAssignmentsRepository: InMemoryPPEAssignmentsRepository;
let sut: ListExpiringAssignmentsUseCase;
const tenantId = new UniqueEntityID().toString();
const employeeId = new UniqueEntityID().toString();
const ppeItemId = new UniqueEntityID().toString();

describe('List Expiring Assignments Use Case', () => {
  beforeEach(async () => {
    ppeAssignmentsRepository = new InMemoryPPEAssignmentsRepository();
    sut = new ListExpiringAssignmentsUseCase(ppeAssignmentsRepository);

    // Expiring in 10 days
    const expiresIn10Days = new Date();
    expiresIn10Days.setDate(expiresIn10Days.getDate() + 10);

    await ppeAssignmentsRepository.create({
      tenantId,
      ppeItemId,
      employeeId,
      quantity: 1,
      condition: 'NEW',
      expiresAt: expiresIn10Days,
    });

    // Expiring in 60 days
    const expiresIn60Days = new Date();
    expiresIn60Days.setDate(expiresIn60Days.getDate() + 60);

    await ppeAssignmentsRepository.create({
      tenantId,
      ppeItemId,
      employeeId,
      quantity: 1,
      condition: 'NEW',
      expiresAt: expiresIn60Days,
    });

    // No expiration
    await ppeAssignmentsRepository.create({
      tenantId,
      ppeItemId,
      employeeId,
      quantity: 1,
      condition: 'NEW',
    });
  });

  it('should list assignments expiring within 30 days', async () => {
    const { assignments, total } = await sut.execute({
      tenantId,
      daysAhead: 30,
    });

    expect(assignments).toHaveLength(1);
    expect(total).toBe(1);
  });

  it('should list assignments expiring within 90 days', async () => {
    const { assignments, total } = await sut.execute({
      tenantId,
      daysAhead: 90,
    });

    expect(assignments).toHaveLength(2);
    expect(total).toBe(2);
  });

  it('should default to 30 days ahead', async () => {
    const { assignments, total } = await sut.execute({ tenantId });

    expect(assignments).toHaveLength(1);
    expect(total).toBe(1);
  });

  it('should return empty for different tenant', async () => {
    const { assignments, total } = await sut.execute({
      tenantId: new UniqueEntityID().toString(),
      daysAhead: 90,
    });

    expect(assignments).toHaveLength(0);
    expect(total).toBe(0);
  });
});
