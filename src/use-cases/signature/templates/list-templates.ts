import type { SignatureTemplate } from '@/entities/signature/signature-template';
import type { SignatureTemplatesRepository } from '@/repositories/signature/signature-templates-repository';

interface ListSignatureTemplatesUseCaseRequest {
  tenantId: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

interface ListSignatureTemplatesUseCaseResponse {
  templates: SignatureTemplate[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export class ListSignatureTemplatesUseCase {
  constructor(private templatesRepository: SignatureTemplatesRepository) {}

  async execute(
    request: ListSignatureTemplatesUseCaseRequest,
  ): Promise<ListSignatureTemplatesUseCaseResponse> {
    const page = request.page ?? 1;
    const limit = Math.min(request.limit ?? 20, 100);

    const { templates, total } = await this.templatesRepository.findMany({
      tenantId: request.tenantId,
      isActive: request.isActive,
      search: request.search,
      page,
      limit,
    });

    return {
      templates,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }
}
