import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryBenefitPlansRepository } from '@/repositories/hr/in-memory/in-memory-benefit-plans-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteBenefitPlanUseCase } from './delete-benefit-plan';

let benefitPlansRepository: InMemoryBenefitPlansRepository;
let sut: DeleteBenefitPlanUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Delete Benefit Plan Use Case', () => {
  beforeEach(() => {
    benefitPlansRepository = new InMemoryBenefitPlansRepository();
    sut = new DeleteBenefitPlanUseCase(benefitPlansRepository);
  });

  it('should soft-delete a benefit plan (deactivate)', async () => {
    const createdPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });

    const result = await sut.execute({
      tenantId,
      benefitPlanId: createdPlan.id.toString(),
    });

    expect(result.benefitPlan).toBeDefined();
    expect(result.benefitPlan.isActive).toBe(false);

    // Verify the plan was deactivated in the repository
    const planInRepo = await benefitPlansRepository.findById(
      createdPlan.id,
      tenantId,
    );
    expect(planInRepo).not.toBeNull();
    expect(planInRepo!.isActive).toBe(false);
  });

  it('should throw error for non-existent benefit plan', async () => {
    await expect(
      sut.execute({
        tenantId,
        benefitPlanId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Plano de benefício não encontrado');
  });

  it('should not delete plan from a different tenant', async () => {
    const otherTenantId = new UniqueEntityID().toString();

    const createdPlan = await benefitPlansRepository.create({
      tenantId: otherTenantId,
      name: 'Plano Outro Tenant',
      type: 'HEALTH',
    });

    await expect(
      sut.execute({
        tenantId,
        benefitPlanId: createdPlan.id.toString(),
      }),
    ).rejects.toThrow('Plano de benefício não encontrado');
  });

  it('should deactivate an already active plan', async () => {
    const createdPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano Ativo',
      type: 'DENTAL',
      isActive: true,
    });

    expect(createdPlan.isActive).toBe(true);

    await sut.execute({
      tenantId,
      benefitPlanId: createdPlan.id.toString(),
    });

    expect(createdPlan.isActive).toBe(false);
  });

  it('should still work on an already inactive plan', async () => {
    const createdPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano Já Inativo',
      type: 'VR',
      isActive: false,
    });

    const result = await sut.execute({
      tenantId,
      benefitPlanId: createdPlan.id.toString(),
    });

    expect(result.benefitPlan.isActive).toBe(false);
  });

  it('should return the deleted plan data', async () => {
    const createdPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano para Deletar',
      type: 'LIFE_INSURANCE',
      provider: 'Seguradora XYZ',
      policyNumber: 'SEG-999',
    });

    const result = await sut.execute({
      tenantId,
      benefitPlanId: createdPlan.id.toString(),
    });

    expect(result.benefitPlan.name).toBe('Plano para Deletar');
    expect(result.benefitPlan.type).toBe('LIFE_INSURANCE');
    expect(result.benefitPlan.provider).toBe('Seguradora XYZ');
  });

  it('should not remove the plan from the repository (soft delete)', async () => {
    const createdPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano Soft Delete',
      type: 'HEALTH',
    });

    await sut.execute({
      tenantId,
      benefitPlanId: createdPlan.id.toString(),
    });

    // Plan should still exist in repository (soft delete)
    expect(benefitPlansRepository.items).toHaveLength(1);
  });
});
