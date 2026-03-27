import { PrismaFormFieldsRepository } from '@/repositories/sales/prisma/prisma-form-fields-repository';
import { PrismaLandingPagesRepository } from '@/repositories/sales/prisma/prisma-landing-pages-repository';
import { RenderPublicLandingPageUseCase } from '../render-public-landing-page';

export function makeRenderPublicLandingPageUseCase() {
  const landingPagesRepository = new PrismaLandingPagesRepository();
  const formFieldsRepository = new PrismaFormFieldsRepository();
  return new RenderPublicLandingPageUseCase(
    landingPagesRepository,
    formFieldsRepository,
  );
}
