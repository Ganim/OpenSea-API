import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OnboardingChecklist } from '@/entities/hr/onboarding-checklist';
import { InMemoryOnboardingChecklistsRepository } from '@/repositories/hr/in-memory/in-memory-onboarding-checklists-repository';
import { describe, it, expect, beforeEach } from 'vitest';
import { CreateOnboardingChecklistUseCase } from './create-onboarding-checklist';

let onboardingChecklistsRepository: InMemoryOnboardingChecklistsRepository;
let createOnboardingChecklistUseCase: CreateOnboardingChecklistUseCase;

const TENANT_ID = new UniqueEntityID().toString();
const EMPLOYEE_ID = new UniqueEntityID().toString();

describe('CreateOnboardingChecklistUseCase', () => {
  beforeEach(() => {
    onboardingChecklistsRepository =
      new InMemoryOnboardingChecklistsRepository();
    createOnboardingChecklistUseCase = new CreateOnboardingChecklistUseCase(
      onboardingChecklistsRepository,
    );
  });

  it('should create an onboarding checklist with default items', async () => {
    const { checklist } = await createOnboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
    });

    expect(checklist).toBeInstanceOf(OnboardingChecklist);
    expect(checklist.tenantId.toString()).toBe(TENANT_ID);
    expect(checklist.employeeId.toString()).toBe(EMPLOYEE_ID);
    expect(checklist.items).toHaveLength(5);
    expect(checklist.progress).toBe(0);
    expect(checklist.createdAt).toBeInstanceOf(Date);
    expect(checklist.updatedAt).toBeInstanceOf(Date);
  });

  it('should use default items when no custom items are provided', async () => {
    const { checklist } = await createOnboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
    });

    const itemTitles = checklist.items.map((item) => item.title);
    expect(itemTitles).toContain('Complete personal information');
    expect(itemTitles).toContain('Read company policies');
    expect(itemTitles).toContain('Set up workstation');
    expect(itemTitles).toContain('Meet your team');
    expect(itemTitles).toContain('Complete safety training');
  });

  it('should create a checklist with custom items', async () => {
    const customItems = [
      { title: 'Custom task 1', description: 'Do custom task 1' },
      { title: 'Custom task 2', description: 'Do custom task 2' },
    ];

    const { checklist } = await createOnboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
      items: customItems,
    });

    expect(checklist.items).toHaveLength(2);
    expect(checklist.items[0].title).toBe('Custom task 1');
    expect(checklist.items[1].title).toBe('Custom task 2');
  });

  it('should initialize all items as not completed', async () => {
    const { checklist } = await createOnboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
    });

    for (const item of checklist.items) {
      expect(item.completed).toBe(false);
      expect(item.completedAt).toBeUndefined();
    }
  });

  it('should generate unique ids for each item', async () => {
    const { checklist } = await createOnboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
    });

    const itemIds = checklist.items.map((item) => item.id);
    const uniqueIds = new Set(itemIds);
    expect(uniqueIds.size).toBe(itemIds.length);
  });

  it('should persist the checklist in the repository', async () => {
    await createOnboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
    });

    expect(onboardingChecklistsRepository.items).toHaveLength(1);
    expect(onboardingChecklistsRepository.items[0].employeeId.toString()).toBe(
      EMPLOYEE_ID,
    );
  });

  it('should throw if a checklist already exists for the employee', async () => {
    await createOnboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
    });

    await expect(
      createOnboardingChecklistUseCase.execute({
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
      }),
    ).rejects.toThrow(BadRequestError);

    await expect(
      createOnboardingChecklistUseCase.execute({
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
      }),
    ).rejects.toThrow('Onboarding checklist already exists for this employee');
  });

  it('should allow creating checklists for different employees in the same tenant', async () => {
    const secondEmployeeId = new UniqueEntityID().toString();

    await createOnboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
    });

    const { checklist } = await createOnboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: secondEmployeeId,
    });

    expect(checklist.employeeId.toString()).toBe(secondEmployeeId);
    expect(onboardingChecklistsRepository.items).toHaveLength(2);
  });

  it('should allow creating checklists for the same employee in different tenants', async () => {
    const secondTenantId = new UniqueEntityID().toString();

    await createOnboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
    });

    const { checklist } = await createOnboardingChecklistUseCase.execute({
      tenantId: secondTenantId,
      employeeId: EMPLOYEE_ID,
    });

    expect(checklist.tenantId.toString()).toBe(secondTenantId);
    expect(onboardingChecklistsRepository.items).toHaveLength(2);
  });

  it('should set progress to 0 when all items are incomplete', async () => {
    const { checklist } = await createOnboardingChecklistUseCase.execute({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
    });

    expect(checklist.progress).toBe(0);
    expect(checklist.isComplete()).toBe(false);
  });
});
