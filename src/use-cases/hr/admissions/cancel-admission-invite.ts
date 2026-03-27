import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  AdmissionInviteRecord,
  AdmissionsRepository,
} from '@/repositories/hr/admissions-repository';

export interface CancelAdmissionInviteRequest {
  tenantId: string;
  inviteId: string;
}

export interface CancelAdmissionInviteResponse {
  invite: AdmissionInviteRecord;
}

export class CancelAdmissionInviteUseCase {
  constructor(private admissionsRepository: AdmissionsRepository) {}

  async execute(
    request: CancelAdmissionInviteRequest,
  ): Promise<CancelAdmissionInviteResponse> {
    const { tenantId, inviteId } = request;

    const existingInvite = await this.admissionsRepository.findById(
      inviteId,
      tenantId,
    );

    if (!existingInvite) {
      throw new ResourceNotFoundError('Admission invite not found');
    }

    if (existingInvite.status === 'COMPLETED') {
      throw new BadRequestError('Cannot cancel a completed admission');
    }

    if (existingInvite.status === 'CANCELLED') {
      throw new BadRequestError('Admission is already cancelled');
    }

    const updatedInvite = await this.admissionsRepository.update({
      id: inviteId,
      status: 'CANCELLED',
    });

    if (!updatedInvite) {
      throw new ResourceNotFoundError('Failed to cancel admission invite');
    }

    return { invite: updatedInvite };
  }
}
