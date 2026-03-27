import { PrismaLandingPagesRepository } from '@/repositories/sales/prisma/prisma-landing-pages-repository';
import { PublishLandingPageUseCase } from '../publish-landing-page';

export function makePublishLandingPageUseCase() {
  const landingPagesRepository = new PrismaLandingPagesRepository();
  return new PublishLandingPageUseCase(landingPagesRepository);
}
