import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type {
  AdmissionInviteRecord,
  AdmissionsRepository,
} from '@/repositories/hr/admissions-repository';

const VALID_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'EXPIRED',
  'CANCELLED',
];

export interface ListAdmissionInvitesRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
  status?: string;
  search?: string;
}

export interface ListAdmissionInvitesResponse {
  invites: AdmissionInviteRecord[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export class ListAdmissionInvitesUseCase {
  constructor(private admissionsRepository: AdmissionsRepository) {}

  async execute(
    request: ListAdmissionInvitesRequest,
  ): Promise<ListAdmissionInvitesResponse> {
    const { tenantId, page = 1, perPage = 20, status, search } = request;

    if (status && !VALID_STATUSES.includes(status.toUpperCase())) {
      throw new BadRequestError(`Invalid status: ${status}`);
    }

    const skip = (page - 1) * perPage;

    const { invites, total } = await this.admissionsRepository.findMany(
      tenantId,
      { status: status?.toUpperCase(), search },
      skip,
      perPage,
    );

    const totalPages = Math.ceil(total / perPage);

    return {
      invites,
      meta: {
        total,
        page,
        perPage,
        totalPages,
      },
    };
  }
}
