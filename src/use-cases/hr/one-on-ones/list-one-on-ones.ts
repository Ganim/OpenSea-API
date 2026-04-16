import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  OneOnOneMeeting,
  OneOnOneStatus,
} from '@/entities/hr/one-on-one-meeting';
import type {
  FindOneOnOneMeetingFilters,
  OneOnOneMeetingsRepository,
} from '@/repositories/hr/one-on-one-meetings-repository';

export type OneOnOneRoleFilter = 'MANAGER' | 'REPORT' | 'ANY';

export interface ListOneOnOnesRequest {
  tenantId: string;
  participantEmployeeId: string;
  page?: number;
  perPage?: number;
  status?: OneOnOneStatus;
  from?: Date;
  to?: Date;
  role?: OneOnOneRoleFilter;
}

export interface ListOneOnOnesResponse {
  meetings: OneOnOneMeeting[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export class ListOneOnOnesUseCase {
  constructor(private oneOnOneMeetingsRepository: OneOnOneMeetingsRepository) {}

  async execute(request: ListOneOnOnesRequest): Promise<ListOneOnOnesResponse> {
    const {
      tenantId,
      participantEmployeeId,
      page = 1,
      perPage = 20,
      status,
      from,
      to,
      role = 'ANY',
    } = request;

    const skip = (page - 1) * perPage;
    const participantId = new UniqueEntityID(participantEmployeeId);

    const filters: FindOneOnOneMeetingFilters = {
      status,
      from,
      to,
    };

    if (role === 'MANAGER') {
      filters.managerId = participantId;
    } else if (role === 'REPORT') {
      filters.reportId = participantId;
    } else {
      filters.participantId = participantId;
    }

    const { meetings, total } =
      await this.oneOnOneMeetingsRepository.findManyPaginated(
        tenantId,
        filters,
        skip,
        perPage,
      );

    const totalPages = Math.max(1, Math.ceil(total / perPage));

    return {
      meetings,
      meta: { total, page, perPage, totalPages },
    };
  }
}
