import { PrismaSignatureEnvelopesRepository } from '@/repositories/signature/prisma/prisma-signature-envelopes-repository';
import { ListEnvelopesUseCase } from '../list-envelopes';

export function makeListEnvelopesUseCase() {
  return new ListEnvelopesUseCase(new PrismaSignatureEnvelopesRepository());
}
