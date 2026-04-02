import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPPEAssignmentsRepository } from '@/repositories/hr/in-memory/in-memory-ppe-assignments-repository';
import { InMemoryPPEItemsRepository } from '@/repositories/hr/in-memory/in-memory-ppe-items-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReturnPPEUseCase } from './return-ppe';

let ppeAssignmentsRepository: InMemoryPPEAssignmentsRepository;
let ppeItemsRepository: InMemoryPPEItemsRepository;
let sut: ReturnPPEUseCase;
const tenantId = new UniqueEntityID().toString();
const employeeId = new UniqueEntityID().toString();

describe('Return PPE Use Case', () => {
  beforeEach(() => {
    ppeAssignmentsRepository = new InMemoryPPEAssignmentsRepository();
    ppeItemsRepository = new InMemoryPPEItemsRepository();
    sut = new ReturnPPEUseCase(ppeAssignmentsRepository, ppeItemsRepository);
  });

  it('should return a PPE assignment in good condition and restore stock', async () => {
    const ppeItem = await ppeItemsRepository.create({
      tenantId,
      name: 'Capacete',
      category: 'HEAD',
      currentStock: 9,
    });

    const createdAssignment = await ppeAssignmentsRepository.create({
      tenantId,
      ppeItemId: ppeItem.id.toString(),
      employeeId,
      quantity: 1,
      condition: 'NEW',
    });

    const { assignment } = await sut.execute({
      tenantId,
      assignmentId: createdAssignment.id.toString(),
      returnCondition: 'GOOD',
    });

    expect(assignment.status).toBe('RETURNED');
    expect(assignment.returnCondition).toBe('GOOD');
    expect(assignment.returnedAt).toBeDefined();

    // Stock should be restored
    const updatedItem = await ppeItemsRepository.findById(ppeItem.id, tenantId);
    expect(updatedItem!.currentStock).toBe(10);
  });

  it('should not restore stock when returned damaged', async () => {
    const ppeItem = await ppeItemsRepository.create({
      tenantId,
      name: 'Luva',
      category: 'HANDS',
      currentStock: 9,
    });

    const createdAssignment = await ppeAssignmentsRepository.create({
      tenantId,
      ppeItemId: ppeItem.id.toString(),
      employeeId,
      quantity: 1,
      condition: 'NEW',
    });

    await sut.execute({
      tenantId,
      assignmentId: createdAssignment.id.toString(),
      returnCondition: 'DAMAGED',
    });

    // Stock should NOT be restored
    const updatedItem = await ppeItemsRepository.findById(ppeItem.id, tenantId);
    expect(updatedItem!.currentStock).toBe(9);
  });

  it('should throw error when assignment is not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        assignmentId: new UniqueEntityID().toString(),
        returnCondition: 'GOOD',
      }),
    ).rejects.toThrow('Atribuição de EPI não encontrada');
  });

  it('should throw error when assignment is not active', async () => {
    const ppeItem = await ppeItemsRepository.create({
      tenantId,
      name: 'Capacete',
      category: 'HEAD',
      currentStock: 10,
    });

    const createdAssignment = await ppeAssignmentsRepository.create({
      tenantId,
      ppeItemId: ppeItem.id.toString(),
      employeeId,
      quantity: 1,
      condition: 'NEW',
    });

    // Return it first
    await ppeAssignmentsRepository.returnAssignment({
      id: createdAssignment.id,
      returnCondition: 'GOOD',
    });

    // Try to return again
    await expect(
      sut.execute({
        tenantId,
        assignmentId: createdAssignment.id.toString(),
        returnCondition: 'GOOD',
      }),
    ).rejects.toThrow('Apenas atribuições ativas podem ser devolvidas');
  });

  it('should throw error when return condition is invalid', async () => {
    const ppeItem = await ppeItemsRepository.create({
      tenantId,
      name: 'Capacete',
      category: 'HEAD',
      currentStock: 10,
    });

    const createdAssignment = await ppeAssignmentsRepository.create({
      tenantId,
      ppeItemId: ppeItem.id.toString(),
      employeeId,
      quantity: 1,
      condition: 'NEW',
    });

    await expect(
      sut.execute({
        tenantId,
        assignmentId: createdAssignment.id.toString(),
        returnCondition: 'INVALID',
      }),
    ).rejects.toThrow('Condição de devolução inválida');
  });
});
