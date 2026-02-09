import { prisma } from '@/lib/prisma';
import {
  type TenantSettings,
  resolveTenantSettings,
} from '@/types/tenant-settings';
import type { PlanLimits } from '@/types/plan-limits';

type SystemModule =
  | 'CORE'
  | 'STOCK'
  | 'SALES'
  | 'HR'
  | 'PAYROLL'
  | 'FINANCE'
  | 'REPORTS'
  | 'AUDIT'
  | 'REQUESTS'
  | 'NOTIFICATIONS';

interface CachedPlan {
  planId: string;
  tier: string;
  modules: SystemModule[];
  limits: PlanLimits;
  expiresAt: Date | null;
}

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Service that provides cached access to tenant context information.
 * Centralizes queries for plan, modules, feature flags, and settings.
 *
 * Uses an in-memory cache with 5-minute TTL to reduce database queries.
 * Cache is per-tenant and can be cleared manually when tenant data changes.
 */
export class TenantContextService {
  private static planCache = new Map<string, CacheEntry<CachedPlan>>();
  private static flagsCache = new Map<
    string,
    CacheEntry<Map<string, boolean>>
  >();
  private static settingsCache = new Map<string, CacheEntry<TenantSettings>>();

  /**
   * Get the tenant's current plan with modules and limits.
   */
  async getTenantPlan(tenantId: string): Promise<CachedPlan | null> {
    const cached = this.getFromCache(TenantContextService.planCache, tenantId);
    if (cached) return cached;

    const tenantPlan = await prisma.tenantPlan.findFirst({
      where: { tenantId },
      include: {
        plan: {
          include: {
            planModules: true,
          },
        },
      },
    });

    if (!tenantPlan) return null;

    const plan: CachedPlan = {
      planId: tenantPlan.plan.id,
      tier: tenantPlan.plan.tier,
      modules: tenantPlan.plan.planModules.map(
        (m: { module: string }) => m.module as SystemModule,
      ),
      limits: {
        maxUsers: tenantPlan.plan.maxUsers,
        maxWarehouses: tenantPlan.plan.maxWarehouses,
        maxProducts: tenantPlan.plan.maxProducts,
      },
      expiresAt: tenantPlan.expiresAt,
    };

    this.setCache(TenantContextService.planCache, tenantId, plan);
    return plan;
  }

  /**
   * Get list of active modules for the tenant.
   */
  async getActiveModules(tenantId: string): Promise<SystemModule[]> {
    const plan = await this.getTenantPlan(tenantId);
    if (!plan) return ['CORE']; // CORE is always available
    return [
      'CORE' as SystemModule,
      ...plan.modules.filter((m) => m !== 'CORE'),
    ];
  }

  /**
   * Check if a specific module is enabled for the tenant.
   */
  async isModuleEnabled(
    tenantId: string,
    module: SystemModule,
  ): Promise<boolean> {
    if (module === 'CORE') return true; // CORE is always enabled
    const modules = await this.getActiveModules(tenantId);
    return modules.includes(module);
  }

  /**
   * Check if a feature flag is enabled for the tenant.
   */
  async isFeatureEnabled(tenantId: string, flag: string): Promise<boolean> {
    const flags = await this.getTenantFlags(tenantId);
    return flags.get(flag) ?? false;
  }

  /**
   * Get the tenant's plan limits.
   */
  async getPlanLimits(tenantId: string): Promise<PlanLimits> {
    const plan = await this.getTenantPlan(tenantId);
    if (!plan) {
      return { maxUsers: 5, maxWarehouses: 1, maxProducts: 100 }; // FREE defaults
    }
    return plan.limits;
  }

  /**
   * Get the tenant's resolved settings (with defaults applied).
   */
  async getTenantSettings(tenantId: string): Promise<TenantSettings> {
    const cached = this.getFromCache(
      TenantContextService.settingsCache,
      tenantId,
    );
    if (cached) return cached;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    const settings = resolveTenantSettings(
      (tenant?.settings as Record<string, unknown>) ?? {},
    );

    this.setCache(TenantContextService.settingsCache, tenantId, settings);
    return settings;
  }

  /**
   * Get a specific section of tenant settings.
   */
  async getSetting<K extends keyof TenantSettings>(
    tenantId: string,
    section: K,
  ): Promise<TenantSettings[K]> {
    const settings = await this.getTenantSettings(tenantId);
    return settings[section];
  }

  /**
   * Clear all caches, or caches for a specific tenant.
   */
  clearCache(tenantId?: string): void {
    if (tenantId) {
      TenantContextService.planCache.delete(tenantId);
      TenantContextService.flagsCache.delete(tenantId);
      TenantContextService.settingsCache.delete(tenantId);
    } else {
      TenantContextService.planCache.clear();
      TenantContextService.flagsCache.clear();
      TenantContextService.settingsCache.clear();
    }
  }

  // --- Private helpers ---

  private async getTenantFlags(
    tenantId: string,
  ): Promise<Map<string, boolean>> {
    const cached = this.getFromCache(TenantContextService.flagsCache, tenantId);
    if (cached) return cached;

    const flags = await prisma.tenantFeatureFlag.findMany({
      where: { tenantId },
      select: { flag: true, enabled: true },
    });

    const flagMap = new Map<string, boolean>();
    for (const f of flags) {
      flagMap.set(f.flag, f.enabled);
    }

    this.setCache(TenantContextService.flagsCache, tenantId, flagMap);
    return flagMap;
  }

  private getFromCache<T>(
    cache: Map<string, CacheEntry<T>>,
    key: string,
  ): T | null {
    const entry = cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.cachedAt > CACHE_TTL_MS;
    if (isExpired) {
      cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache<T>(
    cache: Map<string, CacheEntry<T>>,
    key: string,
    data: T,
  ): void {
    cache.set(key, { data, cachedAt: Date.now() });
  }
}
