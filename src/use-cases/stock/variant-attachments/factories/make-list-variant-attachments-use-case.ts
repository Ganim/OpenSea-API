import { PrismaVariantAttachmentsRepository } from '@/repositories/stock/prisma/prisma-variant-attachments-repository';
import { ListVariantAttachmentsUseCase } from '../list-variant-attachments';

export function makeListVariantAttachmentsUseCase() {
  const variantAttachmentsRepository =
    new PrismaVariantAttachmentsRepository();

  return new ListVariantAttachmentsUseCase(
    variantAttachmentsRepository,
  );
}
