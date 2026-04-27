/**
 * Factory: VerifyRegistrationUseCase — Plan 10-07.
 * Wires PrismaWebAuthnCredentialsRepository + inline Prisma audit repo.
 */
import { prisma } from '@/lib/prisma';
import { PrismaWebAuthnCredentialsRepository } from '@/repositories/prisma/prisma-webauthn-credentials.repo';
import { VerifyRegistrationUseCase } from '../verify-registration';

export function makeVerifyRegistrationUseCase(): VerifyRegistrationUseCase {
  const webauthnRepo = new PrismaWebAuthnCredentialsRepository();

  const auditLogsRepo = {
    log: async (entry: {
      tenantId: string;
      action: string;
      entity: string;
      entityId: string;
      module: string;
      newData: Record<string, unknown>;
    }) => {
      const log = await prisma.auditLog.create({
        data: {
          tenantId: entry.tenantId,
          action: entry.action as never,
          entity: entry.entity as never,
          module: entry.module as never,
          entityId: entry.entityId,
          newData: entry.newData,
          description: `WebAuthn credential enrolled: credentialId=${String(entry.newData.credentialId)}`,
        },
      });
      return { id: log.id };
    },
  };

  return new VerifyRegistrationUseCase(webauthnRepo, auditLogsRepo);
}
