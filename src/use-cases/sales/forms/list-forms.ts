import type { FormDTO } from '@/mappers/sales/form/form-to-dto';
import { formToDTO } from '@/mappers/sales/form/form-to-dto';
import type { FormsRepository } from '@/repositories/sales/forms-repository';

interface ListFormsUseCaseRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

interface ListFormsUseCaseResponse {
  forms: FormDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class ListFormsUseCase {
  constructor(private formsRepository: FormsRepository) {}

  async execute(
    input: ListFormsUseCaseRequest,
  ): Promise<ListFormsUseCaseResponse> {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;

    const [forms, total] = await Promise.all([
      this.formsRepository.findMany(page, perPage, input.tenantId, input.status),
      this.formsRepository.countByTenant(input.tenantId, input.status),
    ]);

    return {
      forms: forms.map((form) => formToDTO(form)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
