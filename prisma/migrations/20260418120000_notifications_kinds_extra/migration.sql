-- Add three new notification kinds: IMAGE_BANNER (visual with image),
-- REPORT (attached report preview), EMAIL_PREVIEW (inline email preview).
ALTER TYPE "NotificationKind" ADD VALUE IF NOT EXISTS 'IMAGE_BANNER';
ALTER TYPE "NotificationKind" ADD VALUE IF NOT EXISTS 'REPORT';
ALTER TYPE "NotificationKind" ADD VALUE IF NOT EXISTS 'EMAIL_PREVIEW';
