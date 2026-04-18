import { fileURLToPath } from 'node:url';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { PrismaSignatureEnvelopesRepository } from '@/repositories/signature/prisma/prisma-signature-envelopes-repository';
import { PrismaSignatureEnvelopeSignersRepository } from '@/repositories/signature/prisma/prisma-signature-envelope-signers-repository';
import { PrismaSignatureAuditEventsRepository } from '@/repositories/signature/prisma/prisma-signature-audit-events-repository';
import type { SignatureEnvelopesRepository } from '@/repositories/signature/signature-envelopes-repository';
import type { SignatureEnvelopeSignersRepository } from '@/repositories/signature/signature-envelope-signers-repository';
import type { SignatureAuditEventsRepository } from '@/repositories/signature/signature-audit-events-repository';
import { SignatureEmailService } from '@/services/signature/signature-email-service';
import { ResendNotificationsUseCase } from '@/use-cases/signature/envelopes/resend-notifications';

/**
 * Signature P4 — Daily reminder cron for pending signers.
 *
 * Runs daily at 09:00 BRT. Scans active envelopes (IN_PROGRESS + not yet
 * expired) and, for each one, checks whether at least one pending signer is
 * due for another nudge:
 *
 *   - signer has an external email (userId IS NULL, externalEmail set)
 *   - signer status is NOT one of SIGNED / REJECTED / EXPIRED
 *   - EITHER lastNotifiedAt IS NULL (never notified)
 *     OR (referenceDate - lastNotifiedAt) ≥ envelope.reminderDays days
 *
 * Envelopes that have at least one qualifying signer are handed off to the
 * existing ResendNotificationsUseCase, which already handles per-signer
 * email delivery, notification counter bumps, and audit trail entries.
 * That keeps the cron thin and reuses the battle-tested code path.
 */

const LOG_PREFIX = '[remind-pending-signers]';
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TERMINAL_SIGNER_STATUSES = ['SIGNED', 'REJECTED', 'EXPIRED'] as const;

export interface RemindPendingSignersResult {
  remindedEnvelopes: number;
  totalSigners: number;
  details: Array<{
    envelopeId: string;
    tenantId: string;
    signersNotified: number;
  }>;
}

export interface RemindPendingSignersDependencies {
  envelopesRepository: SignatureEnvelopesRepository;
  signersRepository: SignatureEnvelopeSignersRepository;
  auditEventsRepository: SignatureAuditEventsRepository;
  resendNotificationsUseCase: ResendNotificationsUseCase;
}

export interface RemindPendingSignersOptions {
  referenceDate?: Date;
  dependencies?: RemindPendingSignersDependencies;
}

/**
 * Single-shot execution. Returns a summary the scheduler logs, and rethrows
 * on fatal errors so monitoring can catch broken runs.
 */
export async function remindPendingSigners(
  options: RemindPendingSignersOptions = {},
): Promise<RemindPendingSignersResult> {
  const referenceDate = options.referenceDate ?? new Date();
  const dependencies = options.dependencies ?? buildDefaultDependencies();

  const { envelopesRepository, signersRepository, resendNotificationsUseCase } =
    dependencies;

  logger.info({ referenceDate }, `${LOG_PREFIX} starting`);

  const candidateEnvelopes =
    await envelopesRepository.findRemindableInProgress(referenceDate);

  const details: RemindPendingSignersResult['details'] = [];
  let totalSigners = 0;

  for (const envelope of candidateEnvelopes) {
    const envelopeId = envelope.envelopeId.toString();
    const tenantId = envelope.tenantId.toString();

    try {
      const signers = await signersRepository.findByEnvelopeId(envelopeId);

      const qualifyingSigners = signers.filter((signer) =>
        isSignerDueForReminder(signer, envelope.reminderDays, referenceDate),
      );

      if (qualifyingSigners.length === 0) continue;

      const useCaseResponse = await resendNotificationsUseCase.execute({
        tenantId,
        envelopeId,
      });

      // ResendNotificationsUseCase nudges every non-terminal signer on the
      // envelope. Our qualifying count is the more precise "due per cadence"
      // figure we care about in the cron summary; the use case's
      // notifiedCount is also recorded for observability.
      details.push({
        envelopeId,
        tenantId,
        signersNotified: useCaseResponse.notifiedCount,
      });
      totalSigners += useCaseResponse.notifiedCount;
    } catch (error) {
      logger.error(
        { err: error, envelopeId, tenantId },
        `${LOG_PREFIX} failed to remind signers`,
      );
      // Keep going — one broken envelope shouldn't take down the whole run.
    }
  }

  const result: RemindPendingSignersResult = {
    remindedEnvelopes: details.length,
    totalSigners,
    details,
  };

  logger.info(result, `${LOG_PREFIX} finished`);
  return result;
}

function buildDefaultDependencies(): RemindPendingSignersDependencies {
  const envelopesRepository = new PrismaSignatureEnvelopesRepository();
  const signersRepository = new PrismaSignatureEnvelopeSignersRepository();
  const auditEventsRepository = new PrismaSignatureAuditEventsRepository();
  const resendNotificationsUseCase = new ResendNotificationsUseCase(
    envelopesRepository,
    signersRepository,
    auditEventsRepository,
    new SignatureEmailService(),
  );

  return {
    envelopesRepository,
    signersRepository,
    auditEventsRepository,
    resendNotificationsUseCase,
  };
}

interface ReminderCandidateSigner {
  status: string;
  externalEmail: string | null;
  lastNotifiedAt: Date | null;
}

/**
 * Returns true when a signer still needs to sign AND enough time has passed
 * since the last notification (or they were never notified). `reminderDays`
 * comes from the envelope; defaults to 3 days when unset for safety.
 */
function isSignerDueForReminder(
  signer: ReminderCandidateSigner,
  reminderDays: number | null | undefined,
  referenceDate: Date,
): boolean {
  if (
    TERMINAL_SIGNER_STATUSES.includes(
      signer.status as (typeof TERMINAL_SIGNER_STATUSES)[number],
    )
  ) {
    return false;
  }

  if (!signer.externalEmail) return false;

  if (signer.lastNotifiedAt === null) return true;

  const effectiveCadenceDays = reminderDays ?? 3;
  const ageMs = referenceDate.getTime() - signer.lastNotifiedAt.getTime();
  return ageMs > effectiveCadenceDays * MS_PER_DAY;
}

// Standalone script entrypoint for external schedulers. Usage:
//   STANDALONE_CRON=true npx tsx src/jobs/signature/remind-pending-signers.ts
// Gated by STANDALONE_CRON because tsup bundles every job into server.js,
// where `import.meta.url === process.argv[1]` would otherwise trigger this
// block during API startup and kill the process with exit(0).
const isDirectRun =
  process.env.STANDALONE_CRON === 'true' &&
  typeof process.argv[1] === 'string' &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  remindPendingSigners()
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
