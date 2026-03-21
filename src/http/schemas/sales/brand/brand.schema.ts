import { z } from 'zod';

// ─── Update Brand ────────────────────────────────────────────────────────────

export const updateBrandSchema = z.object({
  primaryColor: z.string().max(16).optional().describe('Primary color'),
  secondaryColor: z.string().max(16).optional().describe('Secondary color'),
  accentColor: z.string().max(16).optional().describe('Accent color'),
  backgroundColor: z.string().max(16).optional().describe('Background color'),
  textColor: z.string().max(16).optional().describe('Text color'),
  fontFamily: z.string().max(64).optional().describe('Body font family'),
  fontHeading: z.string().max(64).nullable().optional().describe('Heading font family'),
  tagline: z.string().max(256).nullable().optional().describe('Brand tagline'),
  logoFileId: z.string().uuid().nullable().optional().describe('Logo file ID'),
  logoIconFileId: z.string().uuid().nullable().optional().describe('Logo icon file ID'),
  socialLinks: z.record(z.string(), z.string()).nullable().optional().describe('Social media links'),
  contactInfo: z.record(z.string(), z.unknown()).nullable().optional().describe('Contact info'),
});

// ─── Brand Response ──────────────────────────────────────────────────────────

export const brandResponseSchema = z.object({
  id: z.string().uuid().describe('Brand ID'),
  tenantId: z.string().uuid().describe('Tenant ID'),
  name: z.string().describe('Brand name'),
  logoFileId: z.string().nullable().describe('Logo file ID'),
  logoIconFileId: z.string().nullable().describe('Logo icon file ID'),
  primaryColor: z.string().describe('Primary color'),
  secondaryColor: z.string().describe('Secondary color'),
  accentColor: z.string().describe('Accent color'),
  backgroundColor: z.string().describe('Background color'),
  textColor: z.string().describe('Text color'),
  fontFamily: z.string().describe('Body font family'),
  fontHeading: z.string().nullable().describe('Heading font family'),
  tagline: z.string().nullable().describe('Brand tagline'),
  socialLinks: z.record(z.string(), z.string()).nullable().describe('Social links'),
  contactInfo: z.record(z.string(), z.unknown()).nullable().describe('Contact info'),
  isDefault: z.boolean().describe('Is default brand'),
  createdAt: z.coerce.date().describe('Creation date'),
  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});
