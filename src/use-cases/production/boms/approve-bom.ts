import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BomsRepository } from '@/repositories/production/boms-repository';

interface ApproveBomUseCaseRequest {
  tenantId: string;
  id: string;
  approvedById: string;
}

interface ApproveBomUseCaseResponse {
  bom: import('@/entities/production/bill-of-materials').ProductionBom;
}

export class ApproveBomUseCase {
  constructor(private bomsRepository: BomsRepository) {}

  async execute({
    tenantId,
    id,
    approvedById,
  }: ApproveBomUseCaseRequest): Promise<ApproveBomUseCaseResponse> {
    const bom = await this.bomsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!bom) {
      throw new ResourceNotFoundError('BOM not found.');
    }

    if (bom.status !== 'DRAFT') {
      throw new BadRequestError('Only DRAFT BOMs can be approved.');
    }

    bom.approve(approvedById);

    const updatedBom = await this.bomsRepository.update({
      id: new UniqueEntityID(id),
      status: 'ACTIVE',
      approvedById,
      approvedAt: bom.approvedAt!,
    });

    if (!updatedBom) {
      throw new ResourceNotFoundError('BOM not found.');
    }

    return { bom: updatedBom };
  }
}
