import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  AdmissionInviteRecord,
  AdmissionsRepository,
} from '@/repositories/hr/admissions-repository';

export interface UpdateAdmissionInviteRequest {
  tenantId: string;
  inviteId: string;
  email?: string | null;
  phone?: string | null;
  fullName?: string;
  positionId?: string | null;
  departmentId?: string | null;
  companyId?: string | null;
  expectedStartDate?: Date | null;
  salary?: number | null;
  contractType?: string | null;
  workRegime?: string | null;
  expiresAt?: Date | null;
}

export interface UpdateAdmissionInviteResponse {
  invite: AdmissionInviteRecord;
}

export class UpdateAdmissionInviteUseCase {
  constructor(private admissionsRepository: AdmissionsRepository) {}

  async execute(
    request: UpdateAdmissionInviteRequest,
  ): Promise<UpdateAdmissionInviteResponse> {
    const { tenantId, inviteId, ...updateFields } = request;

    const existingInvite = await this.admissionsRepository.findById(
      inviteId,
      tenantId,
    );

    if (!existingInvite) {
      throw new ResourceNotFoundError('Admission invite not found');
    }

    if (
      existingInvite.status !== 'PENDING' &&
      existingInvite.status !== 'IN_PROGRESS'
    ) {
      throw new BadRequestError(
        'Only PENDING or IN_PROGRESS invites can be edited',
      );
    }

    const updatedInvite = await this.admissionsRepository.update({
      id: inviteId,
      ...updateFields,
    });

    if (!updatedInvite) {
      throw new ResourceNotFoundError('Failed to update admission invite');
    }

    return { invite: updatedInvite };
  }
}
