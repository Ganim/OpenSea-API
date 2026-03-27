import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  AdmissionInviteRecord,
  AdmissionsRepository,
} from '@/repositories/hr/admissions-repository';

export interface SubmitCandidateDataRequest {
  token: string;
  candidateData: Record<string, unknown>;
}

export interface SubmitCandidateDataResponse {
  invite: AdmissionInviteRecord;
}

export class SubmitCandidateDataUseCase {
  constructor(private admissionsRepository: AdmissionsRepository) {}

  async execute(
    request: SubmitCandidateDataRequest,
  ): Promise<SubmitCandidateDataResponse> {
    const { token, candidateData } = request;

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

    const updatedInvite = await this.admissionsRepository.update({
      id: invite.id,
      candidateData,
      status: 'IN_PROGRESS',
    });

    if (!updatedInvite) {
      throw new ResourceNotFoundError('Failed to submit candidate data');
    }

    return { invite: updatedInvite };
  }
}
