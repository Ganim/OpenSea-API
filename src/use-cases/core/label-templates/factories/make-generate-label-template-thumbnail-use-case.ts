import { PrismaLabelTemplatesRepository } from '@/repositories/core/prisma/prisma-label-templates-repository';
import { GenerateLabelTemplateThumbnailUseCase } from '../generate-label-template-thumbnail';

export function makeGenerateLabelTemplateThumbnailUseCase() {
  const labelTemplatesRepository = new PrismaLabelTemplatesRepository();
  return new GenerateLabelTemplateThumbnailUseCase(labelTemplatesRepository);
}
