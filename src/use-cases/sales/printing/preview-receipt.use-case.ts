import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OrderItemsRepository } from '@/repositories/sales/order-items-repository';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';
import {
  ReceiptBuilder,
  type CompanyData,
} from '@/services/printer/receipt-template';

interface PreviewReceiptUseCaseRequest {
  tenantId: string;
  orderId: string;
}

interface PreviewReceiptUseCaseResponse {
  content: string;
  format: 'escpos';
}

export class PreviewReceiptUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private orderItemsRepository: OrderItemsRepository,
  ) {}

  async execute(
    input: PreviewReceiptUseCaseRequest,
  ): Promise<PreviewReceiptUseCaseResponse> {
    const order = await this.ordersRepository.findById(
      new UniqueEntityID(input.orderId),
      input.tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Order not found.');
    }

    const items = await this.orderItemsRepository.findManyByOrder(
      order.id,
      input.tenantId,
    );

    const companyInfo: CompanyData = {
      name: 'OpenSea',
      cnpj: '00.000.000/0000-00',
    };

    const receipt = new ReceiptBuilder({
      paperWidth: 80,
      companyName: companyInfo.name,
      cnpj: companyInfo.cnpj,
    })
      .addHeader(companyInfo)
      .addItems(
        items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
      )
      .addTotals(
        order.subtotal,
        order.discountTotal,
        order.grandTotal,
        order.taxTotal,
      )
      .addFooter()
      .generate()
      .toBase64();

    return {
      content: receipt,
      format: 'escpos',
    };
  }
}
