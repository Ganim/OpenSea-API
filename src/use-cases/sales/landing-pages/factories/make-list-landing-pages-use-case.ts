import { PrismaLandingPagesRepository } from '@/repositories/sales/prisma/prisma-landing-pages-repository';
import { ListLandingPagesUseCase } from '../list-landing-pages';

export function makeListLandingPagesUseCase() {
  const landingPagesRepository = new PrismaLandingPagesRepository();
  return new ListLandingPagesUseCase(landingPagesRepository);
}
