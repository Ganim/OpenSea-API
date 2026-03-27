import { PrismaLandingPagesRepository } from '@/repositories/sales/prisma/prisma-landing-pages-repository';
import { CreateLandingPageUseCase } from '../create-landing-page';

export function makeCreateLandingPageUseCase() {
  const landingPagesRepository = new PrismaLandingPagesRepository();
  return new CreateLandingPageUseCase(landingPagesRepository);
}
