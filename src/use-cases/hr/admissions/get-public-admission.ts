import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  AdmissionInviteRecord,
  AdmissionsRepository,
} from '@/repositories/hr/admissions-repository';

export interface GetPublicAdmissionRequest {
  token: string;
}

export interface GetPublicAdmissionResponse {
  invite: AdmissionInviteRecord;
}

export class GetPublicAdmissionUseCase {
  constructor(private admissionsRepository: AdmissionsRepository) {}

  async execute(
    request: GetPublicAdmissionRequest,
  ): Promise<GetPublicAdmissionResponse> {
    const { token } = request;

    const invite = await this.admissionsRepository.findByToken(token);

    if (!invite) {
      throw new ResourceNotFoundError('Admission invite not found');
    }

    if (invite.status === 'CANCELLED') {
      throw new BadRequestError('This admission invite has been cancelled');
    }

    if (invite.status === 'COMPLETED') {
      throw new BadRequestError('This admission has already been completed');
    }

    if (invite.expiresAt && new Date() > invite.expiresAt) {
      throw new BadRequestError('This admission invite has expired');
    }

    return { invite };
  }
}
