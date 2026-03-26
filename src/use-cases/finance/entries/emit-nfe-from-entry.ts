import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FiscalDocument } from '@/entities/fiscal/fiscal-document';
import type { FiscalDocumentType } from '@/entities/fiscal/fiscal-document';
import { FiscalDocumentItem } from '@/entities/fiscal/fiscal-document-item';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { FiscalConfigsRepository } from '@/repositories/fiscal/fiscal-configs-repository';
import type { FiscalDocumentItemsRepository } from '@/repositories/fiscal/fiscal-document-items-repository';
import type { FiscalDocumentsRepository } from '@/repositories/fiscal/fiscal-documents-repository';
import type { FiscalProvider as FiscalProviderInterface } from '@/services/fiscal/fiscal-provider.interface';

interface NFeItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  ncm?: string;
  cfop?: string;
  issRate?: number;
}

interface EmitNfeFromEntryRequest {
  entryId: string;
  tenantId: string;
  documentType: 'NFE' | 'NFSE';
  items: NFeItemInput[];
  notes?: string;
}

interface EmitNfeFromEntryResponse {
  fiscalDocument: {
    id: string;
    type: FiscalDocumentType;
    series: number;
    number: number;
    accessKey?: string;
    status: string;
    danfePdfUrl?: string;
    protocolNumber?: string;
    totalValue: number;
  };
}

export class EmitNfeFromEntryUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private fiscalConfigsRepository: FiscalConfigsRepository,
    private fiscalDocumentsRepository: FiscalDocumentsRepository,
    private fiscalDocumentItemsRepository: FiscalDocumentItemsRepository,
    private fiscalProvider: FiscalProviderInterface,
  ) {}

  async execute(
    request: EmitNfeFromEntryRequest,
  ): Promise<EmitNfeFromEntryResponse> {
    const { entryId, tenantId, documentType, items, notes } = request;

    // 1. Validate entry exists and is RECEIVABLE
    const entry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(entryId),
      tenantId,
    );

    if (!entry) {
      throw new ResourceNotFoundError('Finance entry not found');
    }

    if (entry.type !== 'RECEIVABLE') {
      throw new BadRequestError(
        'Only receivable entries can emit fiscal documents',
      );
    }

    // 2. Validate entry doesn't already have a fiscal document
    if (entry.fiscalDocumentId) {
      throw new BadRequestError(
        'This entry already has a fiscal document linked',
      );
    }

    // 3. Validate items
    if (!items || items.length === 0) {
      throw new BadRequestError(
        'At least one item is required to emit a fiscal document',
      );
    }

    // 4. Fetch fiscal config for tenant
    const fiscalConfig =
      await this.fiscalConfigsRepository.findByTenantId(tenantId);

    if (!fiscalConfig) {
      throw new BadRequestError(
        'Fiscal configuration not found. Please configure fiscal settings first.',
      );
    }

    if (!fiscalConfig.apiKey) {
      throw new BadRequestError(
        'Fiscal API key not configured. Please configure fiscal settings first.',
      );
    }

    // 5. Determine series and next number
    const series = fiscalConfig.defaultSeries;
    const nextNumber = await this.fiscalDocumentsRepository.findNextNumber(
      fiscalConfig.id.toString(),
      documentType,
      series,
    );

    // 6. Build totals from items
    const totalProducts = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    // 7. Build the customer info from entry
    const recipientName = entry.customerName || 'Consumidor Final';
    const recipientCnpjCpf = entry.beneficiaryCpfCnpj || '';
    const naturezaOperacao =
      fiscalConfig.defaultNaturezaOperacao || 'Prestacao de Servicos';
    const defaultCfop = fiscalConfig.defaultCfop || '5102';

    // 8. Create the FiscalDocument entity
    const fiscalDocument = FiscalDocument.create({
      tenantId: new UniqueEntityID(tenantId),
      configId: fiscalConfig.id,
      type: documentType,
      series,
      number: nextNumber,
      recipientCnpjCpf,
      recipientName,
      naturezaOperacao,
      cfop: defaultCfop,
      totalProducts: Math.round(totalProducts * 100) / 100,
      totalValue: Math.round(totalProducts * 100) / 100,
      additionalInfo: notes,
    });

    // 9. Create FiscalDocumentItem entities
    const fiscalItems = items.map((item, index) =>
      FiscalDocumentItem.create({
        fiscalDocumentId: fiscalDocument.id,
        itemNumber: index + 1,
        productName: item.description,
        productCode: `SRV-${index + 1}`,
        ncm: item.ncm || '00000000',
        cfop: item.cfop || defaultCfop,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: Math.round(item.quantity * item.unitPrice * 100) / 100,
        cst: '00',
      }),
    );

    // 10. Persist the document and items
    await this.fiscalDocumentsRepository.create(fiscalDocument);
    await this.fiscalDocumentItemsRepository.createMany(fiscalItems);

    // 11. Call the fiscal provider to emit
    const emissionResult = await this.fiscalProvider.emitNFe({
      config: fiscalConfig,
      document: fiscalDocument,
      items: fiscalItems,
    });

    // 12. Update document with emission result
    if (emissionResult.success) {
      fiscalDocument.markAsAuthorized(
        emissionResult.accessKey!,
        emissionResult.protocolNumber!,
        emissionResult.protocolDate ?? new Date(),
        emissionResult.xmlAuthorized ?? '',
        emissionResult.externalId,
      );
    } else {
      fiscalDocument.markAsDenied();
      await this.fiscalDocumentsRepository.save(fiscalDocument);
      throw new BadRequestError(
        `Fiscal emission failed: ${emissionResult.errorMessage || 'Unknown error'}`,
      );
    }

    // 13. Save updated document
    await this.fiscalDocumentsRepository.save(fiscalDocument);

    // 14. Link fiscal document to finance entry
    await this.financeEntriesRepository.update({
      id: new UniqueEntityID(entryId),
      tenantId,
      fiscalDocumentId: fiscalDocument.id.toString(),
    });

    return {
      fiscalDocument: {
        id: fiscalDocument.id.toString(),
        type: fiscalDocument.type,
        series: fiscalDocument.series,
        number: fiscalDocument.number,
        accessKey: fiscalDocument.accessKey,
        status: fiscalDocument.status,
        danfePdfUrl: fiscalDocument.danfePdfUrl,
        protocolNumber: fiscalDocument.protocolNumber,
        totalValue: fiscalDocument.totalValue,
      },
    };
  }
}
