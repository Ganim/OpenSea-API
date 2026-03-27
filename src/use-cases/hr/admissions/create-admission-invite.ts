import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type {
  AdmissionInviteRecord,
  AdmissionsRepository,
} from '@/repositories/hr/admissions-repository';

export interface CreateAdmissionInviteRequest {
  tenantId: string;
  email?: string;
  phone?: string;
  fullName: string;
  positionId?: string;
  departmentId?: string;
  companyId?: string;
  expectedStartDate?: Date;
  salary?: number;
  contractType?: string;
  workRegime?: string;
  expiresInDays?: number;
  createdBy?: string;
}

export interface CreateAdmissionInviteResponse {
  invite: AdmissionInviteRecord;
}

export class CreateAdmissionInviteUseCase {
  constructor(private admissionsRepository: AdmissionsRepository) {}

  async execute(
    request: CreateAdmissionInviteRequest,
  ): Promise<CreateAdmissionInviteResponse> {
    const {
      tenantId,
      email,
      phone,
      fullName,
      positionId,
      departmentId,
      companyId,
      expectedStartDate,
      salary,
      contractType,
      workRegime,
      expiresInDays = 7,
      createdBy,
    } = request;

    if (!fullName || fullName.trim().length < 2) {
      throw new BadRequestError('Full name must have at least 2 characters');
    }

    if (!email && !phone) {
      throw new BadRequestError(
        'At least one contact method (email or phone) is required',
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invite = await this.admissionsRepository.create({
      tenantId,
      email,
      phone,
      fullName: fullName.trim(),
      positionId,
      departmentId,
      companyId,
      expectedStartDate,
      salary,
      contractType,
      workRegime,
      expiresAt,
      createdBy,
    });

    return { invite };
  }
}
