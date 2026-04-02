import { describe, expect, it } from 'vitest';
import {
  ELEVATED_ROLES,
  VALID_CENTRAL_USER_ROLES,
  isValidCentralUserRole,
} from './central-user-roles';

describe('Central User Roles', () => {
  it('should have exactly 5 valid roles', () => {
    expect(VALID_CENTRAL_USER_ROLES).toHaveLength(5);
    expect(VALID_CENTRAL_USER_ROLES).toEqual([
      'OWNER',
      'ADMIN',
      'SUPPORT',
      'FINANCE',
      'VIEWER',
    ]);
  });

  it('should have OWNER and ADMIN as elevated roles', () => {
    expect(ELEVATED_ROLES).toEqual(['OWNER', 'ADMIN']);
  });

  it('should validate valid roles', () => {
    for (const role of VALID_CENTRAL_USER_ROLES) {
      expect(isValidCentralUserRole(role)).toBe(true);
    }
  });

  it('should reject invalid roles', () => {
    expect(isValidCentralUserRole('INVALID')).toBe(false);
    expect(isValidCentralUserRole('')).toBe(false);
    expect(isValidCentralUserRole('owner')).toBe(false);
    expect(isValidCentralUserRole('admin')).toBe(false);
  });
});
