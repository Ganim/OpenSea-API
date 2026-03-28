import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OffboardingChecklist } from '@/entities/hr/offboarding-checklist';
import { InMemoryOffboardingChecklistsRepository } from '@/repositories/hr/in-memory/in-memory-offboarding-checklists-repository';
import { describe, it, expect, beforeEach } from 'vitest';
import { CreateOffboardingChecklistUseCase } from './create-offboarding-checklist';

let offboardingChecklistsRepository: InMemoryOffboardingChecklistsRepository;
let createOffboardingChecklistUseCase: CreateOffboardingChecklistUseCase;

const TENANT_ID = new UniqueEntityID().toString();
const EMPLOYEE_ID = new UniqueEntityID().toString();
const TERMINATION_ID = new UniqueEntityID().toString();

describe('CreateOffboardingChecklistUseCase', () => {
  beforeEach(() => {
    offboardingChecklistsRepository =
      new InMemoryOffboardingChecklistsRepository();
    createOffboardingChecklistUseCase = new CreateOffboardingChecklistUseCase(
      offboardingChecklistsRepository,
    );
  });

  it('should create an offboarding checklist with default items', async () => {
    const { checklist } = await createOffboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
    });

    expect(checklist).toBeInstanceOf(OffboardingChecklist);
    expect(checklist.tenantId.toString()).toBe(TENANT_ID);
    expect(checklist.employeeId.toString()).toBe(EMPLOYEE_ID);
    expect(checklist.items).toHaveLength(14);
    expect(checklist.progress).toBe(0);
    expect(checklist.title).toBe('Checklist de Desligamento');
    expect(checklist.createdAt).toBeInstanceOf(Date);
    expect(checklist.updatedAt).toBeInstanceOf(Date);
  });

  it('should use default items when no custom items are provided', async () => {
    const { checklist } = await createOffboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
    });

    const itemTitles = checklist.items.map((item) => item.title);
    expect(itemTitles).toContain('Comunicar equipe sobre o desligamento');
    expect(itemTitles).toContain('Revogar acesso aos sistemas internos');
    expect(itemTitles).toContain('Cancelar benefícios e planos');
  });

  it('should create a checklist with custom items', async () => {
    const customItems = [
      { title: 'Devolver notebook corporativo' },
      { title: 'Assinar documentação de desligamento' },
    ];

    const { checklist } = await createOffboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
      items: customItems,
    });

    expect(checklist.items).toHaveLength(2);
    expect(checklist.items[0].title).toBe('Devolver notebook corporativo');
    expect(checklist.items[1].title).toBe(
      'Assinar documentação de desligamento',
    );
  });

  it('should link to a termination if provided', async () => {
    const { checklist } = await createOffboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
      terminationId: TERMINATION_ID,
    });

    expect(checklist.terminationId?.toString()).toBe(TERMINATION_ID);
  });

  it('should initialize all items as not completed', async () => {
    const { checklist } = await createOffboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
    });

    for (const item of checklist.items) {
      expect(item.completed).toBe(false);
      expect(item.completedAt).toBeUndefined();
    }
  });

  it('should generate unique ids for each item', async () => {
    const { checklist } = await createOffboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
    });

    const itemIds = checklist.items.map((item) => item.id);
    const uniqueIds = new Set(itemIds);
    expect(uniqueIds.size).toBe(itemIds.length);
  });

  it('should persist the checklist in the repository', async () => {
    await createOffboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
    });

    expect(offboardingChecklistsRepository.items).toHaveLength(1);
    expect(offboardingChecklistsRepository.items[0].employeeId.toString()).toBe(
      EMPLOYEE_ID,
    );
  });

  it('should throw if a checklist already exists for the employee', async () => {
    await createOffboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
    });

    await expect(
      createOffboardingChecklistUseCase.execute({
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
      }),
    ).rejects.toThrow(BadRequestError);

    await expect(
      createOffboardingChecklistUseCase.execute({
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
      }),
    ).rejects.toThrow('Offboarding checklist already exists for this employee');
  });

  it('should allow creating checklists for different employees in the same tenant', async () => {
    const secondEmployeeId = new UniqueEntityID().toString();

    await createOffboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
    });

    const { checklist } = await createOffboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: secondEmployeeId,
    });

    expect(checklist.employeeId.toString()).toBe(secondEmployeeId);
    expect(offboardingChecklistsRepository.items).toHaveLength(2);
  });

  it('should allow creating checklists for the same employee in different tenants', async () => {
    const secondTenantId = new UniqueEntityID().toString();

    await createOffboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
    });

    const { checklist } = await createOffboardingChecklistUseCase.execute({
      tenantId: secondTenantId,
      employeeId: EMPLOYEE_ID,
    });

    expect(checklist.tenantId.toString()).toBe(secondTenantId);
    expect(offboardingChecklistsRepository.items).toHaveLength(2);
  });

  it('should set progress to 0 when all items are incomplete', async () => {
    const { checklist } = await createOffboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
    });

    expect(checklist.progress).toBe(0);
    expect(checklist.isComplete()).toBe(false);
  });
});
