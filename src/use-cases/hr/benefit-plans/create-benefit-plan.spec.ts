import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryBenefitPlansRepository } from '@/repositories/hr/in-memory/in-memory-benefit-plans-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateBenefitPlanUseCase } from './create-benefit-plan';

let benefitPlansRepository: InMemoryBenefitPlansRepository;
let sut: CreateBenefitPlanUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Create Benefit Plan Use Case', () => {
  beforeEach(() => {
    benefitPlansRepository = new InMemoryBenefitPlansRepository();
    sut = new CreateBenefitPlanUseCase(benefitPlansRepository);
  });

  it('should create a benefit plan successfully', async () => {
    const result = await sut.execute({
      tenantId,
      name: 'Plano de Saúde Premium',
      type: 'HEALTH',
      provider: 'Unimed',
      policyNumber: 'POL-12345',
      description: 'Plano de saúde corporativo premium',
    });

    expect(result.benefitPlan).toBeDefined();
    expect(result.benefitPlan.name).toBe('Plano de Saúde Premium');
    expect(result.benefitPlan.type).toBe('HEALTH');
    expect(result.benefitPlan.provider).toBe('Unimed');
    expect(result.benefitPlan.policyNumber).toBe('POL-12345');
    expect(result.benefitPlan.isActive).toBe(true);
    expect(benefitPlansRepository.items).toHaveLength(1);
  });

  it('should create a VT benefit plan', async () => {
    const result = await sut.execute({
      tenantId,
      name: 'Vale Transporte',
      type: 'VT',
      rules: { deductionRate: 0.06 },
    });

    expect(result.benefitPlan.type).toBe('VT');
    expect(result.benefitPlan.rules).toEqual({ deductionRate: 0.06 });
  });

  it('should create a FLEX benefit plan', async () => {
    const result = await sut.execute({
      tenantId,
      name: 'Benefício Flexível',
      type: 'FLEX',
      description: 'Benefício flexível para distribuição livre',
    });

    expect(result.benefitPlan.type).toBe('FLEX');
  });

  it('should throw error for empty name', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: '',
        type: 'HEALTH',
      }),
    ).rejects.toThrow('O nome do plano de benefício é obrigatório');
  });

  it('should throw error for invalid benefit type', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: 'Invalid Plan',
        type: 'INVALID_TYPE',
      }),
    ).rejects.toThrow('Tipo de benefício inválido');
  });

  it('should trim whitespace from name', async () => {
    const result = await sut.execute({
      tenantId,
      name: '  Plano Dental  ',
      type: 'DENTAL',
    });

    expect(result.benefitPlan.name).toBe('Plano Dental');
  });

  it('should create multiple plans for the same tenant', async () => {
    await sut.execute({ tenantId, name: 'VT Plan', type: 'VT' });
    await sut.execute({ tenantId, name: 'VR Plan', type: 'VR' });
    await sut.execute({ tenantId, name: 'Health Plan', type: 'HEALTH' });

    expect(benefitPlansRepository.items).toHaveLength(3);
  });
});
