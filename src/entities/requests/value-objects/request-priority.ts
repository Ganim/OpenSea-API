export type RequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export const REQUEST_PRIORITIES: RequestPriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
];

export function isValidRequestPriority(
  priority: string,
): priority is RequestPriority {
  return REQUEST_PRIORITIES.includes(priority as RequestPriority);
}

export const PRIORITY_WEIGHT: Record<RequestPriority, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  URGENT: 4,
};

export function comparePriority(
  a: RequestPriority,
  b: RequestPriority,
): number {
  return PRIORITY_WEIGHT[b] - PRIORITY_WEIGHT[a]; // Maior prioridade primeiro
}
