import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

interface SetUserSecurityKeyUseCaseRequest {
  tenantId: string;
  userId: string;
  securityKey: string | null; // null to remove the key
}

export class SetUserSecurityKeyUseCase {
  async execute(request: SetUserSecurityKeyUseCaseRequest): Promise<void> {
    const { tenantId, userId, securityKey } = request;

    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        tenantId,
        userId,
        deletedAt: null,
      },
    });

    if (!tenantUser) {
      throw new ResourceNotFoundError('Usuário não encontrado neste tenant');
    }

    const securityKeyHash = securityKey ? await hash(securityKey, 10) : null;

    await prisma.tenantUser.update({
      where: { id: tenantUser.id },
      data: { securityKeyHash },
    });
  }
}
