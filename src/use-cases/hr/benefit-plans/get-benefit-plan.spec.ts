import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryBenefitPlansRepository } from '@/repositories/hr/in-memory/in-memory-benefit-plans-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetBenefitPlanUseCase } from './get-benefit-plan';

let benefitPlansRepository: InMemoryBenefitPlansRepository;
let sut: GetBenefitPlanUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Get Benefit Plan Use Case', () => {
  beforeEach(() => {
    benefitPlansRepository = new InMemoryBenefitPlansRepository();
    sut = new GetBenefitPlanUseCase(benefitPlansRepository);
  });

  it('should get a benefit plan by id', async () => {
    const createdPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde Premium',
      type: 'HEALTH',
      provider: 'Unimed',
      policyNumber: 'POL-12345',
      description: 'Plano corporativo premium',
    });

    const result = await sut.execute({
      tenantId,
      benefitPlanId: createdPlan.id.toString(),
    });

    expect(result.benefitPlan).toBeDefined();
    expect(result.benefitPlan.id.equals(createdPlan.id)).toBe(true);
    expect(result.benefitPlan.name).toBe('Plano de Saúde Premium');
    expect(result.benefitPlan.type).toBe('HEALTH');
    expect(result.benefitPlan.provider).toBe('Unimed');
    expect(result.benefitPlan.policyNumber).toBe('POL-12345');
  });

  it('should throw error for non-existent benefit plan', async () => {
    await expect(
      sut.execute({
        tenantId,
        benefitPlanId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Plano de benefício não encontrado');
  });

  it('should not return a plan from a different tenant', async () => {
    const otherTenantId = new UniqueEntityID().toString();

    const createdPlan = await benefitPlansRepository.create({
      tenantId: otherTenantId,
      name: 'Plano Dental',
      type: 'DENTAL',
    });

    await expect(
      sut.execute({
        tenantId,
        benefitPlanId: createdPlan.id.toString(),
      }),
    ).rejects.toThrow('Plano de benefício não encontrado');
  });

  it('should return plan with all optional fields', async () => {
    const createdPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Vale Transporte',
      type: 'VT',
      provider: 'SPTrans',
      policyNumber: 'VT-9999',
      rules: { deductionRate: 0.06, maxDeduction: 300 },
      description: 'Vale transporte com desconto de 6%',
    });

    const result = await sut.execute({
      tenantId,
      benefitPlanId: createdPlan.id.toString(),
    });

    expect(result.benefitPlan.rules).toEqual({
      deductionRate: 0.06,
      maxDeduction: 300,
    });
    expect(result.benefitPlan.description).toBe(
      'Vale transporte com desconto de 6%',
    );
    expect(result.benefitPlan.isActive).toBe(true);
  });

  it('should return an inactive plan', async () => {
    const createdPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano Inativo',
      type: 'HEALTH',
      isActive: false,
    });

    const result = await sut.execute({
      tenantId,
      benefitPlanId: createdPlan.id.toString(),
    });

    expect(result.benefitPlan.isActive).toBe(false);
  });
});
