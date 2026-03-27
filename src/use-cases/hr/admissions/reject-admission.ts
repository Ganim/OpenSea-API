import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  AdmissionInviteRecord,
  AdmissionsRepository,
} from '@/repositories/hr/admissions-repository';

export interface RejectAdmissionRequest {
  tenantId: string;
  inviteId: string;
  reason?: string;
}

export interface RejectAdmissionResponse {
  invite: AdmissionInviteRecord;
}

export class RejectAdmissionUseCase {
  constructor(private admissionsRepository: AdmissionsRepository) {}

  async execute(
    request: RejectAdmissionRequest,
  ): Promise<RejectAdmissionResponse> {
    const { tenantId, inviteId } = request;

    const existingInvite = await this.admissionsRepository.findById(
      inviteId,
      tenantId,
    );

    if (!existingInvite) {
      throw new ResourceNotFoundError('Admission invite not found');
    }

    if (existingInvite.status === 'COMPLETED') {
      throw new BadRequestError('Cannot reject a completed admission');
    }

    if (existingInvite.status === 'CANCELLED') {
      throw new BadRequestError('Cannot reject a cancelled admission');
    }

    const updatedInvite = await this.admissionsRepository.update({
      id: inviteId,
      status: 'CANCELLED',
      candidateData: existingInvite.candidateData
        ? {
            ...existingInvite.candidateData,
            rejectionReason: request.reason,
          }
        : { rejectionReason: request.reason },
    });

    if (!updatedInvite) {
      throw new ResourceNotFoundError('Failed to reject admission');
    }

    return { invite: updatedInvite };
  }
}
