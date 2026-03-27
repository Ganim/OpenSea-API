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

export class ValidatePortalTokenUseCase {
  constructor(
    private customerPortalAccessesRepository: CustomerPortalAccessesRepository,
  ) {}

  async execute(
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
