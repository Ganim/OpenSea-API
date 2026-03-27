import { randomBytes } from 'node:crypto';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import type {
  CustomerPortalAccessesRepository,
  CustomerPortalAccessRecord,
} from '@/repositories/finance/customer-portal-accesses-repository';

interface InviteCustomerPortalRequest {
  tenantId: string;
  customerId: string;
  customerName: string;
  expiresInDays?: number;
}

interface InviteCustomerPortalResponse {
  access: CustomerPortalAccessRecord;
  portalUrl: string;
}

export class InviteCustomerPortalUseCase {
  constructor(
    private customerPortalAccessesRepository: CustomerPortalAccessesRepository,
  ) {}

  async execute(
    request: InviteCustomerPortalRequest,
  ): Promise<InviteCustomerPortalResponse> {
    const { tenantId, customerId, customerName, expiresInDays } = request;

    const existingAccess =
      await this.customerPortalAccessesRepository.findByCustomerId(
        tenantId,
        customerId,
      );

    if (existingAccess) {
      throw new ConflictError(
        'Este cliente já possui um acesso ativo ao portal.',
      );
    }

    const accessToken = `cpt_${randomBytes(32).toString('hex')}`;

    let expiresAt: Date | undefined;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const access = await this.customerPortalAccessesRepository.create({
      tenantId,
      customerId,
      customerName,
      accessToken,
      expiresAt,
    });

    const portalUrl = `/customer-portal/${accessToken}`;

    return { access, portalUrl };
  }
}
