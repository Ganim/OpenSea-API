import type { SafetyProgram } from '@/entities/hr/safety-program';
import { SafetyProgramsRepository } from '@/repositories/hr/safety-programs-repository';

export interface ListSafetyProgramsRequest {
  tenantId: string;
  type?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

export interface ListSafetyProgramsResponse {
  safetyPrograms: SafetyProgram[];
}

export class ListSafetyProgramsUseCase {
  constructor(private safetyProgramsRepository: SafetyProgramsRepository) {}

  async execute(
    request: ListSafetyProgramsRequest,
  ): Promise<ListSafetyProgramsResponse> {
    const { tenantId, type, status, page, perPage } = request;

    const safetyPrograms = await this.safetyProgramsRepository.findMany(
      tenantId,
      { type, status, page, perPage },
    );

    return { safetyPrograms };
  }
}
