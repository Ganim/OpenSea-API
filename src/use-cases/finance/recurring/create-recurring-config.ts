import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import {
  type RecurringConfigDTO,
  recurringConfigToDTO,
} from '@/mappers/finance/recurring-config/recurring-config-to-dto';
import type { RecurringConfigsRepository } from '@/repositories/finance/recurring-configs-repository';

const VALID_FREQUENCY_UNITS = [
  'DAILY',
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'SEMIANNUAL',
  'ANNUAL',
];

const VALID_TYPES = ['PAYABLE', 'RECEIVABLE'];

interface CreateRecurringConfigUseCaseRequest {
  tenantId: string;
  type: string;
  description: string;
  categoryId: string;
  costCenterId?: string;
  bankAccountId?: string;
  supplierName?: string;
  customerName?: string;
  supplierId?: string;
  customerId?: string;
  expectedAmount: number;
  isVariable?: boolean;
  frequencyUnit: string;
  frequencyInterval?: number;
  startDate: Date;
  endDate?: Date;
  totalOccurrences?: number;
  interestRate?: number;
  penaltyRate?: number;
  notes?: string;
  createdBy?: string;
}

interface CreateRecurringConfigUseCaseResponse {
  config: RecurringConfigDTO;
}

export class CreateRecurringConfigUseCase {
  constructor(
    private recurringConfigsRepository: RecurringConfigsRepository,
  ) {}

  async execute(
    request: CreateRecurringConfigUseCaseRequest,
  ): Promise<CreateRecurringConfigUseCaseResponse> {
    const {
      tenantId,
      type,
      description,
      categoryId,
      expectedAmount,
      frequencyUnit,
      startDate,
      endDate,
    } = request;

    if (!VALID_TYPES.includes(type)) {
      throw new BadRequestError('Type must be PAYABLE or RECEIVABLE');
    }

    if (!description || description.trim().length === 0) {
      throw new BadRequestError('Description is required');
    }

    if (expectedAmount <= 0) {
      throw new BadRequestError('Expected amount must be positive');
    }

    if (!VALID_FREQUENCY_UNITS.includes(frequencyUnit)) {
      throw new BadRequestError(
        `Frequency unit must be one of: ${VALID_FREQUENCY_UNITS.join(', ')}`,
      );
    }

    if (endDate && endDate <= startDate) {
      throw new BadRequestError('End date must be after start date');
    }

    const config = await this.recurringConfigsRepository.create({
      tenantId,
      type,
      description: description.trim(),
      categoryId,
      costCenterId: request.costCenterId,
      bankAccountId: request.bankAccountId,
      supplierName: request.supplierName,
      customerName: request.customerName,
      supplierId: request.supplierId,
      customerId: request.customerId,
      expectedAmount,
      isVariable: request.isVariable ?? false,
      frequencyUnit,
      frequencyInterval: request.frequencyInterval ?? 1,
      startDate,
      endDate,
      totalOccurrences: request.totalOccurrences,
      nextDueDate: startDate,
      interestRate: request.interestRate,
      penaltyRate: request.penaltyRate,
      notes: request.notes,
      createdBy: request.createdBy,
    });

    return { config: recurringConfigToDTO(config) };
  }
}
