import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryBenefitPlansRepository } from '@/repositories/hr/in-memory/in-memory-benefit-plans-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateBenefitPlanUseCase } from './update-benefit-plan';

let benefitPlansRepository: InMemoryBenefitPlansRepository;
let sut: UpdateBenefitPlanUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Update Benefit Plan Use Case', () => {
  beforeEach(() => {
    benefitPlansRepository = new InMemoryBenefitPlansRepository();
    sut = new UpdateBenefitPlanUseCase(benefitPlansRepository);
  });

  it('should update a benefit plan name', async () => {
    const createdPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano Original',
      type: 'HEALTH',
    });

    const result = await sut.execute({
      tenantId,
      benefitPlanId: createdPlan.id.toString(),
      name: 'Plano Atualizado',
    });

    expect(result.benefitPlan.name).toBe('Plano Atualizado');
  });

  it('should update provider and policy number', async () => {
    const createdPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
      provider: 'Unimed',
      policyNumber: 'POL-001',
    });

    const result = await sut.execute({
      tenantId,
      benefitPlanId: createdPlan.id.toString(),
      provider: 'Amil',
      policyNumber: 'POL-002',
    });

    expect(result.benefitPlan.provider).toBe('Amil');
    expect(result.benefitPlan.policyNumber).toBe('POL-002');
  });

  it('should update rules', async () => {
    const createdPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Vale Transporte',
      type: 'VT',
      rules: { deductionRate: 0.06 },
    });

    const result = await sut.execute({
      tenantId,
      benefitPlanId: createdPlan.id.toString(),
      rules: { deductionRate: 0.04, maxDeduction: 250 },
    });

    expect(result.benefitPlan.rules).toEqual({
      deductionRate: 0.04,
      maxDeduction: 250,
    });
  });

  it('should deactivate a benefit plan', async () => {
    const createdPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano Ativo',
      type: 'HEALTH',
    });

    const result = await sut.execute({
      tenantId,
      benefitPlanId: createdPlan.id.toString(),
      isActive: false,
    });

    expect(result.benefitPlan.isActive).toBe(false);
  });

  it('should reactivate a benefit plan', async () => {
    const createdPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano Inativo',
      type: 'HEALTH',
      isActive: false,
    });

    const result = await sut.execute({
      tenantId,
      benefitPlanId: createdPlan.id.toString(),
      isActive: true,
    });

    expect(result.benefitPlan.isActive).toBe(true);
  });

  it('should throw error for non-existent benefit plan', async () => {
    await expect(
      sut.execute({
        tenantId,
        benefitPlanId: new UniqueEntityID().toString(),
        name: 'Qualquer Nome',
      }),
    ).rejects.toThrow('Plano de benefício não encontrado');
  });

  it('should throw error for empty name', async () => {
    const createdPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano Original',
      type: 'HEALTH',
    });

    await expect(
      sut.execute({
        tenantId,
        benefitPlanId: createdPlan.id.toString(),
        name: '',
      }),
    ).rejects.toThrow('O nome do plano de benefício é obrigatório');
  });

  it('should throw error for whitespace-only name', async () => {
    const createdPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano Original',
      type: 'HEALTH',
    });

    await expect(
      sut.execute({
        tenantId,
        benefitPlanId: createdPlan.id.toString(),
        name: '   ',
      }),
    ).rejects.toThrow('O nome do plano de benefício é obrigatório');
  });

  it('should trim whitespace from name and provider', async () => {
    const createdPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano Original',
      type: 'HEALTH',
    });

    const result = await sut.execute({
      tenantId,
      benefitPlanId: createdPlan.id.toString(),
      name: '  Plano Atualizado  ',
      provider: '  Unimed  ',
    });

    expect(result.benefitPlan.name).toBe('Plano Atualizado');
    expect(result.benefitPlan.provider).toBe('Unimed');
  });

  it('should update description', async () => {
    const createdPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });

    const result = await sut.execute({
      tenantId,
      benefitPlanId: createdPlan.id.toString(),
      description: 'Nova descrição detalhada do plano',
    });

    expect(result.benefitPlan.description).toBe(
      'Nova descrição detalhada do plano',
    );
  });

  it('should not update plan from a different tenant', async () => {
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
        name: 'Nome Alterado',
      }),
    ).rejects.toThrow('Plano de benefício não encontrado');
  });

  it('should update multiple fields at once', async () => {
    const createdPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano Antigo',
      type: 'HEALTH',
      provider: 'Unimed',
    });

    const result = await sut.execute({
      tenantId,
      benefitPlanId: createdPlan.id.toString(),
      name: 'Plano Novo',
      type: 'DENTAL',
      provider: 'Odonto',
      policyNumber: 'POL-NEW-001',
      description: 'Descrição atualizada',
    });

    expect(result.benefitPlan.name).toBe('Plano Novo');
    expect(result.benefitPlan.type).toBe('DENTAL');
    expect(result.benefitPlan.provider).toBe('Odonto');
    expect(result.benefitPlan.policyNumber).toBe('POL-NEW-001');
    expect(result.benefitPlan.description).toBe('Descrição atualizada');
  });
});
