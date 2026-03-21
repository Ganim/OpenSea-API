import type { PosSession } from '@/entities/sales/pos-session';
import type { PosSessionsRepository } from '@/repositories/sales/pos-sessions-repository';

interface GetActivePosSessionUseCaseRequest {
  tenantId: string;
  terminalId: string;
}

interface GetActivePosSessionUseCaseResponse {
  session: PosSession | null;
}

export class GetActivePosSessionUseCase {
  constructor(private posSessionsRepository: PosSessionsRepository) {}

  async execute(
    request: GetActivePosSessionUseCaseRequest,
  ): Promise<GetActivePosSessionUseCaseResponse> {
    const session = await this.posSessionsRepository.findActiveByTerminal(
      request.terminalId,
      request.tenantId,
    );

    return { session };
  }
}
