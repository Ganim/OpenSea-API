import { PrismaLandingPagesRepository } from '@/repositories/sales/prisma/prisma-landing-pages-repository';
import { UpdateLandingPageUseCase } from '../update-landing-page';

export function makeUpdateLandingPageUseCase() {
  const landingPagesRepository = new PrismaLandingPagesRepository();
  return new UpdateLandingPageUseCase(landingPagesRepository);
}
