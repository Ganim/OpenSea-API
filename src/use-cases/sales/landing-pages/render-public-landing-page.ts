import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { LandingPagesRepository } from '@/repositories/sales/landing-pages-repository';
import type { FormFieldsRepository } from '@/repositories/sales/form-fields-repository';

interface RenderPublicLandingPageUseCaseRequest {
  tenantSlug: string;
  pageSlug: string;
}

interface FormFieldView {
  label: string;
  type: string;
  options: Record<string, unknown> | null;
  isRequired: boolean;
  order: number;
}

interface RenderPublicLandingPageUseCaseResponse {
  title: string;
  description?: string;
  template: string;
  content: Record<string, unknown>;
  formFields?: FormFieldView[];
}

export class RenderPublicLandingPageUseCase {
  constructor(
    private landingPagesRepository: LandingPagesRepository,
    private formFieldsRepository: FormFieldsRepository,
  ) {}

  async execute(
    input: RenderPublicLandingPageUseCaseRequest,
  ): Promise<RenderPublicLandingPageUseCaseResponse> {
    const landingPage =
      await this.landingPagesRepository.findByTenantSlugAndPageSlug(
        input.tenantSlug,
        input.pageSlug,
      );

    if (!landingPage) {
      throw new ResourceNotFoundError('Landing page not found.');
    }

    // Increment view count (fire-and-forget)
    landingPage.incrementViewCount();
    this.landingPagesRepository.save(landingPage).catch(() => {
      // Silently ignore view count update failures
    });

    let formFields: FormFieldView[] | undefined;

    if (landingPage.formId) {
      const fields = await this.formFieldsRepository.findByFormId(
        new UniqueEntityID(landingPage.formId),
      );

      formFields = fields
        .sort((a, b) => a.order - b.order)
        .map((field) => ({
          label: field.label,
          type: field.type,
          options: field.options ?? null,
          isRequired: field.isRequired,
          order: field.order,
        }));
    }

    return {
      title: landingPage.title,
      description: landingPage.description,
      template: landingPage.template,
      content: landingPage.content,
      formFields,
    };
  }
}
