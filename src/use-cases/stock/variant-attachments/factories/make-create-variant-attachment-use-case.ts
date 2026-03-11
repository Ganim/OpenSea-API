import { PrismaVariantAttachmentsRepository } from '@/repositories/stock/prisma/prisma-variant-attachments-repository';
import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';
import { CreateVariantAttachmentUseCase } from '../create-variant-attachment';

export function makeCreateVariantAttachmentUseCase() {
  const variantAttachmentsRepository = new PrismaVariantAttachmentsRepository();
  const variantsRepository = new PrismaVariantsRepository();

  return new CreateVariantAttachmentUseCase(
    variantAttachmentsRepository,
    variantsRepository,
  );
}
