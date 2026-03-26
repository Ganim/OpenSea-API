import { ErrorCodes } from '@/@errors/error-codes';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  PaymentLinkRecord,
  PaymentLinksRepository,
} from '@/repositories/finance/payment-links-repository';

interface GetPaymentLinkPublicUseCaseRequest {
  slug: string;
}

interface GetPaymentLinkPublicUseCaseResponse {
  paymentLink: PaymentLinkRecord;
}

export class GetPaymentLinkPublicUseCase {
  constructor(private paymentLinksRepository: PaymentLinksRepository) {}

  async execute(
    request: GetPaymentLinkPublicUseCaseRequest,
  ): Promise<GetPaymentLinkPublicUseCaseResponse> {
    const { slug } = request;

    const paymentLink = await this.paymentLinksRepository.findBySlug(slug);

    if (!paymentLink) {
      throw new ResourceNotFoundError(
        'Payment link not found',
        ErrorCodes.RESOURCE_NOT_FOUND,
      );
    }

    // Check expiration
    if (
      paymentLink.expiresAt &&
      new Date(paymentLink.expiresAt) < new Date() &&
      paymentLink.status === 'ACTIVE'
    ) {
      // Note: we still return the link but the frontend will show expired state
      return {
        paymentLink: {
          ...paymentLink,
          status: 'EXPIRED',
        },
      };
    }

    return { paymentLink };
  }
}
