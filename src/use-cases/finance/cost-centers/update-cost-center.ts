import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type CostCenterDTO,
  costCenterToDTO,
} from '@/mappers/finance/cost-center/cost-center-to-dto';
import type { CostCentersRepository } from '@/repositories/finance/cost-centers-repository';

interface UpdateCostCenterUseCaseRequest {
  tenantId: string;
  id: string;
  companyId?: string;
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  monthlyBudget?: number;
  annualBudget?: number;
  parentId?: string;
}

interface UpdateCostCenterUseCaseResponse {
  costCenter: CostCenterDTO;
}

export class UpdateCostCenterUseCase {
  constructor(private costCentersRepository: CostCentersRepository) {}

  async execute(
    request: UpdateCostCenterUseCaseRequest,
  ): Promise<UpdateCostCenterUseCaseResponse> {
    const { tenantId, id, name, code } = request;

    const costCenter = await this.costCentersRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );
    if (!costCenter) {
      throw new ResourceNotFoundError('Cost center not found');
    }

    if (name !== undefined) {
      if (name.trim().length === 0) {
        throw new BadRequestError('Cost center name cannot be empty');
      }
      if (name.length > 128) {
        throw new BadRequestError(
          'Cost center name must be at most 128 characters',
        );
      }
    }

    if (code !== undefined) {
      if (code.trim().length === 0) {
        throw new BadRequestError('Cost center code cannot be empty');
      }
      const existingCode = await this.costCentersRepository.findByCode(
        code,
        tenantId,
      );
      if (existingCode && !existingCode.id.equals(costCenter.id)) {
        throw new BadRequestError(
          'A cost center with this code already exists',
        );
      }
    }

    const updated = await this.costCentersRepository.update({
      id: new UniqueEntityID(id),
      companyId: request.companyId,
      code: code?.trim(),
      name: name?.trim(),
      description: request.description,
      isActive: request.isActive,
      monthlyBudget: request.monthlyBudget,
      annualBudget: request.annualBudget,
      parentId: request.parentId,
    });

    if (!updated) {
      throw new ResourceNotFoundError('Cost center not found');
    }

    return { costCenter: costCenterToDTO(updated) };
  }
}
