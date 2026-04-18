import { fileURLToPath } from 'node:url';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { PrismaSignatureEnvelopesRepository } from '@/repositories/signature/prisma/prisma-signature-envelopes-repository';
import { PrismaSignatureEnvelopeSignersRepository } from '@/repositories/signature/prisma/prisma-signature-envelope-signers-repository';
import { PrismaSignatureAuditEventsRepository } from '@/repositories/signature/prisma/prisma-signature-audit-events-repository';
import type { SignatureEnvelopesRepository } from '@/repositories/signature/signature-envelopes-repository';
import type { SignatureEnvelopeSignersRepository } from '@/repositories/signature/signature-envelope-signers-repository';
import type { SignatureAuditEventsRepository } from '@/repositories/signature/signature-audit-events-repository';

/**
 * Signature P4 — Auto-expire past-due envelopes.
 *
 * Runs daily at 02:00 BRT. Sweeps every envelope whose status is still
 * actionable (PENDING / IN_PROGRESS) and whose `expiresAt` is in the past
 * relative to the reference date. For each one:
 *
 *   - envelope.status → EXPIRED
 *   - envelope.cancelledAt → NOW (schema has no dedicated expiredAt column;
 *     cancelledAt is reused as the "terminal timestamp" per plan approval)
 *   - every non-terminal signer (status NOT IN SIGNED/REJECTED/EXPIRED) is
 *     flipped to EXPIRED so the downstream UI reflects reality
 *   - a SignatureAuditEvent of type EXPIRED is recorded per envelope
 *
 * Idempotent: envelopes already in EXPIRED / CANCELLED / COMPLETED / REJECTED
 * status are filtered out by the repository query, so re-runs are safe.
 *
 * No email is sent on expiration — that's deliberate per the Phase 4 plan.
 * Operators wanting outbound notice can run the reminder cron which already
 * catches envelopes approaching expiration.
 */

const LOG_PREFIX = '[expire-envelopes]';

export interface ExpireEnvelopesResult {
  expiredCount: number;
  details: Array<{ envelopeId: string; tenantId: string }>;
}

export interface ExpireEnvelopesDependencies {
  envelopesRepository: SignatureEnvelopesRepository;
  signersRepository: SignatureEnvelopeSignersRepository;
  auditEventsRepository: SignatureAuditEventsRepository;
}

export interface ExpireEnvelopesOptions {
  referenceDate?: Date;
  dependencies?: ExpireEnvelopesDependencies;
}

/**
 * Single-shot execution. Callers (scheduler, standalone script, tests)
 * invoke this and log the returned summary. Errors propagate so
 * observability (BullMQ, Fly alerts) can surface a failing cron.
 */
export async function expireSignatureEnvelopes(
  options: ExpireEnvelopesOptions = {},
): Promise<ExpireEnvelopesResult> {
  const referenceDate = options.referenceDate ?? new Date();
  const { envelopesRepository, signersRepository, auditEventsRepository } =
    options.dependencies ?? {
      envelopesRepository: new PrismaSignatureEnvelopesRepository(),
      signersRepository: new PrismaSignatureEnvelopeSignersRepository(),
      auditEventsRepository: new PrismaSignatureAuditEventsRepository(),
    };

  logger.info({ referenceDate }, `${LOG_PREFIX} starting`);

  const expiredEnvelopes =
    await envelopesRepository.findExpiredActive(referenceDate);

  const details: ExpireEnvelopesResult['details'] = [];

  for (const envelope of expiredEnvelopes) {
    const envelopeId = envelope.envelopeId.toString();
    const tenantId = envelope.tenantId.toString();

    try {
      await envelopesRepository.update({
        id: envelopeId,
        status: 'EXPIRED',
        cancelledAt: referenceDate,
        cancelReason: 'Auto-expired: envelope passed expiration date',
      });

      const signers = await signersRepository.findByEnvelopeId(envelopeId);
      for (const signer of signers) {
        const isTerminal = ['SIGNED', 'REJECTED', 'EXPIRED'].includes(
          signer.status,
        );
        if (isTerminal) continue;

        await signersRepository.update({
          id: signer.signerId.toString(),
          status: 'EXPIRED',
        });
      }

      await auditEventsRepository.create({
        envelopeId,
        tenantId,
        type: 'EXPIRED',
        description: `Envelope auto-expired at ${referenceDate.toISOString()} (passed expiresAt=${envelope.expiresAt?.toISOString() ?? 'unknown'})`,
      });

      details.push({ envelopeId, tenantId });
    } catch (error) {
      logger.error(
        { err: error, envelopeId, tenantId },
        `${LOG_PREFIX} failed to expire envelope`,
      );
      // Continue with remaining envelopes so one bad record doesn't block
      // the whole sweep. Operators see the error in logs + monitoring.
    }
  }

  const result: ExpireEnvelopesResult = {
    expiredCount: details.length,
    details,
  };

  logger.info(result, `${LOG_PREFIX} finished`);
  return result;
}

// Standalone script entrypoint. Executed by external schedulers (Fly.io
// machines, k8s CronJob) via `npx tsx src/jobs/signature/expire-envelopes.ts`
// and gated by the STANDALONE_CRON env var so that tsup-bundled builds
// (where every module shares `import.meta.url` with server.js) do not
// accidentally auto-run this script during API boot.
const isDirectRun =
  process.env.STANDALONE_CRON === 'true' &&
  typeof process.argv[1] === 'string' &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  expireSignatureEnvelopes()
    .then((result) => {
      console.log(JSON.stringify(result));
      return prisma.$disconnect();
    })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      void prisma.$disconnect().finally(() => process.exit(1));
    });
}
