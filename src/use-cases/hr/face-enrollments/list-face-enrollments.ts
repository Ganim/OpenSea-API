import {
  type FaceEnrollmentDTO,
  faceEnrollmentToDto,
} from '@/mappers/hr/face-enrollment/to-dto';
import type { FaceEnrollmentsRepository } from '@/repositories/hr/face-enrollments-repository';

export interface ListFaceEnrollmentsRequest {
  tenantId: string;
  employeeId: string;
}

export interface ListFaceEnrollmentsResponse {
  items: FaceEnrollmentDTO[];
  count: number;
}

/**
 * Read-only listing of face enrollments for an employee, returning DTO
 * metadata only. Ciphertext, IV and authTag never leave the domain layer;
 * the mapper ensures the HTTP client sees only {id, photoCount, capturedAt,
 * capturedByUserId, createdAt}.
 */
export class ListFaceEnrollmentsUseCase {
  constructor(private readonly repo: FaceEnrollmentsRepository) {}

  async execute(
    input: ListFaceEnrollmentsRequest,
  ): Promise<ListFaceEnrollmentsResponse> {
    const items = await this.repo.findByEmployeeId(
      input.employeeId,
      input.tenantId,
    );
    return { items: items.map(faceEnrollmentToDto), count: items.length };
  }
}
