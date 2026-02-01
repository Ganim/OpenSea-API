import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryPlanModulesRepository } from '@/repositories/core/in-memory/in-memory-plan-modules-repository';
import { InMemoryPlansRepository } from '@/repositories/core/in-memory/in-memory-plans-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPlanByIdUseCase } from './get-plan-by-id';

let plansRepository: InMemoryPlansRepository;
let planModulesRepository: InMemoryPlanModulesRepository;
let sut: GetPlanByIdUseCase;

describe('GetPlanByIdUseCase', () => {
  beforeEach(() => {
    plansRepository = new InMemoryPlansRepository();
    planModulesRepository = new InMemoryPlanModulesRepository();
    sut = new GetPlanByIdUseCase(plansRepository, planModulesRepository);
  });

  // OBJECTIVE
  it('should get a plan by id with its modules', async () => {
    const createdPlan = await plansRepository.create({
      name: 'Starter',
      tier: 'STARTER',
      price: 99.9,
    });

    await planModulesRepository.setModules(createdPlan.planId, [
      'CORE',
      'STOCK',
      'SALES',
    ]);

    const { plan, modules } = await sut.execute({
      planId: createdPlan.planId.toString(),
    });

    expect(plan.name).toBe('Starter');
    expect(plan.tier).toBe('STARTER');
    expect(plan.price).toBe(99.9);
    expect(modules).toHaveLength(3);
    expect(modules.map((m) => m.module)).toEqual(
      expect.arrayContaining(['CORE', 'STOCK', 'SALES']),
    );
  });

  it('should get a plan with no modules', async () => {
    const createdPlan = await plansRepository.create({ name: 'Free' });

    const { plan, modules } = await sut.execute({
      planId: createdPlan.planId.toString(),
    });

    expect(plan.name).toBe('Free');
    expect(modules).toHaveLength(0);
  });

  // REJECTS
  it('should throw ResourceNotFoundError for non-existent plan', async () => {
    await expect(() =>
      sut.execute({ planId: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
