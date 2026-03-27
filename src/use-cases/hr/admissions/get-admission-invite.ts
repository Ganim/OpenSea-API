import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  AdmissionInviteRecord,
  AdmissionsRepository,
} from '@/repositories/hr/admissions-repository';

export interface GetAdmissionInviteRequest {
  tenantId: string;
  inviteId: string;
}

export interface GetAdmissionInviteResponse {
  invite: AdmissionInviteRecord;
}

export class GetAdmissionInviteUseCase {
  constructor(private admissionsRepository: AdmissionsRepository) {}

  async execute(
    request: GetAdmissionInviteRequest,
  ): Promise<GetAdmissionInviteResponse> {
    const { tenantId, inviteId } = request;

    const invite = await this.admissionsRepository.findById(inviteId, tenantId);

    if (!invite) {
      throw new ResourceNotFoundError('Admission invite not found');
    }

    return { invite };
  }
}
