import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryPlansRepository } from '@/repositories/core/in-memory/in-memory-plans-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePlanUseCase } from './create-plan';

let plansRepository: InMemoryPlansRepository;
let sut: CreatePlanUseCase;

describe('CreatePlanUseCase', () => {
  beforeEach(() => {
    plansRepository = new InMemoryPlansRepository();
    sut = new CreatePlanUseCase(plansRepository);
  });

  // OBJECTIVE
  it('should create a plan with minimal data', async () => {
    const { plan } = await sut.execute({ name: 'Free' });
    expect(plan).toBeDefined();
    expect(plan.name).toBe('Free');
    expect(plan.isActive).toBe(true);
    expect(plan.id).toEqual(expect.any(String));
  });

  it('should create a plan with all fields', async () => {
    const { plan } = await sut.execute({
      name: 'Enterprise',
      tier: 'ENTERPRISE',
      description: 'Full-featured plan',
      price: 499.9,
      isActive: true,
      maxUsers: 999999,
      maxWarehouses: 999999,
      maxProducts: 999999,
    });
    expect(plan.name).toBe('Enterprise');
    expect(plan.tier).toBe('ENTERPRISE');
    expect(plan.price).toBe(499.9);
    expect(plan.maxUsers).toBe(999999);
    expect(plan.maxWarehouses).toBe(999999);
    expect(plan.maxProducts).toBe(999999);
  });

  it('should trim the plan name', async () => {
    const { plan } = await sut.execute({ name: '  Starter  ' });
    expect(plan.name).toBe('Starter');
  });

  // REJECTS
  it('should throw BadRequestError when name is empty', async () => {
    await expect(() => sut.execute({ name: '' })).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });

  it('should throw BadRequestError when name is only whitespace', async () => {
    await expect(() => sut.execute({ name: '   ' })).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });

  it('should throw BadRequestError when plan name already exists', async () => {
    await sut.execute({ name: 'Free' });
    await expect(() => sut.execute({ name: 'Free' })).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });
});
