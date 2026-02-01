import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryPlansRepository } from '@/repositories/core/in-memory/in-memory-plans-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdatePlanUseCase } from './update-plan';

let plansRepository: InMemoryPlansRepository;
let sut: UpdatePlanUseCase;

describe('UpdatePlanUseCase', () => {
  beforeEach(() => {
    plansRepository = new InMemoryPlansRepository();
    sut = new UpdatePlanUseCase(plansRepository);
  });

  it('should update a plan name', async () => {
    const createdPlan = await plansRepository.create({ name: 'Free' });
    const { plan } = await sut.execute({
      planId: createdPlan.planId.toString(),
      name: 'Basic',
    });
    expect(plan.name).toBe('Basic');
  });

  it('should update tier and price', async () => {
    const createdPlan = await plansRepository.create({
      name: 'Starter',
      tier: 'STARTER',
      price: 99.9,
    });
    const { plan } = await sut.execute({
      planId: createdPlan.planId.toString(),
      tier: 'PROFESSIONAL',
      price: 199.9,
    });
    expect(plan.tier).toBe('PROFESSIONAL');
    expect(plan.price).toBe(199.9);
  });

  it('should update plan limits', async () => {
    const createdPlan = await plansRepository.create({ name: 'Free' });
    const { plan } = await sut.execute({
      planId: createdPlan.planId.toString(),
      maxUsers: 50,
      maxWarehouses: 10,
      maxProducts: 1000,
    });
    expect(plan.maxUsers).toBe(50);
    expect(plan.maxWarehouses).toBe(10);
    expect(plan.maxProducts).toBe(1000);
  });

  it('should deactivate a plan', async () => {
    const createdPlan = await plansRepository.create({
      name: 'Free',
      isActive: true,
    });
    const { plan } = await sut.execute({
      planId: createdPlan.planId.toString(),
      isActive: false,
    });
    expect(plan.isActive).toBe(false);
  });

  it('should allow updating to the same name', async () => {
    const createdPlan = await plansRepository.create({ name: 'Free' });
    const { plan } = await sut.execute({
      planId: createdPlan.planId.toString(),
      name: 'Free',
    });
    expect(plan.name).toBe('Free');
  });

  it('should throw ResourceNotFoundError for non-existent plan', async () => {
    await expect(() =>
      sut.execute({ planId: 'non-existent-id', name: 'Updated' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError when name is empty', async () => {
    const createdPlan = await plansRepository.create({ name: 'Free' });
    await expect(() =>
      sut.execute({ planId: createdPlan.planId.toString(), name: '' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError when name already exists', async () => {
    await plansRepository.create({ name: 'Free' });
    const starter = await plansRepository.create({ name: 'Starter' });
    await expect(() =>
      sut.execute({ planId: starter.planId.toString(), name: 'Free' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
