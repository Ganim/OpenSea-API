import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import type {
  CustomerPortalAccessesRepository,
  CustomerPortalAccessRecord,
} from '@/repositories/finance/customer-portal-accesses-repository';

interface ValidatePortalTokenRequest {
  token: string;
}

interface ValidatePortalTokenResponse {
  access: CustomerPortalAccessRecord;
}

const MIN_RESPONSE_MS = 300;

export class ValidatePortalTokenUseCase {
  constructor(
    private customerPortalAccessesRepository: CustomerPortalAccessesRepository,
  ) {}

  async execute(
    request: ValidatePortalTokenRequest,
  ): Promise<ValidatePortalTokenResponse> {
    const startedAt = Date.now();

    try {
      return await this.run(request);
    } finally {
      const elapsed = Date.now() - startedAt;
      const remaining = MIN_RESPONSE_MS - elapsed;
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
    }
  }

  private async run(
    request: ValidatePortalTokenRequest,
  ): Promise<ValidatePortalTokenResponse> {
    const { token } = request;

    const access =
      await this.customerPortalAccessesRepository.findByToken(token);

    if (!access) {
      throw new UnauthorizedError('Token de acesso inválido.');
    }

    if (!access.isActive) {
      throw new UnauthorizedError('Acesso ao portal desativado.');
    }

    if (access.expiresAt && access.expiresAt < new Date()) {
      throw new UnauthorizedError('Token de acesso expirado.');
    }

    await this.customerPortalAccessesRepository.updateLastAccess(access.id);

    return { access };
  }
}
