import type { DigitalCertificate } from '@/entities/signature/digital-certificate';
import type { DigitalCertificatesRepository } from '@/repositories/signature/digital-certificates-repository';

interface ListCertificatesUseCaseRequest {
  tenantId: string;
  status?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface ListCertificatesUseCaseResponse {
  certificates: DigitalCertificate[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export class ListCertificatesUseCase {
  constructor(
    private digitalCertificatesRepository: DigitalCertificatesRepository,
  ) {}

  async execute(
    request: ListCertificatesUseCaseRequest,
  ): Promise<ListCertificatesUseCaseResponse> {
    const page = request.page ?? 1;
    const limit = Math.min(request.limit ?? 20, 100);

    const { certificates, total } =
      await this.digitalCertificatesRepository.findMany({
        tenantId: request.tenantId,
        status: request.status,
        type: request.type,
        search: request.search,
        page,
        limit,
      });

    return {
      certificates,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }
}
