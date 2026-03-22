/**
 * Contact Zod Schemas
 * Validation schemas for CRM Contact CRUD endpoints
 */

import { z } from 'zod';

// ─── Create Contact ─────────────────────────────────────────────────────────

export const createContactSchema = z.object({
  customerId: z
    .string()
    .uuid()
    .describe('UUID of the customer this contact belongs to'),
  firstName: z.string().min(1).max(100).describe('First name of the contact'),
  lastName: z.string().max(100).optional().describe('Last name of the contact'),
  email: z
    .string()
    .email()
    .max(254)
    .optional()
    .describe('Email address of the contact'),
  phone: z.string().max(30).optional().describe('Phone number of the contact'),
  whatsapp: z
    .string()
    .max(30)
    .optional()
    .describe('WhatsApp number of the contact'),
  role: z
    .enum([
      'DECISION_MAKER',
      'INFLUENCER',
      'CHAMPION',
      'GATEKEEPER',
      'END_USER',
      'OTHER',
    ])
    .optional()
    .default('OTHER')
    .describe('Role of the contact within the customer organization'),
  jobTitle: z.string().max(150).optional().describe('Job title of the contact'),
  department: z
    .string()
    .max(150)
    .optional()
    .describe('Department of the contact'),
  lifecycleStage: z
    .enum([
      'SUBSCRIBER',
      'LEAD',
      'QUALIFIED',
      'OPPORTUNITY',
      'CUSTOMER',
      'EVANGELIST',
    ])
    .optional()
    .default('LEAD')
    .describe('Lifecycle stage of the contact'),
  leadScore: z
    .number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .describe('Lead score (0-100)'),
  leadTemperature: z
    .string()
    .max(50)
    .optional()
    .describe('Lead temperature (e.g., HOT, WARM, COLD)'),
  source: z
    .string()
    .max(100)
    .optional()
    .default('MANUAL')
    .describe('Source of the contact (e.g., MANUAL, WEBSITE, IMPORT)'),
  lastInteractionAt: z.coerce
    .date()
    .optional()
    .describe('Date of last interaction with the contact'),
  lastChannelUsed: z
    .string()
    .max(50)
    .optional()
    .describe('Last communication channel used'),
  socialProfiles: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('Social media profiles (JSON object)'),
  tags: z
    .array(z.string().max(50))
    .optional()
    .describe('Tags associated with the contact'),
  customFields: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('Custom fields (JSON object)'),
  avatarUrl: z
    .string()
    .url()
    .optional()
    .describe('URL to the contact avatar image'),
  assignedToUserId: z
    .string()
    .uuid()
    .optional()
    .describe('UUID of the user assigned to this contact'),
  isMainContact: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether this is the main contact for the customer'),
});

// ─── Update Contact ─────────────────────────────────────────────────────────

export const updateContactSchema = createContactSchema
  .omit({ customerId: true })
  .partial()
  .describe('Update contact fields (all optional)');

// ─── Contact Response ───────────────────────────────────────────────────────

export const contactResponseSchema = z.object({
  id: z.string().uuid().describe('Unique contact ID'),
  tenantId: z.string().uuid().describe('Tenant ID'),
  customerId: z.string().uuid().describe('Customer ID'),
  firstName: z.string().describe('First name'),
  lastName: z.string().nullable().describe('Last name'),
  fullName: z.string().describe('Full name (computed)'),
  email: z.string().nullable().describe('Email address'),
  phone: z.string().nullable().describe('Phone number'),
  whatsapp: z.string().nullable().describe('WhatsApp number'),
  role: z.string().describe('Contact role'),
  jobTitle: z.string().nullable().describe('Job title'),
  department: z.string().nullable().describe('Department'),
  lifecycleStage: z.string().describe('Lifecycle stage'),
  leadScore: z.number().describe('Lead score'),
  leadTemperature: z.string().nullable().describe('Lead temperature'),
  source: z.string().describe('Contact source'),
  lastInteractionAt: z.coerce
    .date()
    .nullable()
    .describe('Last interaction date'),
  lastChannelUsed: z.string().nullable().describe('Last channel used'),
  socialProfiles: z
    .record(z.string(), z.unknown())
    .nullable()
    .describe('Social profiles'),
  tags: z.array(z.string()).describe('Tags'),
  customFields: z
    .record(z.string(), z.unknown())
    .nullable()
    .describe('Custom fields'),
  avatarUrl: z.string().nullable().describe('Avatar URL'),
  assignedToUserId: z.string().nullable().describe('Assigned user ID'),
  isMainContact: z.boolean().describe('Is main contact'),
  createdAt: z.coerce.date().describe('Creation date'),
  updatedAt: z.coerce.date().nullable().describe('Last update date'),
  deletedAt: z.coerce.date().nullable().describe('Deletion date'),
});

// ─── List Contacts Query ────────────────────────────────────────────────────

export const listContactsQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1)
    .describe('Page number (starts at 1)'),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20)
    .describe('Items per page (max 100)'),
  search: z
    .string()
    .max(200)
    .optional()
    .describe('Search by name, email, or phone'),
  customerId: z.string().uuid().optional().describe('Filter by customer ID'),
  lifecycleStage: z.string().optional().describe('Filter by lifecycle stage'),
  leadTemperature: z.string().optional().describe('Filter by lead temperature'),
  assignedToUserId: z
    .string()
    .uuid()
    .optional()
    .describe('Filter by assigned user ID'),
  sortBy: z
    .enum([
      'firstName',
      'lastName',
      'email',
      'leadScore',
      'createdAt',
      'updatedAt',
    ])
    .optional()
    .default('createdAt')
    .describe('Field to sort by'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc')
    .describe('Sort order'),
});
