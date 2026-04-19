import { prisma } from '@/lib/prisma';
import { makeCreateNotificationUseCase } from '@/use-cases/notifications/factories/make-create-notification-use-case';
import { faker } from '@faker-js/faker';

/** v1 factory — legacy use-case path (INFO/WARNING/ERROR/SUCCESS/REMINDER). */
export async function makeNotification(params: {
  userId: string;
  type?: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'REMINDER';
  channel?: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}) {
  const useCase = makeCreateNotificationUseCase();
  const { notification } = await useCase.execute({
    userId: params.userId,
    title: faker.lorem.sentence(5),
    message: faker.lorem.paragraph(),
    type: params.type ?? 'INFO',
    channel: params.channel ?? 'IN_APP',
    priority: params.priority ?? 'NORMAL',
  });
  return notification;
}

export type NotificationKindV2 =
  | 'INFORMATIONAL'
  | 'LINK'
  | 'ACTIONABLE'
  | 'APPROVAL'
  | 'FORM'
  | 'PROGRESS'
  | 'SYSTEM_BANNER'
  | 'IMAGE_BANNER'
  | 'REPORT'
  | 'EMAIL_PREVIEW';

/**
 * v2 factory — writes directly to `notifications` with the v2 `kind` column
 * and kind-specific metadata/fields so E2E specs can exercise every renderer
 * without spinning up the dispatcher. Produces one row per call.
 *
 * `tenantId` is required for the v2 list endpoint (which filters by tenant).
 */
export async function makeV2Notification(params: {
  userId: string;
  tenantId: string;
  kind?: NotificationKindV2;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  title?: string;
  message?: string;
  overrides?: Record<string, unknown>;
}) {
  const kind = params.kind ?? 'INFORMATIONAL';
  const legacyType =
    kind === 'SYSTEM_BANNER'
      ? 'WARNING'
      : kind === 'APPROVAL' || kind === 'FORM'
        ? 'REMINDER'
        : 'INFO';

  const base = {
    userId: params.userId,
    tenantId: params.tenantId,
    title: params.title ?? faker.lorem.sentence(5),
    message: params.message ?? faker.lorem.paragraph(),
    type: legacyType as 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'REMINDER',
    priority: params.priority ?? 'NORMAL',
    channel: 'IN_APP' as const,
    kind: kind as
      | 'INFORMATIONAL'
      | 'LINK'
      | 'ACTIONABLE'
      | 'APPROVAL'
      | 'FORM'
      | 'PROGRESS'
      | 'SYSTEM_BANNER',
    channels: ['IN_APP'] as (
      | 'IN_APP'
      | 'EMAIL'
      | 'PUSH'
      | 'SMS'
      | 'WHATSAPP'
    )[],
    state: (kind === 'ACTIONABLE' || kind === 'APPROVAL' || kind === 'FORM'
      ? 'PENDING'
      : null) as
      | 'PENDING'
      | 'RESOLVED'
      | 'EXPIRED'
      | 'DECLINED'
      | 'CANCELLED'
      | null,
  };

  const kindExtras = buildKindExtras(kind);
  const metadata = {
    ...(kindExtras.metadata ?? {}),
    ...((params.overrides?.metadata as Record<string, unknown>) ?? {}),
  };

  return prisma.notification.create({
    data: {
      ...base,
      ...kindExtras.columns,
      ...(params.overrides ?? {}),
      metadata,
    } as Parameters<typeof prisma.notification.create>[0]['data'],
  });
}

function buildKindExtras(kind: NotificationKindV2): {
  columns: Record<string, unknown>;
  metadata?: Record<string, unknown>;
} {
  switch (kind) {
    case 'LINK':
      return {
        columns: {
          actionUrl: '/dashboard',
          actionText: 'Abrir',
        },
      };
    case 'ACTIONABLE':
      return {
        columns: {
          actions: [
            { key: 'yes', label: 'Sim', style: 'primary' },
            { key: 'no', label: 'Não', style: 'ghost' },
          ],
          callbackUrl: '/v1/notifications/test-callback',
          callbackStatus: 'PENDING',
        },
      };
    case 'APPROVAL':
      return {
        columns: {
          actions: [
            { key: 'approve', label: 'Aprovar', style: 'primary' },
            { key: 'reject', label: 'Rejeitar', style: 'destructive' },
          ],
          callbackUrl: '/v1/notifications/test-callback',
          callbackStatus: 'PENDING',
        },
      };
    case 'FORM':
      return {
        columns: {
          actions: [
            {
              key: 'submit',
              label: 'Enviar',
              style: 'primary',
              formSchema: [{ key: 'qty', label: 'Quantidade', type: 'number' }],
            },
          ],
          callbackUrl: '/v1/notifications/test-callback',
          callbackStatus: 'PENDING',
        },
      };
    case 'PROGRESS':
      return {
        columns: {
          progress: 30,
          progressTotal: 100,
        },
      };
    case 'SYSTEM_BANNER':
      return {
        columns: {},
        metadata: { bannerStyle: 'warning', dismissible: true },
      };
    case 'IMAGE_BANNER':
      return {
        columns: {
          actionUrl: '/promo',
          actionText: 'Saiba mais',
        },
        metadata: {
          imageUrl:
            'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
          imageAlt: 'Banner promocional',
        },
      };
    case 'REPORT':
      return {
        columns: {
          actionUrl: '/reports/sales/sample.pdf',
        },
        metadata: {
          reportUrl: '/reports/sales/sample.pdf',
          reportFormat: 'pdf',
          reportName: 'Sample-Report.pdf',
          reportSize: 284_100,
          reportPeriod: 'Out/2026',
        },
      };
    case 'EMAIL_PREVIEW':
      return {
        columns: {
          actionUrl: '/email',
        },
        metadata: {
          emailFrom: 'cliente@exemplo.com',
          emailFromName: 'Maria Souza',
          emailSubject: 'Dúvida sobre prazo',
          emailPreview: 'Olá, poderia confirmar quando será entregue?',
          openInAppUrl: '/email',
        },
      };
    case 'INFORMATIONAL':
    default:
      return { columns: {} };
  }
}
