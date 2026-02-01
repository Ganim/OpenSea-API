import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryPlanModulesRepository } from '@/repositories/core/in-memory/in-memory-plan-modules-repository';
import { InMemoryPlansRepository } from '@/repositories/core/in-memory/in-memory-plans-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { SetPlanModulesUseCase } from './set-plan-modules';

let plansRepository: InMemoryPlansRepository;
let planModulesRepository: InMemoryPlanModulesRepository;
let sut: SetPlanModulesUseCase;

describe('SetPlanModulesUseCase', () => {
  beforeEach(() => {
    plansRepository = new InMemoryPlansRepository();
    planModulesRepository = new InMemoryPlanModulesRepository();
    sut = new SetPlanModulesUseCase(plansRepository, planModulesRepository);
  });

  // OBJECTIVE
  it('should set modules for a plan', async () => {
    const createdPlan = await plansRepository.create({ name: 'Starter' });

    const { modules } = await sut.execute({
      planId: createdPlan.planId.toString(),
      modules: ['CORE', 'STOCK', 'SALES'],
    });

    expect(modules).toHaveLength(3);
    expect(modules.map((m) => m.module)).toEqual(
      expect.arrayContaining(['CORE', 'STOCK', 'SALES']),
    );
  });

  it('should replace existing modules', async () => {
    const createdPlan = await plansRepository.create({ name: 'Pro' });

    await sut.execute({
      planId: createdPlan.planId.toString(),
      modules: ['CORE', 'STOCK'],
    });

    const { modules } = await sut.execute({
      planId: createdPlan.planId.toString(),
      modules: ['CORE', 'STOCK', 'SALES', 'HR'],
    });

    expect(modules).toHaveLength(4);
    expect(modules.map((m) => m.module)).toEqual(
      expect.arrayContaining(['CORE', 'STOCK', 'SALES', 'HR']),
    );

    // Verify old modules were removed
    const storedModules = await planModulesRepository.findByPlanId(
      createdPlan.planId,
    );
    expect(storedModules).toHaveLength(4);
  });

  it('should deduplicate modules', async () => {
    const createdPlan = await plansRepository.create({ name: 'Test' });

    const { modules } = await sut.execute({
      planId: createdPlan.planId.toString(),
      modules: ['CORE', 'CORE', 'STOCK', 'STOCK'],
    });

    expect(modules).toHaveLength(2);
  });

  // REJECTS
  it('should throw ResourceNotFoundError for non-existent plan', async () => {
    await expect(() =>
      sut.execute({
        planId: 'non-existent-id',
        modules: ['CORE'],
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError for invalid modules', async () => {
    const createdPlan = await plansRepository.create({ name: 'Test' });

    await expect(() =>
      sut.execute({
        planId: createdPlan.planId.toString(),
        modules: ['CORE', 'INVALID_MODULE'],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
