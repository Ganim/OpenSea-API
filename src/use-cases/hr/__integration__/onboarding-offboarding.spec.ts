import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryOffboardingChecklistsRepository } from '@/repositories/hr/in-memory/in-memory-offboarding-checklists-repository';
import { InMemoryOnboardingChecklistsRepository } from '@/repositories/hr/in-memory/in-memory-onboarding-checklists-repository';
import { CompleteOffboardingItemUseCase } from '@/use-cases/hr/offboarding/complete-offboarding-item';
import { CreateOffboardingChecklistUseCase } from '@/use-cases/hr/offboarding/create-offboarding-checklist';
import { CompleteOnboardingItemUseCase } from '@/use-cases/hr/onboarding/complete-onboarding-item';
import { CreateOnboardingChecklistUseCase } from '@/use-cases/hr/onboarding/create-onboarding-checklist';
import { beforeEach, describe, expect, it } from 'vitest';

let employeesRepository: InMemoryEmployeesRepository;
let onboardingRepository: InMemoryOnboardingChecklistsRepository;
let offboardingRepository: InMemoryOffboardingChecklistsRepository;
let createOnboarding: CreateOnboardingChecklistUseCase;
let completeOnboardingItem: CompleteOnboardingItemUseCase;
let createOffboarding: CreateOffboardingChecklistUseCase;
let completeOffboardingItem: CompleteOffboardingItemUseCase;

let testEmployee: Employee;
const tenantId = new UniqueEntityID().toString();

describe('[Integration] Onboarding / Offboarding Flow', () => {
  beforeEach(async () => {
    employeesRepository = new InMemoryEmployeesRepository();
    onboardingRepository = new InMemoryOnboardingChecklistsRepository();
    offboardingRepository = new InMemoryOffboardingChecklistsRepository();

    createOnboarding = new CreateOnboardingChecklistUseCase(
      onboardingRepository,
    );
    completeOnboardingItem = new CompleteOnboardingItemUseCase(
      onboardingRepository,
    );
    createOffboarding = new CreateOffboardingChecklistUseCase(
      offboardingRepository,
    );
    completeOffboardingItem = new CompleteOffboardingItemUseCase(
      offboardingRepository,
    );

    testEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Beatriz Campos',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2024-01-15'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 4500,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  });

  it('should create onboarding checklist with default items and complete all', async () => {
    // Create onboarding with default items
    const { checklist: onboardingChecklist } = await createOnboarding.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
    });

    expect(onboardingChecklist.title).toBe('Onboarding');
    expect(onboardingChecklist.items.length).toBeGreaterThanOrEqual(3);

    // Verify none are completed initially
    const incompleteBefore = onboardingChecklist.items.filter(
      (item) => !item.completed,
    );
    expect(incompleteBefore.length).toBe(onboardingChecklist.items.length);

    // Complete each item
    for (const item of onboardingChecklist.items) {
      await completeOnboardingItem.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        itemId: item.id,
      });
    }

    // Verify all completed
    const updatedChecklist = await onboardingRepository.findByEmployeeId(
      testEmployee.id,
      tenantId,
    );

    expect(updatedChecklist).toBeDefined();
    const allCompleted = updatedChecklist!.items.every(
      (item) => item.completed,
    );
    expect(allCompleted).toBe(true);
    expect(updatedChecklist!.isComplete()).toBe(true);
  });

  it('should create offboarding checklist with default items and complete items', async () => {
    const { checklist: offboardingChecklist } = await createOffboarding.execute(
      {
        tenantId,
        employeeId: testEmployee.id.toString(),
      },
    );

    expect(offboardingChecklist.title).toBe('Checklist de Desligamento');
    expect(offboardingChecklist.items.length).toBeGreaterThanOrEqual(5);

    // Complete first 3 items
    for (let i = 0; i < 3; i++) {
      await completeOffboardingItem.execute({
        tenantId,
        checklistId: offboardingChecklist.id.toString(),
        itemId: offboardingChecklist.items[i].id,
      });
    }

    // Verify partial completion
    const updatedChecklist = await offboardingRepository.findById(
      offboardingChecklist.id,
      tenantId,
    );

    const completedCount = updatedChecklist!.items.filter(
      (item) => item.completed,
    ).length;
    expect(completedCount).toBe(3);
    expect(updatedChecklist!.isComplete()).toBe(false);
  });

  it('should not allow duplicate onboarding for the same employee', async () => {
    await createOnboarding.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
    });

    await expect(
      createOnboarding.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
      }),
    ).rejects.toThrow('Onboarding checklist already exists');
  });

  it('should not allow duplicate offboarding for the same employee', async () => {
    await createOffboarding.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
    });

    await expect(
      createOffboarding.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
      }),
    ).rejects.toThrow('Offboarding checklist already exists');
  });

  it('should create onboarding with custom items', async () => {
    const customItems = [
      {
        title: 'Configurar acesso VPN',
        description: 'Solicitar ao TI acesso remoto via VPN corporativa',
      },
      {
        title: 'Assinar contrato de confidencialidade',
        description: 'Assinar NDA junto ao departamento jurídico',
      },
      {
        title: 'Realizar tour pelo escritório',
        description: 'Conhecer todas as áreas e departamentos da empresa',
      },
    ];

    const { checklist } = await createOnboarding.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      title: 'Onboarding TI',
      items: customItems,
    });

    expect(checklist.title).toBe('Onboarding TI');
    expect(checklist.items).toHaveLength(3);
    expect(checklist.items[0].title).toBe('Configurar acesso VPN');
    expect(checklist.items[1].title).toBe(
      'Assinar contrato de confidencialidade',
    );
  });

  it('should handle full employee lifecycle: onboarding → work → offboarding', async () => {
    // Create onboarding
    const { checklist: onboarding } = await createOnboarding.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
    });

    // Complete all onboarding items
    for (const item of onboarding.items) {
      await completeOnboardingItem.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        itemId: item.id,
      });
    }

    const completedOnboarding = await onboardingRepository.findByEmployeeId(
      testEmployee.id,
      tenantId,
    );
    expect(completedOnboarding!.isComplete()).toBe(true);

    // Later — employee is leaving, create offboarding
    const { checklist: offboarding } = await createOffboarding.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      terminationId: new UniqueEntityID().toString(),
    });

    // Complete all offboarding items
    for (const item of offboarding.items) {
      await completeOffboardingItem.execute({
        tenantId,
        checklistId: offboarding.id.toString(),
        itemId: item.id,
      });
    }

    const completedOffboarding = await offboardingRepository.findById(
      offboarding.id,
      tenantId,
    );
    expect(completedOffboarding!.isComplete()).toBe(true);
  });
});
