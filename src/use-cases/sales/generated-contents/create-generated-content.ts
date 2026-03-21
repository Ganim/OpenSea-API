import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { GeneratedContent } from '@/entities/sales/generated-content';
import type { GeneratedContentsRepository } from '@/repositories/sales/generated-contents-repository';

const VALID_TYPES = [
  'SOCIAL_POST', 'SOCIAL_STORY', 'SOCIAL_REEL', 'FOLDER_PAGE',
  'EMAIL_CAMPAIGN', 'BANNER', 'PRODUCT_CARD', 'VIDEO', 'MOCKUP',
];

interface CreateGeneratedContentUseCaseRequest {
  tenantId: string;
  type: string;
  channel?: string;
  title?: string;
  caption?: string;
  hashtags?: string[];
  templateId?: string;
  brandId?: string;
  variantIds?: string[];
  catalogId?: string;
  campaignId?: string;
  aiGenerated?: boolean;
  aiPrompt?: string;
  aiModel?: string;
}

interface CreateGeneratedContentUseCaseResponse {
  content: GeneratedContent;
}

export class CreateGeneratedContentUseCase {
  constructor(
    private generatedContentsRepository: GeneratedContentsRepository,
  ) {}

  async execute(
    request: CreateGeneratedContentUseCaseRequest,
  ): Promise<CreateGeneratedContentUseCaseResponse> {
    if (!VALID_TYPES.includes(request.type)) {
      throw new BadRequestError(
        `Invalid content type. Must be one of: ${VALID_TYPES.join(', ')}`,
      );
    }

    const content = GeneratedContent.create({
      tenantId: new UniqueEntityID(request.tenantId),
      type: request.type,
      channel: request.channel,
      title: request.title,
      caption: request.caption,
      hashtags: request.hashtags,
      templateId: request.templateId,
      brandId: request.brandId,
      variantIds: request.variantIds,
      catalogId: request.catalogId,
      campaignId: request.campaignId,
      aiGenerated: request.aiGenerated,
      aiPrompt: request.aiPrompt,
      aiModel: request.aiModel,
    });

    await this.generatedContentsRepository.create(content);

    return { content };
  }
}
