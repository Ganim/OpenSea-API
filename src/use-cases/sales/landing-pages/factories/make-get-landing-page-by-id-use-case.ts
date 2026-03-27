import { PrismaLandingPagesRepository } from '@/repositories/sales/prisma/prisma-landing-pages-repository';
import { GetLandingPageByIdUseCase } from '../get-landing-page-by-id';

export function makeGetLandingPageByIdUseCase() {
  const landingPagesRepository = new PrismaLandingPagesRepository();
  return new GetLandingPageByIdUseCase(landingPagesRepository);
}
