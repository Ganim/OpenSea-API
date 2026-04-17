/**
 * Shared error response schema (P2-46).
 *
 * Every controller that documents a 400/404/409/422/500 response should use
 * `errorResponseSchema` (or one of the specialized aliases below) so the
 * OpenAPI contract is consistent across modules and the frontend can key
 * off a single shape.
 *
 * Shape:
 *   - `code`      stable machine identifier (e.g. "FINANCE_BANK_ACCOUNT_NOT_FOUND")
 *   - `message`   human-readable localized message (PT-BR preferred)
 *   - `requestId` optional correlation id for tracing; the global error
 *                 handler injects it from `request.id` when available
 *   - `details`   optional unstructured payload (Zod issues, domain data)
 */

import { z } from 'zod';

export const errorResponseSchema = z.object({
  code: z
    .string()
    .min(1)
    .describe('Machine-readable error code (stable identifier)'),
  message: z.string().min(1).describe('Human-readable error message'),
  requestId: z
    .string()
    .optional()
    .describe('Correlation id for cross-service tracing'),
  details: z.unknown().optional().describe('Optional error-specific details'),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

/**
 * Convenience alias for 404 Not Found responses.
 */
export const notFoundResponseSchema = errorResponseSchema;

/**
 * Convenience alias for 400 Bad Request responses.
 */
export const badRequestResponseSchema = errorResponseSchema;

/**
 * Convenience alias for 500 Internal Server Error responses.
 */
export const internalErrorResponseSchema = errorResponseSchema;
