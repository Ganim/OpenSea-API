export type RequestTargetType = 'USER' | 'GROUP' | 'ROLE';

export const REQUEST_TARGET_TYPES: RequestTargetType[] = [
  'USER',
  'GROUP',
  'ROLE',
];

export function isValidRequestTargetType(
  type: string,
): type is RequestTargetType {
  return REQUEST_TARGET_TYPES.includes(type as RequestTargetType);
}
