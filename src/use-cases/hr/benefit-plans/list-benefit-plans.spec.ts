import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryBenefitPlansRepository } from '@/repositories/hr/in-memory/in-memory-benefit-plans-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListBenefitPlansUseCase } from './list-benefit-plans';

let benefitPlansRepository: InMemoryBenefitPlansRepository;
let sut: ListBenefitPlansUseCase;

const tenantId = new UniqueEntityID().toString();

describe('List Benefit Plans Use Case', () => {
  beforeEach(() => {
    benefitPlansRepository = new InMemoryBenefitPlansRepository();
    sut = new ListBenefitPlansUseCase(benefitPlansRepository);
  });

  it('should list all benefit plans for a tenant', async () => {
    await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });
    await benefitPlansRepository.create({
      tenantId,
      name: 'Vale Refeição',
      type: 'VR',
    });
    await benefitPlansRepository.create({
      tenantId,
      name: 'Vale Transporte',
      type: 'VT',
    });

    const result = await sut.execute({ tenantId });

    expect(result.benefitPlans).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it('should return empty list when no plans exist', async () => {
    const result = await sut.execute({ tenantId });

    expect(result.benefitPlans).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should filter by type', async () => {
    await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde A',
      type: 'HEALTH',
    });
    await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde B',
      type: 'HEALTH',
    });
    await benefitPlansRepository.create({
      tenantId,
      name: 'Vale Refeição',
      type: 'VR',
    });

    const result = await sut.execute({ tenantId, type: 'HEALTH' });

    expect(result.benefitPlans).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.benefitPlans.every((plan) => plan.type === 'HEALTH')).toBe(
      true,
    );
  });

  it('should filter by isActive', async () => {
    await benefitPlansRepository.create({
      tenantId,
      name: 'Plano Ativo',
      type: 'HEALTH',
      isActive: true,
    });
    await benefitPlansRepository.create({
      tenantId,
      name: 'Plano Inativo',
      type: 'DENTAL',
      isActive: false,
    });

    const activeResult = await sut.execute({ tenantId, isActive: true });
    expect(activeResult.benefitPlans).toHaveLength(1);
    expect(activeResult.benefitPlans[0].name).toBe('Plano Ativo');

    const inactiveResult = await sut.execute({ tenantId, isActive: false });
    expect(inactiveResult.benefitPlans).toHaveLength(1);
    expect(inactiveResult.benefitPlans[0].name).toBe('Plano Inativo');
  });

  it('should filter by search term', async () => {
    await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde Premium',
      type: 'HEALTH',
    });
    await benefitPlansRepository.create({
      tenantId,
      name: 'Vale Refeição Básico',
      type: 'VR',
    });
    await benefitPlansRepository.create({
      tenantId,
      name: 'Plano Dental Plus',
      type: 'DENTAL',
    });

    const result = await sut.execute({ tenantId, search: 'plano' });

    expect(result.benefitPlans).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should paginate results', async () => {
    for (let i = 0; i < 5; i++) {
      await benefitPlansRepository.create({
        tenantId,
        name: `Plano ${i + 1}`,
        type: 'HEALTH',
      });
    }

    const firstPage = await sut.execute({ tenantId, page: 1, perPage: 2 });
    expect(firstPage.benefitPlans).toHaveLength(2);
    expect(firstPage.total).toBe(5);

    const secondPage = await sut.execute({ tenantId, page: 2, perPage: 2 });
    expect(secondPage.benefitPlans).toHaveLength(2);

    const thirdPage = await sut.execute({ tenantId, page: 3, perPage: 2 });
    expect(thirdPage.benefitPlans).toHaveLength(1);
  });

  it('should not list plans from other tenants', async () => {
    const otherTenantId = new UniqueEntityID().toString();

    await benefitPlansRepository.create({
      tenantId,
      name: 'Plano Tenant A',
      type: 'HEALTH',
    });
    await benefitPlansRepository.create({
      tenantId: otherTenantId,
      name: 'Plano Tenant B',
      type: 'HEALTH',
    });

    const result = await sut.execute({ tenantId });

    expect(result.benefitPlans).toHaveLength(1);
    expect(result.benefitPlans[0].name).toBe('Plano Tenant A');
  });

  it('should combine multiple filters', async () => {
    await benefitPlansRepository.create({
      tenantId,
      name: 'Plano Saúde Ativo',
      type: 'HEALTH',
      isActive: true,
    });
    await benefitPlansRepository.create({
      tenantId,
      name: 'Plano Saúde Inativo',
      type: 'HEALTH',
      isActive: false,
    });
    await benefitPlansRepository.create({
      tenantId,
      name: 'VR Ativo',
      type: 'VR',
      isActive: true,
    });

    const result = await sut.execute({
      tenantId,
      type: 'HEALTH',
      isActive: true,
    });

    expect(result.benefitPlans).toHaveLength(1);
    expect(result.benefitPlans[0].name).toBe('Plano Saúde Ativo');
  });
});
