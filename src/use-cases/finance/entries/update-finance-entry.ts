import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type FinanceEntryDTO,
  financeEntryToDTO,
} from '@/mappers/finance/finance-entry/finance-entry-to-dto';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import { queueAuditLog } from '@/workers/queues/audit.queue';

interface UpdateFinanceEntryUseCaseRequest {
  tenantId: string;
  id: string;
  userId?: string;
  description?: string;
  notes?: string | null;
  categoryId?: string;
  costCenterId?: string;
  bankAccountId?: string | null;
  supplierName?: string | null;
  customerName?: string | null;
  expectedAmount?: number;
  discount?: number;
  interest?: number;
  penalty?: number;
  dueDate?: Date;
  competenceDate?: Date | null;
  boletoBarcode?: string | null;
  boletoDigitLine?: string | null;
  beneficiaryName?: string | null;
  beneficiaryCpfCnpj?: string | null;
  pixKey?: string | null;
  pixKeyType?: string | null;
  tags?: string[];
}

interface UpdateFinanceEntryUseCaseResponse {
  entry: FinanceEntryDTO;
}

export class UpdateFinanceEntryUseCase {
  constructor(private financeEntriesRepository: FinanceEntriesRepository) {}

  async execute(
    request: UpdateFinanceEntryUseCaseRequest,
  ): Promise<UpdateFinanceEntryUseCaseResponse> {
    const { tenantId, id } = request;

    const existingEntry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );
    if (!existingEntry) {
      throw new ResourceNotFoundError('Finance entry not found');
    }

    const immutableStatuses = ['PAID', 'RECEIVED', 'CANCELLED'];
    if (immutableStatuses.includes(existingEntry.status)) {
      throw new BadRequestError(
        'Cannot update an entry with status ' + existingEntry.status,
      );
    }

    if (
      request.description !== undefined &&
      request.description.trim().length === 0
    ) {
      throw new BadRequestError('Description cannot be empty');
    }

    const updated = await this.financeEntriesRepository.update({
      id: new UniqueEntityID(id),
      tenantId,
      description: request.description?.trim(),
      notes: request.notes,
      categoryId: request.categoryId,
      costCenterId: request.costCenterId,
      bankAccountId: request.bankAccountId,
      supplierName: request.supplierName,
      customerName: request.customerName,
      expectedAmount: request.expectedAmount,
      discount: request.discount,
      interest: request.interest,
      penalty: request.penalty,
      dueDate: request.dueDate,
      competenceDate: request.competenceDate,
      boletoBarcode: request.boletoBarcode,
      boletoDigitLine: request.boletoDigitLine,
      beneficiaryName: request.beneficiaryName,
      beneficiaryCpfCnpj: request.beneficiaryCpfCnpj,
      pixKey: request.pixKey,
      pixKeyType: request.pixKeyType,
      tags: request.tags
        ? [
            ...new Set(
              request.tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
            ),
          ]
        : undefined,
    });

    if (!updated) {
      throw new ResourceNotFoundError('Finance entry not found');
    }

    // Build oldData/newData for audit by comparing changed fields
    const changedFields: Record<string, unknown> = {};
    const previousFields: Record<string, unknown> = {};

    if (
      request.description !== undefined &&
      request.description !== existingEntry.description
    ) {
      previousFields.description = existingEntry.description;
      changedFields.description = request.description;
    }
    if (
      request.expectedAmount !== undefined &&
      request.expectedAmount !== existingEntry.expectedAmount
    ) {
      previousFields.expectedAmount = existingEntry.expectedAmount;
      changedFields.expectedAmount = request.expectedAmount;
    }
    if (request.dueDate !== undefined) {
      previousFields.dueDate = existingEntry.dueDate.toISOString();
      changedFields.dueDate = request.dueDate.toISOString();
    }
    if (
      request.categoryId !== undefined &&
      request.categoryId !== existingEntry.categoryId.toString()
    ) {
      previousFields.categoryId = existingEntry.categoryId.toString();
      changedFields.categoryId = request.categoryId;
    }

    queueAuditLog({
      userId: request.userId,
      action: 'FINANCE_ENTRY_UPDATE',
      entity: 'FINANCE_ENTRY',
      entityId: id,
      module: 'FINANCE',
      description: `Updated finance entry ${existingEntry.code}`,
      oldData: previousFields,
      newData: changedFields,
      metadata: {
        code: existingEntry.code,
        type: existingEntry.type,
      },
    }).catch(() => {});

    return { entry: financeEntryToDTO(updated) };
  }
}
