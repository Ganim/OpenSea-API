import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { LandingPageDTO } from '@/mappers/sales/landing-page/landing-page-to-dto';
import { landingPageToDTO } from '@/mappers/sales/landing-page/landing-page-to-dto';
import type { LandingPagesRepository } from '@/repositories/sales/landing-pages-repository';

interface CreateLandingPageUseCaseRequest {
  tenantId: string;
  title: string;
  slug: string;
  description?: string;
  template?: string;
  content?: Record<string, unknown>;
  formId?: string;
  createdBy: string;
}

interface CreateLandingPageUseCaseResponse {
  landingPage: LandingPageDTO;
}

export class CreateLandingPageUseCase {
  constructor(private landingPagesRepository: LandingPagesRepository) {}

  async execute(
    input: CreateLandingPageUseCaseRequest,
  ): Promise<CreateLandingPageUseCaseResponse> {
    if (!input.title || input.title.trim().length === 0) {
      throw new BadRequestError('Landing page title is required.');
    }

    if (input.title.length > 255) {
      throw new BadRequestError(
        'Landing page title cannot exceed 255 characters.',
      );
    }

    if (!input.slug || input.slug.trim().length === 0) {
      throw new BadRequestError('Landing page slug is required.');
    }

    if (input.slug.length > 100) {
      throw new BadRequestError(
        'Landing page slug cannot exceed 100 characters.',
      );
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(input.slug)) {
      throw new BadRequestError(
        'Slug must contain only lowercase letters, numbers, and hyphens.',
      );
    }

    const existingLandingPage = await this.landingPagesRepository.findBySlug(
      input.slug,
      input.tenantId,
    );

    if (existingLandingPage) {
      throw new BadRequestError(
        'A landing page with this slug already exists.',
      );
    }

    const landingPage = await this.landingPagesRepository.create({
      tenantId: input.tenantId,
      title: input.title.trim(),
      slug: input.slug.trim(),
      description: input.description?.trim(),
      template: input.template,
      content: input.content,
      formId: input.formId,
      createdBy: input.createdBy,
    });

    return {
      landingPage: landingPageToDTO(landingPage),
    };
  }
}
