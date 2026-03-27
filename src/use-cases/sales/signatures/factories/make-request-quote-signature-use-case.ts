import { PrismaCustomersRepository } from '@/repositories/sales/prisma/prisma-customers-repository';
import { PrismaQuotesRepository } from '@/repositories/sales/prisma/prisma-quotes-repository';
import { makeCreateEnvelopeUseCase } from '@/use-cases/signature/envelopes/factories/make-create-envelope-use-case';
import { RequestQuoteSignatureUseCase } from '../request-quote-signature';

export function makeRequestQuoteSignatureUseCase() {
  return new RequestQuoteSignatureUseCase(
    new PrismaQuotesRepository(),
    new PrismaCustomersRepository(),
    makeCreateEnvelopeUseCase(),
  );
}
