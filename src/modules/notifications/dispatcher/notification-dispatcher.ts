/**
 * NotificationDispatcher — the single entry point into the notifications
 * engine. Every call that originates from a business module goes through
 * this class.
 *
 * Responsibilities:
 *  - Validate the dispatch input against the category manifest.
 *  - Resolve recipients.
 *  - Apply preference hierarchy (DND > master channel > module > category).
 *  - Persist notifications with idempotency + grouping.
 *  - Emit real-time events (stub in phase 2, wired to socket.io in phase 3).
 *  - Delegate delivery to channel adapters (stub in phase 2, real in phase 4+).
 */

import { logger } from '@/lib/logger.js';
import { prisma } from '@/lib/prisma.js';

import { ChannelRegistry } from '../infrastructure/adapters/channel-adapter.js';
import { NotificationPrismaRepository } from '../infrastructure/repositories/notification-prisma-repository.js';
import { NotificationSettingsPrismaRepository } from '../infrastructure/repositories/notification-settings-prisma-repository.js';
import type {
  DispatchNotificationInput,
  DispatchResult,
  ProgressUpdateInput,
  ResolveNotificationInput,
  ResolveNotificationResult,
} from '../public/events.js';
import {
  listRegisteredManifests,
  registerManifestInMemory,
} from '../public/manifest-loader.js';
import type {
  ModuleNotificationManifest,
  NotificationActionDefinition,
} from '../public/types.js';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from '../public/types.js';
import { PreferenceResolver } from './preference-resolver.js';
import { RecipientResolver } from './recipient-resolver.js';
import type { NotificationEventBus } from './notification-event-bus.js';

const DEFAULT_GROUP_WINDOW_MS = 5 * 60 * 1000;

const KIND_MAP: Record<NotificationType, string> = {
  [NotificationType.INFORMATIONAL]: 'INFORMATIONAL',
  [NotificationType.LINK]: 'LINK',
  [NotificationType.ACTIONABLE]: 'ACTIONABLE',
  [NotificationType.APPROVAL]: 'APPROVAL',
  [NotificationType.FORM]: 'FORM',
  [NotificationType.PROGRESS]: 'PROGRESS',
  [NotificationType.SYSTEM_BANNER]: 'SYSTEM_BANNER',
};

const TYPE_MAP = {
  INFORMATIONAL: 'INFO',
  LINK: 'INFO',
  ACTIONABLE: 'INFO',
  APPROVAL: 'REMINDER',
  FORM: 'REMINDER',
  PROGRESS: 'INFO',
  SYSTEM_BANNER: 'WARNING',
} as const;

export class NotificationDispatcher {
  private readonly notificationRepo: NotificationPrismaRepository;
  private readonly settingsRepo: NotificationSettingsPrismaRepository;
  private readonly recipientResolver: RecipientResolver;
  private readonly preferenceResolver: PreferenceResolver;
  private readonly eventBus: NotificationEventBus;
  private readonly channelRegistry: ChannelRegistry;

  constructor(deps: {
    notificationRepo?: NotificationPrismaRepository;
    settingsRepo?: NotificationSettingsPrismaRepository;
    recipientResolver?: RecipientResolver;
    preferenceResolver?: PreferenceResolver;
    eventBus: NotificationEventBus;
    channelRegistry?: ChannelRegistry;
  }) {
    this.notificationRepo =
      deps.notificationRepo ?? new NotificationPrismaRepository();
    this.settingsRepo =
      deps.settingsRepo ?? new NotificationSettingsPrismaRepository();
    this.recipientResolver = deps.recipientResolver ?? new RecipientResolver();
    this.preferenceResolver =
      deps.preferenceResolver ?? new PreferenceResolver(this.settingsRepo);
    this.eventBus = deps.eventBus;
    this.channelRegistry = deps.channelRegistry ?? new ChannelRegistry();
  }

