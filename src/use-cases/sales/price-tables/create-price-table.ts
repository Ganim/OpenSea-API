import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import type { PriceTable } from '@/entities/sales/price-table';
import type { PriceTablesRepository } from '@/repositories/sales/price-tables-repository';

interface CreatePriceTableUseCaseRequest {
  tenantId: string;
  name: string;
  description?: string;
  type?: string;
  currency?: string;
  priceIncludesTax?: boolean;
  isDefault?: boolean;
  priority?: number;
  isActive?: boolean;
  validFrom?: Date;
  validUntil?: Date;
}

interface CreatePriceTableUseCaseResponse {
  priceTable: PriceTable;
}

export class CreatePriceTableUseCase {
  constructor(private priceTablesRepository: PriceTablesRepository) {}

  async execute(
    request: CreatePriceTableUseCaseRequest,
  ): Promise<CreatePriceTableUseCaseResponse> {
    const { tenantId, name } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Price table name is required');
    }

    const existing = await this.priceTablesRepository.findByName(
      name.trim(),
      tenantId,
    );

    if (existing) {
      throw new ConflictError('A price table with this name already exists');
    }

    const priceTable = await this.priceTablesRepository.create({
      tenantId,
      name: name.trim(),
      description: request.description,
      type: request.type,
      currency: request.currency,
      priceIncludesTax: request.priceIncludesTax,
      isDefault: request.isDefault,
      priority: request.priority,
      isActive: request.isActive,
      validFrom: request.validFrom,
      validUntil: request.validUntil,
    });

    return { priceTable };
  }
}
