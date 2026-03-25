import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type {
  FinanceEntryType,
  RecurrenceType,
  RecurrenceUnit,
} from '@/entities/finance/finance-entry-types';
import type { FinanceEntryDTO } from '@/mappers/finance/finance-entry/finance-entry-to-dto';
import type { CreateFinanceEntryUseCase } from './create-finance-entry';

interface EntryInput {
  type: FinanceEntryType;
  description: string;
  notes?: string;
  categoryId: string;
  costCenterId?: string;
  costCenterAllocations?: { costCenterId: string; percentage: number }[];
  bankAccountId?: string;
  supplierName?: string;
  customerName?: string;
  supplierId?: string;
  customerId?: string;
  salesOrderId?: string;
  expectedAmount: number;
  discount?: number;
  interest?: number;
  penalty?: number;
  issueDate: Date;
  dueDate: Date;
  competenceDate?: Date;
  recurrenceType?: RecurrenceType;
  recurrenceInterval?: number;
  recurrenceUnit?: RecurrenceUnit;
  totalInstallments?: number;
  currentInstallment?: number;
  boletoBarcode?: string;
  boletoDigitLine?: string;
  beneficiaryName?: string;
  beneficiaryCpfCnpj?: string;
  pixKey?: string;
  pixKeyType?: string;
  tags?: string[];
}

interface CreateFinanceEntriesBatchRequest {
  entries: EntryInput[];
  userId: string;
  tenantId: string;
}

interface CreateFinanceEntriesBatchResponse {
  created: number;
  entries: FinanceEntryDTO[];
}

export class CreateFinanceEntriesBatchUseCase {
  constructor(private createFinanceEntryUseCase: CreateFinanceEntryUseCase) {}

  async execute(
    request: CreateFinanceEntriesBatchRequest,
  ): Promise<CreateFinanceEntriesBatchResponse> {
    const { entries, userId, tenantId } = request;

    if (!entries || entries.length === 0) {
      throw new BadRequestError('At least one entry is required');
    }

    if (entries.length > 20) {
      throw new BadRequestError('Maximum of 20 entries per batch');
    }

    const createdEntries: FinanceEntryDTO[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entryInput = entries[i];
      try {
        const result = await this.createFinanceEntryUseCase.execute({
          tenantId,
          createdBy: userId,
          ...entryInput,
        });
        createdEntries.push(result.entry);
      } catch (error) {
        if (error instanceof BadRequestError) {
          throw new BadRequestError(`Entry ${i + 1}: ${error.message}`);
        }
        throw error;
      }
    }

    return {
      created: createdEntries.length,
      entries: createdEntries,
    };
  }
}
