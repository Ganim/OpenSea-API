import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FiscalDocument } from '@/entities/fiscal/fiscal-document';
import { FiscalDocumentEvent } from '@/entities/fiscal/fiscal-document-event';
import { FiscalDocumentItem } from '@/entities/fiscal/fiscal-document-item';
import type { FiscalConfigsRepository } from '@/repositories/fiscal/fiscal-configs-repository';
import type { FiscalDocumentEventsRepository } from '@/repositories/fiscal/fiscal-document-events-repository';
import type { FiscalDocumentItemsRepository } from '@/repositories/fiscal/fiscal-document-items-repository';
import type { FiscalDocumentsRepository } from '@/repositories/fiscal/fiscal-documents-repository';
import type { FiscalProvider } from '@/services/fiscal/fiscal-provider.interface';

interface EmitNFCeItemRequest {
  productId?: string;
  productName: string;
  productCode: string;
  ncm: string;
  cest?: string;
  cfop?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  cst: string;
  icmsBase?: number;
  icmsRate?: number;
  pisRate?: number;
  cofinsRate?: number;
}

interface EmitNFCeUseCaseRequest {
  tenantId: string;
  recipientCnpjCpf: string;
  recipientName: string;
  items: EmitNFCeItemRequest[];
  totalShipping?: number;
  additionalInfo?: string;
  orderId?: string;
}

interface EmitNFCeUseCaseResponse {
  fiscalDocument: FiscalDocument;
}

export class EmitNFCeUseCase {
  constructor(
    private fiscalConfigsRepository: FiscalConfigsRepository,
    private fiscalDocumentsRepository: FiscalDocumentsRepository,
    private fiscalDocumentItemsRepository: FiscalDocumentItemsRepository,
    private fiscalDocumentEventsRepository: FiscalDocumentEventsRepository,
    private fiscalProvider: FiscalProvider,
  ) {}

  async execute(
    request: EmitNFCeUseCaseRequest,
  ): Promise<EmitNFCeUseCaseResponse> {
    const fiscalConfig = await this.fiscalConfigsRepository.findByTenantId(
      request.tenantId,
    );

    if (!fiscalConfig) {
      throw new ResourceNotFoundError(
        'Fiscal configuration not found. Please configure fiscal settings before emitting documents.',
      );
    }

    if (!fiscalConfig.nfceEnabled) {
      throw new BadRequestError(
        'NFC-e emission is not enabled. Please enable it in the fiscal configuration.',
      );
    }

    if (request.items.length === 0) {
      throw new BadRequestError(
        'At least one item is required to emit an NFC-e.',
      );
    }

    const nextNumber = await this.fiscalDocumentsRepository.findNextNumber(
      fiscalConfig.id.toString(),
      'NFCE',
      fiscalConfig.defaultSeries,
    );

    const cfop = fiscalConfig.defaultCfop;
    const naturezaOperacao = fiscalConfig.defaultNaturezaOperacao;

    let totalProducts = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const documentId = new UniqueEntityID();

    const documentItems = request.items.map((requestItem, index) => {
      const itemTotalPrice = requestItem.quantity * requestItem.unitPrice;
      const itemDiscount = requestItem.discount ?? 0;
      const itemCfop = requestItem.cfop ?? cfop;

      const icmsBase = requestItem.icmsBase ?? itemTotalPrice - itemDiscount;
      const icmsRate = requestItem.icmsRate ?? 0;
      const icmsValue = icmsBase * (icmsRate / 100);

      const pisBase = itemTotalPrice - itemDiscount;
      const pisRate = requestItem.pisRate ?? 0;
      const pisValue = pisBase * (pisRate / 100);

      const cofinsBase = itemTotalPrice - itemDiscount;
      const cofinsRate = requestItem.cofinsRate ?? 0;
      const cofinsValue = cofinsBase * (cofinsRate / 100);

      totalProducts += itemTotalPrice;
      totalDiscount += itemDiscount;
      totalTax += icmsValue + pisValue + cofinsValue;

      return FiscalDocumentItem.create({
        fiscalDocumentId: documentId,
        itemNumber: index + 1,
        productId: requestItem.productId
          ? new UniqueEntityID(requestItem.productId)
          : undefined,
        productName: requestItem.productName,
        productCode: requestItem.productCode,
        ncm: requestItem.ncm,
        cest: requestItem.cest,
        cfop: itemCfop,
        quantity: requestItem.quantity,
        unitPrice: requestItem.unitPrice,
        totalPrice: itemTotalPrice,
        discount: itemDiscount,
        cst: requestItem.cst,
        icmsBase,
        icmsRate,
        icmsValue,
        pisBase,
        pisRate,
        pisValue,
        cofinsBase,
        cofinsRate,
        cofinsValue,
      });
    });

    const totalShipping = request.totalShipping ?? 0;
    const totalValue = totalProducts - totalDiscount + totalShipping + totalTax;

    const fiscalDocument = FiscalDocument.create(
      {
        tenantId: new UniqueEntityID(request.tenantId),
        configId: fiscalConfig.id,
        type: 'NFCE',
        series: fiscalConfig.defaultSeries,
        number: nextNumber,
        status: 'PENDING',
        recipientCnpjCpf: request.recipientCnpjCpf,
        recipientName: request.recipientName,
        naturezaOperacao,
        cfop,
        totalProducts,
        totalDiscount,
        totalShipping,
        totalTax,
        totalValue,
        additionalInfo: request.additionalInfo,
        orderId: request.orderId
          ? new UniqueEntityID(request.orderId)
          : undefined,
      },
      documentId,
    );

    await this.fiscalDocumentsRepository.create(fiscalDocument);
    await this.fiscalDocumentItemsRepository.createMany(documentItems);

    const emissionResult = await this.fiscalProvider.emitNFCe({
      config: fiscalConfig,
      document: fiscalDocument,
      items: documentItems,
    });

    const documentEvent = FiscalDocumentEvent.create({
      fiscalDocumentId: documentId,
      type: 'AUTHORIZATION',
      description: emissionResult.success
        ? `NFC-e ${nextNumber} authorized successfully`
        : `NFC-e ${nextNumber} emission failed: ${emissionResult.errorMessage}`,
      protocol: emissionResult.protocolNumber,
      success: emissionResult.success,
      errorCode: emissionResult.errorCode,
      errorMessage: emissionResult.errorMessage,
    });

    await this.fiscalDocumentEventsRepository.create(documentEvent);

    if (emissionResult.success) {
      fiscalDocument.markAsAuthorized(
        emissionResult.accessKey!,
        emissionResult.protocolNumber!,
        emissionResult.protocolDate!,
        emissionResult.xmlAuthorized!,
        emissionResult.externalId,
      );

      fiscalConfig.lastNfceNumber = nextNumber;
      await this.fiscalConfigsRepository.save(fiscalConfig);
    } else {
      fiscalDocument.markAsDenied();
    }

    await this.fiscalDocumentsRepository.save(fiscalDocument);

    return { fiscalDocument };
  }
}
