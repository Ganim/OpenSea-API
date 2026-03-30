import type { FinanceEntryDTO } from '@/mappers/finance/finance-entry/finance-entry-to-dto';
import { financeEntryToDTO } from '@/mappers/finance/finance-entry/finance-entry-to-dto';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import { queueAuditLog } from '@/workers/queues/audit.queue';

interface CreateEntryFromSalesOrderUseCaseRequest {
  tenantId: string;
  salesOrderId: string;
  customerId?: string;
  customerName?: string;
  totalAmount: number;
  dueDate: Date;
  description: string;
  userId?: string;
}

interface CreateEntryFromSalesOrderUseCaseResponse {
  entry: FinanceEntryDTO;
}

export class CreateEntryFromSalesOrderUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private financeCategoriesRepository: FinanceCategoriesRepository,
  ) {}

  async execute(
    request: CreateEntryFromSalesOrderUseCaseRequest,
  ): Promise<CreateEntryFromSalesOrderUseCaseResponse> {
    const {
      tenantId,
      salesOrderId,
      customerId,
      customerName,
      totalAmount,
      dueDate,
      description,
      userId,
    } = request;

    // Find or use a default "Vendas" category
    let salesCategory = await this.financeCategoriesRepository.findByName(
      'Vendas',
      tenantId,
    );

    if (!salesCategory) {
      salesCategory = await this.financeCategoriesRepository.create({
        tenantId,
        name: 'Vendas',
        slug: 'vendas',
        type: 'RECEIVABLE',
        color: '#10B981',
        isSystem: true,
      });
    }

    const entryCode = await this.financeEntriesRepository.generateNextCode(
      tenantId,
      'RECEIVABLE',
    );

    const entry = await this.financeEntriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: entryCode,
      description: `Pedido de venda: ${description}`,
      categoryId: salesCategory.id.toString(),
      customerId,
      customerName,
      salesOrderId,
      expectedAmount: totalAmount,
      issueDate: new Date(),
      dueDate,
      competenceDate: new Date(),
      status: 'PENDING',
      tags: ['sales-order'],
      createdBy: userId,
    });

    queueAuditLog({
      userId,
      action: 'FINANCE_ENTRY_CREATE_FROM_SALES_ORDER',
      entity: 'FINANCE_ENTRY',
      entityId: entry.id.toString(),
      module: 'FINANCE',
      description: `Created receivable entry ${entryCode} from sales order ${salesOrderId}`,
      newData: {
        salesOrderId,
        totalAmount,
        entryCode,
      },
    }).catch(() => {});

    return {
      entry: financeEntryToDTO(entry),
    };
  }
}
