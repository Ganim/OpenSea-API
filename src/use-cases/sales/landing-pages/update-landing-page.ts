import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { LandingPageDTO } from '@/mappers/sales/landing-page/landing-page-to-dto';
import { landingPageToDTO } from '@/mappers/sales/landing-page/landing-page-to-dto';
import type { LandingPagesRepository } from '@/repositories/sales/landing-pages-repository';

interface UpdateLandingPageUseCaseRequest {
  tenantId: string;
  landingPageId: string;
  title?: string;
  slug?: string;
  description?: string;
  template?: string;
  content?: Record<string, unknown>;
  formId?: string | null;
}

interface UpdateLandingPageUseCaseResponse {
  landingPage: LandingPageDTO;
}

export class UpdateLandingPageUseCase {
  constructor(private landingPagesRepository: LandingPagesRepository) {}

  async execute(
    input: UpdateLandingPageUseCaseRequest,
  ): Promise<UpdateLandingPageUseCaseResponse> {
    const landingPage = await this.landingPagesRepository.findById(
      new UniqueEntityID(input.landingPageId),
      input.tenantId,
    );

    if (!landingPage) {
      throw new ResourceNotFoundError('Landing page not found.');
    }

    if (input.title !== undefined) {
      if (input.title.trim().length === 0) {
        throw new BadRequestError('Landing page title is required.');
      }
      if (input.title.length > 255) {
        throw new BadRequestError(
          'Landing page title cannot exceed 255 characters.',
        );
      }
      landingPage.title = input.title.trim();
    }

    if (input.slug !== undefined) {
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(input.slug)) {
        throw new BadRequestError(
          'Slug must contain only lowercase letters, numbers, and hyphens.',
        );
      }

      if (input.slug !== landingPage.slug) {
        const existingLandingPage =
          await this.landingPagesRepository.findBySlug(
            input.slug,
            input.tenantId,
          );

        if (existingLandingPage) {
          throw new BadRequestError(
            'A landing page with this slug already exists.',
          );
        }

        landingPage.slug = input.slug;
      }
    }

    if (input.description !== undefined) {
      landingPage.description = input.description?.trim();
    }

    if (input.template !== undefined) {
      landingPage.template = input.template;
    }

    if (input.content !== undefined) {
      landingPage.content = input.content;
    }

    if (input.formId !== undefined) {
      landingPage.formId = input.formId ?? undefined;
    }

    await this.landingPagesRepository.save(landingPage);

    return {
      landingPage: landingPageToDTO(landingPage),
    };
  }
}
