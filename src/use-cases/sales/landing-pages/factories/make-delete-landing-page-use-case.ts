import { PrismaLandingPagesRepository } from '@/repositories/sales/prisma/prisma-landing-pages-repository';
import { DeleteLandingPageUseCase } from '../delete-landing-page';

export function makeDeleteLandingPageUseCase() {
  const landingPagesRepository = new PrismaLandingPagesRepository();
  return new DeleteLandingPageUseCase(landingPagesRepository);
}