  /**
   * Dispatches the persisted notification to each allowed channel adapter.
   * Failures are logged and recorded in `notification_delivery_attempts`
   * but never thrown — one bad adapter must not break the fan-out.
   */
  private async deliverToChannels(
    notificationId: string,
    channels: NotificationChannel[],
  ): Promise<void> {
    const notification = await this.notificationRepo.findById(notificationId);
    if (!notification) return;

    for (const channel of channels) {
      const adapter = this.channelRegistry.get(channel);
      if (!adapter) continue;
      try {
        const result = await adapter.send(notification);
        await prisma.notificationDeliveryAttempt.create({
          data: {
            notificationId,
            channel: channel as
              | 'IN_APP'
              | 'EMAIL'
              | 'SMS'
              | 'PUSH'
              | 'WHATSAPP',
            status: result.status,
            providerId: result.providerId,
            providerName: result.providerName,
            error: result.error,
            latencyMs: result.latencyMs,
          },
        });
      } catch (error) {
        logger?.error?.(
          { err: error, notificationId, channel },
          '[notifications] channel adapter threw',
        );
        await prisma.notificationDeliveryAttempt.create({
          data: {
            notificationId,
            channel: channel as
              | 'IN_APP'
              | 'EMAIL'
              | 'SMS'
              | 'PUSH'
              | 'WHATSAPP',
            status: 'FAILED',
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }
  }

  async dispatch(input: DispatchNotificationInput): Promise<DispatchResult> {
    // 1. Resolve category
    const category = await this.settingsRepo.getCategoryByCode(input.category);
    if (!category) {
      throw new Error(
        `Notification category not found: ${input.category}. Did you register the module manifest?`,
      );
    }

    // 2. Resolve recipients
    const userIds = await this.recipientResolver.resolve({
      tenantId: input.tenantId,
      selector: input.recipients,
    });

    if (userIds.length === 0) {
      logger?.info?.(
        { category: input.category, selector: input.recipients },
        '[notifications] dispatch had zero recipients',
      );
      return {
        notificationIds: [],
        recipientCount: 0,
        deduplicated: false,
        suppressedByPreference: 0,
      };
    }

    // 3. Channels: explicit override OR category default
    const priority = input.priority ?? NotificationPriority.NORMAL;
    const channels =
      input.channels && input.channels.length > 0
        ? input.channels
        : (category.defaultChannels as NotificationChannel[]);

    let suppressedCount = 0;
    let deduped = false;
    const createdIds: string[] = [];

    for (const userId of userIds) {
      // 4. Idempotency — skip if already created
      const existing = await this.notificationRepo.findByIdempotency(
        input.tenantId,
        userId,
        input.idempotencyKey,
      );
      if (existing) {
        deduped = true;
        createdIds.push(existing.id);
        continue;
      }

      // 5. Apply preferences per user
      const { allowedChannels, suppressedChannels } =
        await this.preferenceResolver.resolve({
          userId,
          tenantId: input.tenantId,
          category,
          channels,
          priority,
        });

      suppressedCount += suppressedChannels.length;

      // If all channels suppressed — still persist IN_APP for record unless category is non-mandatory and IN_APP itself was suppressed
      if (allowedChannels.length === 0) {
        // Nothing to deliver. Don't persist to avoid silent clutter.
        continue;
      }

      // 6. Grouping — collapse into existing unread grouped notification
      if (input.groupKey) {
        const grouped = await this.notificationRepo.findGroupedRecent({
          tenantId: input.tenantId,
          userId,
          groupKey: input.groupKey,
          windowMs: DEFAULT_GROUP_WINDOW_MS,
        });
        if (grouped) {
          const nextCount =
            Number((grouped.metadata as Record<string, unknown>)?.count ?? 1) +
            1;
          const merged = await this.notificationRepo.incrementGrouped(
            grouped.id,
            {
              ...((grouped.metadata as Record<string, unknown>) ?? {}),
              count: nextCount,
              lastMergedAt: new Date().toISOString(),
            },
          );
          createdIds.push(merged.id);
          this.eventBus.publishUpdated({
            tenantId: input.tenantId,
            userId,
            notificationId: merged.id,
          });
          continue;
        }
      }

      // 7. Persist
      const actions = this.collectActions(input);

      const primaryChannel = allowedChannels[0] ?? NotificationChannel.IN_APP;

      const record = await this.notificationRepo.create({
        userId,
        tenantId: input.tenantId,
        title: input.title,
        message: input.body,
        type: TYPE_MAP[KIND_MAP[input.type] as keyof typeof TYPE_MAP] as
          | 'INFO'
          | 'WARNING'
          | 'ERROR'
          | 'SUCCESS'
          | 'REMINDER',
        priority,
        channel: primaryChannel as 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH',
        kind: KIND_MAP[input.type] as
          | 'INFORMATIONAL'
          | 'LINK'
          | 'ACTIONABLE'
          | 'APPROVAL'
          | 'FORM'
          | 'PROGRESS'
          | 'SYSTEM_BANNER',
        categoryId: category.id,
        channels: allowedChannels.map((c) => c) as unknown as never,
        state: requiresResolution(input.type) ? 'PENDING' : null,
        actionUrl: 'actionUrl' in input ? (input.actionUrl ?? null) : null,
        fallbackUrl:
          'fallbackUrl' in input ? (input.fallbackUrl ?? null) : null,
        actionText: 'actionText' in input ? (input.actionText ?? null) : null,
        actions: actions ? (actions as unknown as never) : undefined,
        callbackUrl:
          'callbackUrl' in input
            ? ((input as { callbackUrl?: string }).callbackUrl ?? null)
            : null,
        callbackStatus: 'callbackUrl' in input ? 'PENDING' : 'NOT_APPLICABLE',
        expiresAt: input.expiresAt ?? null,
        groupKey: input.groupKey ?? null,
        entityType: input.entity?.type ?? null,
        entityId: input.entity?.id ?? null,
        metadata: (input.metadata as unknown as never) ?? null,
        idempotencyKey: input.idempotencyKey,
        scheduledFor: input.scheduledFor ?? null,
        templateCode: input.templateCode ?? null,
        progress:
          input.type === NotificationType.PROGRESS
            ? ((input as { initialProgress?: number }).initialProgress ?? 0)
            : null,
        progressTotal:
          input.type === NotificationType.PROGRESS
            ? ((input as { totalSteps?: number }).totalSteps ?? null)
            : null,
      });

      createdIds.push(record.id);
      this.eventBus.publishCreated({
        tenantId: input.tenantId,
        userId,
        notificationId: record.id,
      });

      // Fan out to channel adapters (email, push, sms, whatsapp).
      // IN_APP is handled by the socket emit above, but we still call the
      // adapter so it records a DELIVERED row in notification_delivery_attempts.
      // Failures are logged, never re-thrown.
      this.deliverToChannels(record.id, allowedChannels).catch((err) => {
        logger?.error?.(
          { err, notificationId: record.id },
          '[notifications] channel fan-out failed',
        );
      });
    }

    // Get the channel registry so adapters can be registered at boot.
    // Exposed for the bootstrap module.
    void this.channelRegistry;

    return {
      notificationIds: createdIds,
      recipientCount: userIds.length,
      deduplicated: deduped,
      suppressedByPreference: suppressedCount,
    };
  }

  async resolve(
    input: ResolveNotificationInput,
  ): Promise<ResolveNotificationResult> {
    const record = await this.notificationRepo.findById(input.notificationId);
    if (!record) {
      throw new Error(`Notification ${input.notificationId} not found`);
    }
    if (record.userId !== input.userId) {
      throw new Error('Not authorized to resolve this notification');
    }
    if (record.state && record.state !== 'PENDING') {
      throw new Error(`Notification is not pending (state=${record.state})`);
    }
    if (record.expiresAt && record.expiresAt < new Date()) {
      throw new Error('Notification has expired');
    }

    const newState: 'RESOLVED' | 'DECLINED' = isDeclineAction(
      input.actionKey,
      record.actions as unknown as NotificationActionDefinition[] | null,
    )
      ? 'DECLINED'
      : 'RESOLVED';

    await this.notificationRepo.resolve({
      id: record.id,
      action: input.actionKey,
      resolvedById: input.userId,
      payload: { ...input.payload, reason: input.reason },
      newState,
    });

    this.eventBus.publishResolved({
      tenantId: record.tenantId ?? '',
      userId: record.userId,
      notificationId: record.id,
      action: input.actionKey,
      state: newState,
    });

    return {
      notificationId: record.id,
      state: newState,
      callbackQueued: Boolean(record.callbackUrl),
    };
  }

  async updateProgress(input: ProgressUpdateInput): Promise<void> {
    const record = await this.notificationRepo.findById(input.notificationId);
    if (!record) return;
    const updated = await this.notificationRepo.updateProgress({
      id: input.notificationId,
      progress: input.progress,
      total: record.progressTotal ?? undefined,
      completed: input.completed,
    });
    this.eventBus.publishProgress({
      tenantId: updated.tenantId ?? '',
      userId: updated.userId,
      notificationId: updated.id,
      progress: input.progress,
      total: updated.progressTotal ?? undefined,
      message: input.message,
      completed: Boolean(input.completed),
    });
  }

  async cancel(notificationId: string): Promise<void> {
    const record = await this.notificationRepo.findById(notificationId);
    if (!record) return;
    await this.notificationRepo.markCancelled(notificationId);
    this.eventBus.publishCancelled({
      tenantId: record.tenantId ?? '',
      userId: record.userId,
      notificationId,
    });
  }

  async registerManifest(manifest: ModuleNotificationManifest): Promise<void> {
    registerManifestInMemory(manifest);

    await this.settingsRepo.upsertModuleRegistry({
      code: manifest.module,
      displayName: manifest.displayName,
      icon: manifest.icon,
      order: manifest.order ?? 100,
    });

    const keepCodes: string[] = [];
    for (const [index, category] of manifest.categories.entries()) {
      keepCodes.push(category.code);
      await this.settingsRepo.upsertCategory({
        code: category.code,
        module: manifest.module,
        name: category.name,
        description: category.description,
        icon: manifest.icon,
        defaultKind: category.defaultType,
        defaultPriority: category.defaultPriority,
        defaultChannels: category.defaultChannels,
        digestSupported: category.digestSupported ?? true,
        mandatory: category.mandatory ?? false,
        order: index,
      });
    }

    await this.settingsRepo.deactivateMissingCategories({
      module: manifest.module,
      keepCodes,
    });
  }

  /** Register a channel adapter at boot time. */
  registerChannelAdapter(
    adapter: Parameters<ChannelRegistry['register']>[0],
  ): void {
    this.channelRegistry.register(adapter);
  }

  /** Convenience static helper: registers ALL in-memory manifests to DB (used on boot). */
  async syncAllInMemoryManifests(): Promise<void> {
    const all = listRegisteredManifests();
    for (const manifest of all) {
      await this.registerManifest(manifest);
    }
  }

  private collectActions(
    input: DispatchNotificationInput,
  ): NotificationActionDefinition[] | undefined {
    if (input.type === NotificationType.ACTIONABLE) {
      return input.actions;
    }
    if (input.type === NotificationType.APPROVAL) {
      const approve = input.approveAction ?? {
        key: 'approve',
        label: 'Aprovar',
        style: 'primary',
      };
      const reject = input.rejectAction ?? {
        key: 'reject',
        label: 'Rejeitar',
        style: 'destructive',
        requiresReason: input.requireReasonOnReject ?? false,
      };
      return [approve, reject];
    }
    if (input.type === NotificationType.FORM) {
      return [
        {
          key: 'submit',
          label: input.submitLabel ?? 'Enviar',
          style: 'primary',
          formSchema: input.fields,
        },
        ...(input.cancelLabel
          ? [
              {
                key: 'cancel',
                label: input.cancelLabel,
                style: 'ghost' as const,
              },
            ]
          : []),
      ];
    }
    return undefined;
  }
}

function requiresResolution(type: NotificationType): boolean {
  return (
    type === NotificationType.ACTIONABLE ||
    type === NotificationType.APPROVAL ||
    type === NotificationType.FORM
  );
}

function isDeclineAction(
  actionKey: string,
  actions: NotificationActionDefinition[] | null,
): boolean {
  if (!actions) return false;
  const action = actions.find((a) => a.key === actionKey);
  if (!action) return false;
  return action.style === 'destructive';
}
