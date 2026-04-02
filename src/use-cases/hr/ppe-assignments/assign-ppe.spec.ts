import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPPEAssignmentsRepository } from '@/repositories/hr/in-memory/in-memory-ppe-assignments-repository';
import { InMemoryPPEItemsRepository } from '@/repositories/hr/in-memory/in-memory-ppe-items-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AssignPPEUseCase } from './assign-ppe';

let ppeAssignmentsRepository: InMemoryPPEAssignmentsRepository;
let ppeItemsRepository: InMemoryPPEItemsRepository;
let sut: AssignPPEUseCase;
const tenantId = new UniqueEntityID().toString();
const employeeId = new UniqueEntityID().toString();

describe('Assign PPE Use Case', () => {
  beforeEach(() => {
    ppeAssignmentsRepository = new InMemoryPPEAssignmentsRepository();
    ppeItemsRepository = new InMemoryPPEItemsRepository();
    sut = new AssignPPEUseCase(ppeAssignmentsRepository, ppeItemsRepository);
  });

  it('should assign a PPE item to an employee', async () => {
    const ppeItem = await ppeItemsRepository.create({
      tenantId,
      name: 'Capacete de Segurança',
      category: 'HEAD',
      currentStock: 10,
    });

    const { assignment } = await sut.execute({
      tenantId,
      ppeItemId: ppeItem.id.toString(),
      employeeId,
      quantity: 1,
    });

    expect(assignment).toBeDefined();
    expect(assignment.status).toBe('ACTIVE');
    expect(assignment.condition).toBe('NEW');
    expect(assignment.quantity).toBe(1);

    // Stock should be decremented
    const updatedItem = await ppeItemsRepository.findById(ppeItem.id, tenantId);
    expect(updatedItem!.currentStock).toBe(9);
  });

  it('should calculate expiration date from item expirationMonths', async () => {
    const ppeItem = await ppeItemsRepository.create({
      tenantId,
      name: 'Luva Descartável',
      category: 'HANDS',
      currentStock: 100,
      expirationMonths: 6,
    });

    const { assignment } = await sut.execute({
      tenantId,
      ppeItemId: ppeItem.id.toString(),
      employeeId,
      quantity: 2,
    });

    expect(assignment.expiresAt).toBeDefined();
  });

  it('should throw error when quantity is less than 1', async () => {
    const ppeItem = await ppeItemsRepository.create({
      tenantId,
      name: 'Capacete',
      category: 'HEAD',
      currentStock: 10,
    });

    await expect(
      sut.execute({
        tenantId,
        ppeItemId: ppeItem.id.toString(),
        employeeId,
        quantity: 0,
      }),
    ).rejects.toThrow('A quantidade deve ser pelo menos 1');
  });

  it('should throw error when PPE item is not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        ppeItemId: new UniqueEntityID().toString(),
        employeeId,
        quantity: 1,
      }),
    ).rejects.toThrow('EPI não encontrado');
  });

  it('should throw error when PPE item is inactive', async () => {
    const ppeItem = await ppeItemsRepository.create({
      tenantId,
      name: 'EPI Inativo',
      category: 'BODY',
      currentStock: 10,
      isActive: false,
    });

    await expect(
      sut.execute({
        tenantId,
        ppeItemId: ppeItem.id.toString(),
        employeeId,
        quantity: 1,
      }),
    ).rejects.toThrow('Este EPI está inativo e não pode ser atribuído');
  });

  it('should throw error when stock is insufficient', async () => {
    const ppeItem = await ppeItemsRepository.create({
      tenantId,
      name: 'Capacete',
      category: 'HEAD',
      currentStock: 2,
    });

    await expect(
      sut.execute({
        tenantId,
        ppeItemId: ppeItem.id.toString(),
        employeeId,
        quantity: 5,
      }),
    ).rejects.toThrow('Estoque insuficiente');
  });
});
