import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CipaMember } from '@/entities/hr/cipa-member';
import { CipaMembersRepository } from '@/repositories/hr/cipa-members-repository';

export interface RemoveCipaMemberRequest {
  tenantId: string;
  memberId: string;
}

export interface RemoveCipaMemberResponse {
  cipaMember: CipaMember;
}

export class RemoveCipaMemberUseCase {
  constructor(private cipaMembersRepository: CipaMembersRepository) {}

  async execute(
    request: RemoveCipaMemberRequest,
  ): Promise<RemoveCipaMemberResponse> {
    const { tenantId, memberId } = request;

    const cipaMember = await this.cipaMembersRepository.findById(
      new UniqueEntityID(memberId),
      tenantId,
    );

    if (!cipaMember) {
      throw new ResourceNotFoundError('Membro CIPA não encontrado');
    }

    await this.cipaMembersRepository.delete(new UniqueEntityID(memberId));

    return { cipaMember };
  }
}
