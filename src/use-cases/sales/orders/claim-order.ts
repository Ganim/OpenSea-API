import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Order } from '@/entities/sales/order';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';

const CLAIM_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface ClaimOrderUseCaseRequest {
  tenantId: string;
  orderId: string;
  userId: string;
}

interface ClaimOrderUseCaseResponse {
  order: Order;
}

export class ClaimOrderUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute(
    input: ClaimOrderUseCaseRequest,
  ): Promise<ClaimOrderUseCaseResponse> {
    const order = await this.ordersRepository.findById(
      new UniqueEntityID(input.orderId),
      input.tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Order not found.');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestError(
        'Only orders with PENDING status can be claimed.',
      );
    }

    const now = new Date();
    const claimedByCurrentUser =
      order.claimedByUserId?.toString() === input.userId;

    if (order.claimedByUserId && order.claimedAt) {
      const claimAge = now.getTime() - order.claimedAt.getTime();
      const isClaimExpired = claimAge >= CLAIM_EXPIRY_MS;

      if (claimedByCurrentUser) {
        // Same user re-claiming: refresh the claim timestamp
        order.claimedAt = now;
        await this.ordersRepository.save(order);
        return { order };
      }

      if (!isClaimExpired) {
        // Another user holds a valid (non-expired) claim
        throw new ConflictError(
          'This order is already claimed by another cashier.',
        );
      }
    }

    // Unclaimed or expired claim: assign to requesting user
    order.claimedByUserId = new UniqueEntityID(input.userId);
    order.claimedAt = now;

    await this.ordersRepository.save(order);

    return { order };
  }
}
