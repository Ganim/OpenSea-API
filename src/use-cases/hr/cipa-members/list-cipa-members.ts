import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CipaMember } from '@/entities/hr/cipa-member';
import { CipaMembersRepository } from '@/repositories/hr/cipa-members-repository';

export interface ListCipaMembersRequest {
  tenantId: string;
  mandateId?: string;
  page?: number;
  perPage?: number;
}

export interface ListCipaMembersResponse {
  cipaMembers: CipaMember[];
}

export class ListCipaMembersUseCase {
  constructor(private cipaMembersRepository: CipaMembersRepository) {}

  async execute(
    request: ListCipaMembersRequest,
  ): Promise<ListCipaMembersResponse> {
    const { tenantId, mandateId, page, perPage } = request;

    const cipaMembers = await this.cipaMembersRepository.findMany(tenantId, {
      mandateId: mandateId ? new UniqueEntityID(mandateId) : undefined,
      page,
      perPage,
    });

    return { cipaMembers };
  }
}
