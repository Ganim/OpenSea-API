/**
 * eSocial Auto-Generation Service
 *
 * Generates eSocial events automatically after HR actions.
 * Non-blocking — failures are logged but don't affect the HR operation.
 */

import { prisma } from '@/lib/prisma';
import { makeGenerateEventUseCase } from '@/use-cases/esocial/events/factories/make-generate-event-use-case';

interface AutoGenerateOptions {
  tenantId: string;
  eventType: string;
  referenceType: string;
  referenceId: string;
  additionalData?: Record<string, unknown>;
}

/**
 * Check if tenant has eSocial configured with autoGenerate enabled.
 * Returns false if no config found or autoGenerate is disabled.
 */
async function isAutoGenerateEnabled(tenantId: string): Promise<boolean> {
  const config = await prisma.esocialConfig.findUnique({
    where: { tenantId },
    select: { autoGenerate: true },
  });

  return config?.autoGenerate === true;
}

/**
 * Try to auto-generate an eSocial event.
 * This is fire-and-forget — errors are logged but never thrown.
 */
export async function tryAutoGenerateEvent(
  options: AutoGenerateOptions,
): Promise<void> {
  try {
    const enabled = await isAutoGenerateEnabled(options.tenantId);
    if (!enabled) return;

    const useCase = makeGenerateEventUseCase();
    await useCase.execute({
      tenantId: options.tenantId,
      eventType: options.eventType,
      referenceType: options.referenceType,
      referenceId: options.referenceId,
      additionalData: options.additionalData,
    });

    console.log(
      `[eSocial Auto] Generated ${options.eventType} for ${options.referenceType}:${options.referenceId}`,
    );
  } catch (err) {
    // Non-blocking — log and continue
    console.warn(
      `[eSocial Auto] Failed to generate ${options.eventType} for ${options.referenceType}:${options.referenceId}:`,
      err instanceof Error ? err.message : err,
    );
  }
}
