import type { VariantAttachmentRecord } from '@/repositories/stock/variant-attachments-repository';
import { VariantAttachmentsRepository } from '@/repositories/stock/variant-attachments-repository';

interface ListVariantAttachmentsUseCaseRequest {
  variantId: string;
  tenantId: string;
}

interface ListVariantAttachmentsUseCaseResponse {
  variantAttachments: VariantAttachmentRecord[];
}

export class ListVariantAttachmentsUseCase {
  constructor(
    private variantAttachmentsRepository: VariantAttachmentsRepository,
  ) {}

  async execute(
    request: ListVariantAttachmentsUseCaseRequest,
  ): Promise<ListVariantAttachmentsUseCaseResponse> {
    const { variantId } = request;

    const variantAttachments =
      await this.variantAttachmentsRepository.findByVariantId(variantId);

    return { variantAttachments };
  }
}
