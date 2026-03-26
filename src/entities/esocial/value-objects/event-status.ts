export enum EsocialEventStatus {
  DRAFT = 'DRAFT',
  VALIDATED = 'VALIDATED',
  REVIEWED = 'REVIEWED',
  APPROVED = 'APPROVED',
  QUEUED = 'QUEUED',
  TRANSMITTING = 'TRANSMITTING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  ERROR = 'ERROR',
}

/**
 * Valid state transitions for eSocial events.
 * Terminal states: ACCEPTED (no further transitions).
 * REJECTED/ERROR can go back to DRAFT for retry.
 */
const VALID_TRANSITIONS: Record<EsocialEventStatus, EsocialEventStatus[]> = {
  [EsocialEventStatus.DRAFT]: [
    EsocialEventStatus.VALIDATED,
    EsocialEventStatus.REVIEWED,
  ],
  [EsocialEventStatus.VALIDATED]: [
    EsocialEventStatus.REVIEWED,
    EsocialEventStatus.DRAFT,
  ],
  [EsocialEventStatus.REVIEWED]: [
    EsocialEventStatus.APPROVED,
    EsocialEventStatus.DRAFT,
  ],
  [EsocialEventStatus.APPROVED]: [EsocialEventStatus.QUEUED],
  [EsocialEventStatus.QUEUED]: [
    EsocialEventStatus.TRANSMITTING,
    EsocialEventStatus.ERROR,
  ],
  [EsocialEventStatus.TRANSMITTING]: [
    EsocialEventStatus.ACCEPTED,
    EsocialEventStatus.REJECTED,
    EsocialEventStatus.ERROR,
  ],
  [EsocialEventStatus.ACCEPTED]: [], // Terminal
  [EsocialEventStatus.REJECTED]: [EsocialEventStatus.DRAFT],
  [EsocialEventStatus.ERROR]: [
    EsocialEventStatus.QUEUED,
    EsocialEventStatus.DRAFT,
  ],
};

/**
 * Check if a status transition is valid.
 */
export function isValidTransition(
  from: EsocialEventStatus,
  to: EsocialEventStatus,
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get all valid next statuses from the current status.
 */
export function getValidNextStatuses(
  current: EsocialEventStatus,
): EsocialEventStatus[] {
  return VALID_TRANSITIONS[current] ?? [];
}

/**
 * Check if a status is terminal (no further transitions possible).
 */
export function isTerminalStatus(status: EsocialEventStatus): boolean {
  return VALID_TRANSITIONS[status]?.length === 0;
}

/**
 * Check if a status indicates the event can be edited.
 */
export function isEditableStatus(status: EsocialEventStatus): boolean {
  return [
    EsocialEventStatus.DRAFT,
    EsocialEventStatus.VALIDATED,
    EsocialEventStatus.REVIEWED,
    EsocialEventStatus.REJECTED,
    EsocialEventStatus.ERROR,
  ].includes(status);
}
