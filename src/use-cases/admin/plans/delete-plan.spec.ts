import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryPlansRepository } from '@/repositories/core/in-memory/in-memory-plans-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeletePlanUseCase } from './delete-plan';

let plansRepository: InMemoryPlansRepository;
let sut: DeletePlanUseCase;

describe('DeletePlanUseCase', () => {
  beforeEach(() => {
    plansRepository = new InMemoryPlansRepository();
    sut = new DeletePlanUseCase(plansRepository);
  });

  // OBJECTIVE
  it('should deactivate a plan', async () => {
    const createdPlan = await plansRepository.create({
      name: 'Free',
      isActive: true,
    });

    const { plan } = await sut.execute({
      planId: createdPlan.planId.toString(),
    });

    expect(plan.isActive).toBe(false);
    expect(plan.name).toBe('Free');
  });

  it('should deactivate an already active plan', async () => {
    const createdPlan = await plansRepository.create({
      name: 'Starter',
      tier: 'STARTER',
      price: 99.9,
      isActive: true,
    });

    const { plan } = await sut.execute({
      planId: createdPlan.planId.toString(),
    });

    expect(plan.isActive).toBe(false);

    // Verify in repository
    const planInRepo = await plansRepository.findById(createdPlan.planId);
    expect(planInRepo?.isActive).toBe(false);
  });

  // REJECTS
  it('should throw ResourceNotFoundError for non-existent plan', async () => {
    await expect(() =>
      sut.execute({ planId: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
