-- Adds WHATSAPP to NotificationChannel enum for the v2 notifications module.
ALTER TYPE "NotificationChannel" ADD VALUE IF NOT EXISTS 'WHATSAPP';
