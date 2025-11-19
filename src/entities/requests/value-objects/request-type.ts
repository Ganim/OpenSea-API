export type RequestType =
  | 'ACCESS_REQUEST'
  | 'PURCHASE_REQUEST'
  | 'APPROVAL_REQUEST'
  | 'ACTION_REQUEST'
  | 'CHANGE_REQUEST'
  | 'CUSTOM';

export const REQUEST_TYPES: RequestType[] = [
  'ACCESS_REQUEST',
  'PURCHASE_REQUEST',
  'APPROVAL_REQUEST',
  'ACTION_REQUEST',
  'CHANGE_REQUEST',
  'CUSTOM',
];

export function isValidRequestType(type: string): type is RequestType {
  return REQUEST_TYPES.includes(type as RequestType);
}
