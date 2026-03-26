import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryWorkplaceRisksRepository } from '@/repositories/hr/in-memory/in-memory-workplace-risks-repository';
import { GetWorkplaceRiskUseCase } from './get-workplace-risk';

let workplaceRisksRepository: InMemoryWorkplaceRisksRepository;
let sut: GetWorkplaceRiskUseCase;

describe('Get Workplace Risk Use Case', () => {
  const tenantId = new UniqueEntityID().toString();
  const safetyProgramId = new UniqueEntityID();

  beforeEach(() => {
    workplaceRisksRepository = new InMemoryWorkplaceRisksRepository();
    sut = new GetWorkplaceRiskUseCase(workplaceRisksRepository);
  });

  it('should return a workplace risk by id', async () => {
    const createdRisk = await workplaceRisksRepository.create({
      tenantId,
      safetyProgramId,
      name: 'Ruído Excessivo',
      category: 'FISICO',
      severity: 'ALTO',
      source: 'Máquinas industriais',
      affectedArea: 'Área de produção',
      controlMeasures: 'Uso de protetor auricular',
      epiRequired: 'Protetor auricular tipo concha',
      isActive: true,
    });

    const { workplaceRisk } = await sut.execute({
      tenantId,
      riskId: createdRisk.id.toString(),
    });

    expect(workplaceRisk.id.equals(createdRisk.id)).toBe(true);
    expect(workplaceRisk.name).toBe('Ruído Excessivo');
    expect(workplaceRisk.category).toBe('FISICO');
    expect(workplaceRisk.severity).toBe('ALTO');
  });

  it('should throw ResourceNotFoundError when risk does not exist', async () => {
    const nonExistentId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId,
        riskId: nonExistentId,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when risk belongs to different tenant', async () => {
    const differentTenantId = new UniqueEntityID().toString();

    const createdRisk = await workplaceRisksRepository.create({
      tenantId,
      safetyProgramId,
      name: 'Exposição a Químicos',
      category: 'QUIMICO',
      severity: 'CRITICO',
      isActive: true,
    });

    await expect(
      sut.execute({
        tenantId: differentTenantId,
        riskId: createdRisk.id.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
