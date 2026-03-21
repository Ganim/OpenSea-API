import type { Contact } from '@/entities/sales/contact';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { ContactsRepository } from '@/repositories/sales/contacts-repository';

interface ListContactsUseCaseRequest {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  customerId?: string;
  lifecycleStage?: string;
  leadTemperature?: string;
  assignedToUserId?: string;
  sortBy?:
    | 'firstName'
    | 'lastName'
    | 'email'
    | 'leadScore'
    | 'createdAt'
    | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

interface ListContactsUseCaseResponse {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListContactsUseCase {
  constructor(private contactsRepository: ContactsRepository) {}

  async execute(
    request: ListContactsUseCaseRequest,
  ): Promise<ListContactsUseCaseResponse> {
    const result: PaginatedResult<Contact> =
      await this.contactsRepository.findManyPaginated({
        tenantId: request.tenantId,
        page: request.page,
        limit: request.limit,
        search: request.search,
        customerId: request.customerId,
        lifecycleStage: request.lifecycleStage,
        leadTemperature: request.leadTemperature,
        assignedToUserId: request.assignedToUserId,
        sortBy: request.sortBy,
        sortOrder: request.sortOrder,
      });

    return {
      contacts: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
