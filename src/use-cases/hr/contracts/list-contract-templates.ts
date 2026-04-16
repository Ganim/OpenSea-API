import type {
  ContractTemplate,
  ContractTemplateTypeValue,
} from '@/entities/hr/contract-template';
import type { ContractTemplatesRepository } from '@/repositories/hr/contract-templates-repository';

export interface ListContractTemplatesRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
  search?: string;
  type?: ContractTemplateTypeValue;
  isActive?: boolean;
}

export interface ListContractTemplatesResponse {
  templates: ContractTemplate[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export class ListContractTemplatesUseCase {
  constructor(
    private contractTemplatesRepository: ContractTemplatesRepository,
  ) {}

  async execute(
    request: ListContractTemplatesRequest,
  ): Promise<ListContractTemplatesResponse> {
    const {
      tenantId,
      page = 1,
      perPage = 20,
      search,
      type,
      isActive,
    } = request;

    const { templates, total } =
      await this.contractTemplatesRepository.findMany({
        tenantId,
        page,
        perPage,
        search,
        type,
        isActive,
      });

    return {
      templates,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.max(1, Math.ceil(total / perPage)),
      },
    };
  }
}
