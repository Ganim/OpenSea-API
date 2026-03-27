import { PrismaLandingPagesRepository } from '@/repositories/sales/prisma/prisma-landing-pages-repository';
import { UnpublishLandingPageUseCase } from '../unpublish-landing-page';

export function makeUnpublishLandingPageUseCase() {
  const landingPagesRepository = new PrismaLandingPagesRepository();
  return new UnpublishLandingPageUseCase(landingPagesRepository);
}
