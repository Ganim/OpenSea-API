import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PrintJob } from '@/entities/sales/print-job';
import { SALES_EVENTS } from '@/lib/events/sales-events';
import { getTypedEventBus } from '@/lib/events/typed-event-bus';
import type { OrderItemsRepository } from '@/repositories/sales/order-items-repository';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';
import type { PosPrintersRepository } from '@/repositories/sales/pos-printers-repository';
import type { PrintJobsRepository } from '@/repositories/sales/print-jobs-repository';
import {
  ReceiptBuilder,
  type CompanyData,
} from '@/services/printer/receipt-template';

interface QueueReceiptUseCaseRequest {
  tenantId: string;
  orderId: string;
  printerId?: string;
}

interface QueueReceiptUseCaseResponse {
  jobId: string;
  status: 'queued';
}

export class QueueReceiptUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private orderItemsRepository: OrderItemsRepository,
    private posPrintersRepository: PosPrintersRepository,
    private printJobsRepository: PrintJobsRepository,
  ) {}

  async execute(
    input: QueueReceiptUseCaseRequest,
  ): Promise<QueueReceiptUseCaseResponse> {
    const order = await this.ordersRepository.findById(
      new UniqueEntityID(input.orderId),
      input.tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Order not found.');
    }

    const printer = input.printerId
      ? await this.posPrintersRepository.findById(
          new UniqueEntityID(input.printerId),
          input.tenantId,
        )
      : await this.posPrintersRepository.findDefaultByTenant(input.tenantId);

    if (!printer) {
      throw new BadRequestError(
        'Printer not found or no default printer configured.',
      );
    }

    const orderItems = await this.orderItemsRepository.findManyByOrder(
      order.id,
      input.tenantId,
    );

    if (orderItems.length === 0) {
      throw new BadRequestError('Order has no items to print.');
    }

    const companyInfo: CompanyData = {
      name: 'OpenSea',
      cnpj: '00.000.000/0000-00',
    };

    const receiptBuilder = new ReceiptBuilder({
      paperWidth: printer.paperWidth,
      companyName: companyInfo.name,
      cnpj: companyInfo.cnpj,
    })
      .addHeader(companyInfo)
      .addItems(
        orderItems.map((item) => ({
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
      .addPaymentMethod('PENDENTE', order.remainingAmount)
      .addQrCode(order.id.toString())
      .addFooter();

    const escposContent = receiptBuilder.generate().toBase64();

    const printJob = PrintJob.create({
      tenantId: new UniqueEntityID(input.tenantId),
      printerId: printer.id,
      orderId: order.id.toString(),
      type: 'RECEIPT',
      status: 'CREATED',
      content: escposContent,
      templateData: {
        orderNumber: order.orderNumber,
        channel: order.channel,
      },
    });

    await this.printJobsRepository.create(printJob);

    try {
      await getTypedEventBus().publish({
        type: SALES_EVENTS.PRINT_JOB_QUEUED,
        version: 1,
        tenantId: input.tenantId,
        source: 'sales',
        sourceEntityType: 'print-job',
        sourceEntityId: printJob.id.toString(),
        data: {
          jobId: printJob.id.toString(),
          orderId: order.id.toString(),
          printerId: printer.id.toString(),
          status: 'CREATED',
        },
        metadata: {},
      });
    } catch {
      // Event failure should not block queueing print jobs.
    }

    return {
      jobId: printJob.id.toString(),
      status: 'queued',
    };
  }
}
