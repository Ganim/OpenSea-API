import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OrderReturn } from '@/entities/sales/order-return';
import type { OrderReturnsRepository } from '@/repositories/sales/order-returns-repository';

interface ApproveReturnUseCaseRequest {
  returnId: string;
  tenantId: string;
  userId: string;
}

interface ApproveReturnUseCaseResponse {
  orderReturn: OrderReturn;
}

export class ApproveReturnUseCase {
  constructor(private orderReturnsRepository: OrderReturnsRepository) {}

  async execute(
    input: ApproveReturnUseCaseRequest,
  ): Promise<ApproveReturnUseCaseResponse> {
    const orderReturn = await this.orderReturnsRepository.findById(
      new UniqueEntityID(input.returnId),
      input.tenantId,
    );

    if (!orderReturn) {
      throw new ResourceNotFoundError('Return not found.');
    }

    if (orderReturn.status !== 'REQUESTED') {
      throw new BadRequestError('Only requested returns can be approved.');
    }

    orderReturn.approve(new UniqueEntityID(input.userId));

    await this.orderReturnsRepository.save(orderReturn);

    return { orderReturn };
  }
}
