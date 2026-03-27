import { PrismaQuotesRepository } from '@/repositories/sales/prisma/prisma-quotes-repository';
import { makeGetEnvelopeByIdUseCase } from '@/use-cases/signature/envelopes/factories/make-get-envelope-by-id-use-case';
import { GetQuoteSignatureStatusUseCase } from '../get-quote-signature-status';

export function makeGetQuoteSignatureStatusUseCase() {
  return new GetQuoteSignatureStatusUseCase(
    new PrismaQuotesRepository(),
    makeGetEnvelopeByIdUseCase(),
  );
}
