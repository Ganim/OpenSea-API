import type { ToolHandler, ToolExecutionContext } from '../tool-types';
import { PermissionAwareQueryBuilder } from '../permission-query-builder';
import { BusinessSnapshotService } from '../business-snapshot.service';

const ALL_MODULES = ['stock', 'finance', 'hr', 'sales'];

export function getCrossModuleHandlers(): Record<string, ToolHandler> {
  return {
    atlas_search_entities: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const builder = new PermissionAwareQueryBuilder();
        const modules = (args.modules as string[] | undefined)?.length
          ? (args.modules as string[])
          : ALL_MODULES;

        return builder.searchEntities(
          {
            query: args.query as string,
            modules,
            entityTypes: args.entityTypes as string[] | undefined,
            limit: args.limit as number | undefined,
          },
          context.tenantId,
          context.permissions,
        );
      },
    },

    atlas_get_business_kpis: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const builder = new PermissionAwareQueryBuilder();
        const modules = (args.modules as string[] | undefined)?.length
          ? (args.modules as string[])
          : ALL_MODULES;

        return builder.getKpis(
          {
            modules,
            period: args.period as
              | 'today'
              | 'week'
              | 'month'
              | 'quarter'
              | 'year'
              | undefined,
            compareWithPrevious: args.compareWithPrevious as
              | boolean
              | undefined,
          },
          context.tenantId,
          context.permissions,
        );
      },
    },

    atlas_cross_module_query: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const builder = new PermissionAwareQueryBuilder();

        return builder.crossModuleQuery(
          {
            primaryModule: args.primaryModule as string,
            secondaryModule: args.secondaryModule as string,
            queryType: args.queryType as
              | 'top_by_metric'
              | 'correlation'
              | 'breakdown',
            metric: args.metric as string,
            groupBy: args.groupBy as string | undefined,
            limit: args.limit as number | undefined,
            period: args.period as string | undefined,
          },
          context.tenantId,
          context.permissions,
        );
      },
    },

    atlas_refresh_snapshot: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const snapshotService = new BusinessSnapshotService();

        // Invalidate existing cache, then regenerate
        await snapshotService.invalidate(context.tenantId);
        const snapshot = await snapshotService.generate(context.tenantId);

        // Filter by user permissions
        const filtered = snapshotService.filterByPermissions(
          snapshot,
          context.permissions,
        );

        // If user requested specific modules, further filter
        const requestedModules = args.includeModules as string[] | undefined;
        if (requestedModules?.length) {
          const allowed = new Set(requestedModules);
          const mods = filtered.modules;
          if (!allowed.has('stock')) mods.stock = undefined;
          if (!allowed.has('finance')) mods.finance = undefined;
          if (!allowed.has('hr')) mods.hr = undefined;
          if (!allowed.has('sales')) mods.sales = undefined;
        }

        return {
          success: true,
          data: filtered,
        };
      },
    },
  };
}
