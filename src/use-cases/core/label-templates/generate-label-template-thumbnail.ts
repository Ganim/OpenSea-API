import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { LabelTemplatesRepository } from '@/repositories/core/label-templates-repository';

interface GenerateLabelTemplateThumbnailUseCaseRequest {
  id: string;
  tenantId: string;
}

interface GenerateLabelTemplateThumbnailUseCaseResponse {
  thumbnailUrl: string;
}

export class GenerateLabelTemplateThumbnailUseCase {
  constructor(private labelTemplatesRepository: LabelTemplatesRepository) {}

  async execute(
    request: GenerateLabelTemplateThumbnailUseCaseRequest,
  ): Promise<GenerateLabelTemplateThumbnailUseCaseResponse> {
    const { id, tenantId } = request;

    const templateId = new UniqueEntityID(id);
    const template = await this.labelTemplatesRepository.findById(
      new UniqueEntityID(tenantId),
      templateId,
    );

    if (!template) {
      throw new ResourceNotFoundError('Label template not found');
    }

    // TODO: Implement actual thumbnail generation using puppeteer/playwright
    // For now, we'll generate a placeholder URL
    // The actual implementation would:
    // 1. Render compiledHtml + compiledCss in a headless browser
    // 2. Capture screenshot
    // 3. Upload to storage (S3, GCS, etc.)
    // 4. Update thumbnailUrl in the template
    // 5. Return the URL

    const thumbnailUrl = `https://storage.example.com/thumbnails/${template.id.toString()}.png`;

    template.thumbnailUrl = thumbnailUrl;
    await this.labelTemplatesRepository.save(template);

    return {
      thumbnailUrl,
    };
  }
}
