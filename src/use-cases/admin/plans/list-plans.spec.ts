import { InMemoryPlansRepository } from '@/repositories/core/in-memory/in-memory-plans-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPlansUseCase } from './list-plans';

let plansRepository: InMemoryPlansRepository;
let sut: ListPlansUseCase;

describe('ListPlansUseCase', () => {
  beforeEach(() => {
    plansRepository = new InMemoryPlansRepository();
    sut = new ListPlansUseCase(plansRepository);
  });

  // OBJECTIVE
  it('should list all plans', async () => {
    await plansRepository.create({ name: 'Free' });
    await plansRepository.create({
      name: 'Starter',
      tier: 'STARTER',
      price: 99.9,
    });
    await plansRepository.create({
      name: 'Professional',
      tier: 'PROFESSIONAL',
      price: 299.9,
    });

    const { plans } = await sut.execute();

    expect(plans).toHaveLength(3);
    expect(plans[0].name).toBe('Free');
    expect(plans[1].name).toBe('Starter');
    expect(plans[2].name).toBe('Professional');
  });

  it('should return an empty array when no plans exist', async () => {
    const { plans } = await sut.execute();

    expect(plans).toHaveLength(0);
    expect(plans).toEqual([]);
  });

  // VALIDATIONS
  it('should return plans with all DTO fields', async () => {
    await plansRepository.create({
      name: 'Enterprise',
      tier: 'ENTERPRISE',
      price: 0,
      maxUsers: 999999,
      maxWarehouses: 999999,
      maxProducts: 999999,
    });

    const { plans } = await sut.execute();

    expect(plans[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'Enterprise',
        tier: 'ENTERPRISE',
        price: 0,
        isActive: true,
        maxUsers: 999999,
        maxWarehouses: 999999,
        maxProducts: 999999,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    );
  });
});
