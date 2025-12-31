/**
 * HR Zod Schemas - Compatibility Layer
 * @deprecated Use imports from @/http/schemas/hr/* instead
 * This file re-exports all HR schemas for backward compatibility
 */

// Re-export common schemas for backward compatibility
export { idSchema } from './common.schema';

// Re-export everything from the new modular structure
export * from './hr/employees';
export * from './hr/companies';
export * from './hr/organization';
export * from './hr/time-management';
export * from './hr/leave';
export * from './hr/payroll';
export * from './hr/suppliers';
