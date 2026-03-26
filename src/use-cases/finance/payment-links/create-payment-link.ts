import { randomBytes } from 'node:crypto';
import type {
  PaymentLinkRecord,
  PaymentLinksRepository,
} from '@/repositories/finance/payment-links-repository';

interface CreatePaymentLinkUseCaseRequest {
  tenantId: string;
  entryId?: string;
  amount: number;
  description: string;
  customerName?: string;
  expiresAt?: Date;
  enablePix?: boolean;
  enableBoleto?: boolean;
}

interface CreatePaymentLinkUseCaseResponse {
  paymentLink: PaymentLinkRecord;
  url: string;
}

function generateSlug(): string {
  return randomBytes(8).toString('base64url').slice(0, 12);
}

export class CreatePaymentLinkUseCase {
  constructor(private paymentLinksRepository: PaymentLinksRepository) {}

  async execute(
    request: CreatePaymentLinkUseCaseRequest,
  ): Promise<CreatePaymentLinkUseCaseResponse> {
    const {
      tenantId,
      entryId,
      amount,
      description,
      customerName,
      expiresAt,
    } = request;

    // Generate unique slug
    let slug = generateSlug();
    let attempts = 0;

    // Ensure slug uniqueness (very unlikely collision, but be safe)
    while (attempts < 5) {
      const existing = await this.paymentLinksRepository.findBySlug(slug);
      if (!existing) break;
      slug = generateSlug();
      attempts++;
    }

    const paymentLink = await this.paymentLinksRepository.create({
      tenantId,
      entryId,
      slug,
      amount,
      description,
      customerName,
      expiresAt,
    });

    // Base URL for payment links
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const url = `${baseUrl}/pay/${paymentLink.slug}`;

    return { paymentLink, url };
  }
}
