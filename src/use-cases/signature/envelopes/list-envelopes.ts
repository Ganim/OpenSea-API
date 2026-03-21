import type { SignatureEnvelope } from '@/entities/signature/signature-envelope';
import type { SignatureEnvelopesRepository } from '@/repositories/signature/signature-envelopes-repository';

interface ListEnvelopesUseCaseRequest {
  tenantId: string;
  status?: string;
  sourceModule?: string;
  createdByUserId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface ListEnvelopesUseCaseResponse {
  envelopes: SignatureEnvelope[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export class ListEnvelopesUseCase {
  constructor(
    private envelopesRepository: SignatureEnvelopesRepository,
  ) {}

  async execute(
    request: ListEnvelopesUseCaseRequest,
  ): Promise<ListEnvelopesUseCaseResponse> {
    const page = request.page ?? 1;
    const limit = Math.min(request.limit ?? 20, 100);

    const { envelopes, total } = await this.envelopesRepository.findMany({
      tenantId: request.tenantId,
      status: request.status,
      sourceModule: request.sourceModule,
      createdByUserId: request.createdByUserId,
      search: request.search,
      page,
      limit,
    });

    return {
      envelopes,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }
}
