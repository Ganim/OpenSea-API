import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Order } from '@/entities/sales/order';
import type { CustomersRepository } from '@/repositories/sales/customers-repository';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';
import type { PipelineStagesRepository } from '@/repositories/sales/pipeline-stages-repository';
import type { PipelinesRepository } from '@/repositories/sales/pipelines-repository';

const SALE_CODE_LENGTH = 6;
const SALE_CODE_FALLBACK_LENGTH = 8;
const SALE_CODE_MAX_RETRIES = 5;
const SALE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0/O/1/I confusion

interface CreatePdvOrderUseCaseRequest {
  tenantId: string;
  assignedToUserId: string;
  customerId?: string;
  terminalId?: string;
}

interface CreatePdvOrderUseCaseResponse {
  order: Order;
}

export class CreatePdvOrderUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private pipelinesRepository: PipelinesRepository,
    private pipelineStagesRepository: PipelineStagesRepository,
    private customersRepository: CustomersRepository,
  ) {}

  async execute(
    input: CreatePdvOrderUseCaseRequest,
  ): Promise<CreatePdvOrderUseCaseResponse> {
    // Find PDV pipeline
    const pdvPipeline = await this.pipelinesRepository.findByName(
      'PDV',
      input.tenantId,
    );

    if (!pdvPipeline) {
      throw new ResourceNotFoundError(
        'PDV pipeline not found. Please ensure the PDV pipeline is configured.',
      );
    }

    // Find first stage of PDV pipeline
    const pipelineStages =
      await this.pipelineStagesRepository.findManyByPipeline(pdvPipeline.id);

    if (pipelineStages.length === 0) {
      throw new BadRequestError('PDV pipeline has no stages configured.');
    }

    const firstStage = pipelineStages[0];

    // Resolve customer
    let resolvedCustomerId: UniqueEntityID;

    if (input.customerId) {
      const customer = await this.customersRepository.findById(
        new UniqueEntityID(input.customerId),
        input.tenantId,
      );

      if (!customer) {
        throw new ResourceNotFoundError('Customer not found.');
      }

      resolvedCustomerId = customer.id;
    } else {
      const systemCustomer = await this.customersRepository.findSystemDefault(
        input.tenantId,
      );

      if (!systemCustomer) {
        throw new ResourceNotFoundError(
          'System default customer not found. Please configure a default PDV customer.',
        );
      }

      resolvedCustomerId = systemCustomer.id;
    }

    // Generate unique sale code
    const saleCode = await this.generateUniqueSaleCode(input.tenantId);

    // Generate order number
    const orderNumber = await this.ordersRepository.generateOrderNumber(
      input.tenantId,
    );

    const order = Order.create({
      tenantId: new UniqueEntityID(input.tenantId),
      orderNumber,
      type: 'ORDER',
      status: 'DRAFT',
      channel: 'PDV',
      customerId: resolvedCustomerId,
      pipelineId: pdvPipeline.id,
      stageId: firstStage.id,
      subtotal: 0,
      grandTotal: 0,
      saleCode,
      assignedToUserId: new UniqueEntityID(input.assignedToUserId),
    });

    await this.ordersRepository.create(order);

    return { order };
  }

  private async generateUniqueSaleCode(tenantId: string): Promise<string> {
    for (let attempt = 0; attempt < SALE_CODE_MAX_RETRIES; attempt++) {
      const code = this.generateRandomCode(SALE_CODE_LENGTH);
      const existing = await this.ordersRepository.findBySaleCode(
        code,
        tenantId,
      );

      if (!existing) {
        return code;
      }
    }

    // Fallback to longer code for uniqueness
    const fallbackCode = this.generateRandomCode(SALE_CODE_FALLBACK_LENGTH);
    return fallbackCode;
  }

  private generateRandomCode(length: number): string {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += SALE_CODE_CHARS.charAt(
        Math.floor(Math.random() * SALE_CODE_CHARS.length),
      );
    }
    return code;
  }
}
