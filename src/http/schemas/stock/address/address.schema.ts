/**
 * ADDRESS SCHEMAS
 */

import { z } from 'zod';

export const addressComponentsSchema = z.object({
  warehouseCode: z.string(),
  zoneCode: z.string(),
  aisle: z.number(),
  shelf: z.number(),
  bin: z.string(),
  separator: z.string(),
});

export type AddressComponents = z.infer<typeof addressComponentsSchema>;

export const parseAddressResponseSchema = z.object({
  valid: z.boolean(),
  components: addressComponentsSchema.nullable(),
  originalAddress: z.string(),
  normalizedAddress: z.string().nullable(),
  error: z.string().optional(),
});

export type ParseAddressResponse = z.infer<typeof parseAddressResponseSchema>;

export const validateAddressResponseSchema = z.object({
  valid: z.boolean(),
  exists: z.boolean(),
  address: z.string(),
  binId: z.uuid().nullable(),
  error: z.string().optional(),
});

export type ValidateAddressResponse = z.infer<
  typeof validateAddressResponseSchema
>;

export const suggestAddressSchema = z.object({
  partial: z.string().min(1).max(50),
  limit: z.number().int().positive().max(20).optional().default(10),
});

export type SuggestAddressInput = z.infer<typeof suggestAddressSchema>;

export const addressSuggestionSchema = z.object({
  address: z.string(),
  binId: z.uuid(),
  warehouseCode: z.string(),
  warehouseName: z.string(),
  zoneCode: z.string(),
  zoneName: z.string(),
  aisle: z.number(),
  shelf: z.number(),
  position: z.string(),
  isAvailable: z.boolean(),
  occupancy: z.object({
    current: z.number(),
    capacity: z.number().nullable(),
  }),
});

export type AddressSuggestion = z.infer<typeof addressSuggestionSchema>;

export const suggestAddressResponseSchema = z.object({
  suggestions: z.array(addressSuggestionSchema),
  query: z.string(),
  total: z.number(),
});

export type SuggestAddressResponse = z.infer<
  typeof suggestAddressResponseSchema
>;
