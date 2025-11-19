export type RequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_PROGRESS'
  | 'PENDING_INFO'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED';

export const REQUEST_STATUSES: RequestStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'IN_PROGRESS',
  'PENDING_INFO',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'COMPLETED',
];

export function isValidRequestStatus(status: string): status is RequestStatus {
  return REQUEST_STATUSES.includes(status as RequestStatus);
}

// Estados válidos para transição
export const VALID_STATUS_TRANSITIONS: Record<RequestStatus, RequestStatus[]> =
  {
    DRAFT: ['SUBMITTED', 'CANCELLED'],
    SUBMITTED: [
      'IN_PROGRESS',
      'PENDING_INFO',
      'APPROVED',
      'REJECTED',
      'CANCELLED',
    ],
    IN_PROGRESS: ['PENDING_INFO', 'COMPLETED', 'REJECTED', 'CANCELLED'],
    PENDING_INFO: ['SUBMITTED', 'CANCELLED'],
    APPROVED: ['COMPLETED', 'CANCELLED'],
    REJECTED: [],
    CANCELLED: [],
    COMPLETED: [],
  };

export function canTransitionTo(
  from: RequestStatus,
  to: RequestStatus,
): boolean {
  return VALID_STATUS_TRANSITIONS[from].includes(to);
}
