import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import {
  type CostCenterDTO,
  costCenterToDTO,
} from '@/mappers/finance/cost-center/cost-center-to-dto';
import type { CostCentersRepository } from '@/repositories/finance/cost-centers-repository';

interface CreateCostCenterUseCaseRequest {
  tenantId: string;
  companyId?: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
  monthlyBudget?: number;
  annualBudget?: number;
  parentId?: string;
}

interface CreateCostCenterUseCaseResponse {
  costCenter: CostCenterDTO;
}

export class CreateCostCenterUseCase {
  constructor(private costCentersRepository: CostCentersRepository) {}

  async execute(request: CreateCostCenterUseCaseRequest): Promise<CreateCostCenterUseCaseResponse> {
    const { tenantId, code, name } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Cost center name is required');
    }

    if (name.length > 128) {
      throw new BadRequestError('Cost center name must be at most 128 characters');
    }

    if (!code || code.trim().length === 0) {
      throw new BadRequestError('Cost center code is required');
    }

    if (code.length > 32) {
      throw new BadRequestError('Cost center code must be at most 32 characters');
    }

    const existingCode = await this.costCentersRepository.findByCode(code, tenantId);
    if (existingCode) {
      throw new BadRequestError('A cost center with this code already exists');
    }

    const costCenter = await this.costCentersRepository.create({
      tenantId,
      companyId: request.companyId,
      code: code.trim(),
      name: name.trim(),
      description: request.description,
      isActive: request.isActive,
      monthlyBudget: request.monthlyBudget,
      annualBudget: request.annualBudget,
      parentId: request.parentId,
    });

    return { costCenter: costCenterToDTO(costCenter) };
  }
}
