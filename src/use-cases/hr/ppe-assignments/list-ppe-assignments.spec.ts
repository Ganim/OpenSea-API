import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPPEAssignmentsRepository } from '@/repositories/hr/in-memory/in-memory-ppe-assignments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPPEAssignmentsUseCase } from './list-ppe-assignments';

let ppeAssignmentsRepository: InMemoryPPEAssignmentsRepository;
let sut: ListPPEAssignmentsUseCase;
const tenantId = new UniqueEntityID().toString();
const employeeIdA = new UniqueEntityID().toString();
const employeeIdB = new UniqueEntityID().toString();
const ppeItemIdA = new UniqueEntityID().toString();
const ppeItemIdB = new UniqueEntityID().toString();

describe('List PPE Assignments Use Case', () => {
  beforeEach(async () => {
    ppeAssignmentsRepository = new InMemoryPPEAssignmentsRepository();
    sut = new ListPPEAssignmentsUseCase(ppeAssignmentsRepository);

    await ppeAssignmentsRepository.create({
      tenantId,
      ppeItemId: ppeItemIdA,
      employeeId: employeeIdA,
      quantity: 1,
      condition: 'NEW',
    });

    await ppeAssignmentsRepository.create({
      tenantId,
      ppeItemId: ppeItemIdB,
      employeeId: employeeIdA,
      quantity: 2,
      condition: 'NEW',
    });

    await ppeAssignmentsRepository.create({
      tenantId,
      ppeItemId: ppeItemIdA,
      employeeId: employeeIdB,
      quantity: 1,
      condition: 'NEW',
    });
  });

  it('should list all assignments for a tenant', async () => {
    const { assignments, total } = await sut.execute({ tenantId });

    expect(assignments).toHaveLength(3);
    expect(total).toBe(3);
  });

  it('should filter by employeeId', async () => {
    const { assignments, total } = await sut.execute({
      tenantId,
      employeeId: employeeIdA,
    });

    expect(assignments).toHaveLength(2);
    expect(total).toBe(2);
  });

  it('should filter by ppeItemId', async () => {
    const { assignments, total } = await sut.execute({
      tenantId,
      ppeItemId: ppeItemIdA,
    });

    expect(assignments).toHaveLength(2);
    expect(total).toBe(2);
  });

  it('should filter by status', async () => {
    const { assignments, total } = await sut.execute({
      tenantId,
      status: 'ACTIVE',
    });

    expect(assignments).toHaveLength(3);
    expect(total).toBe(3);
  });

  it('should paginate results', async () => {
    const { assignments, total } = await sut.execute({
      tenantId,
      page: 1,
      perPage: 2,
    });

    expect(assignments).toHaveLength(2);
    expect(total).toBe(3);
  });
});
