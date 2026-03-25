import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import type { AiInsightsRepository } from '@/repositories/ai/ai-insights-repository';
import { makeCheckStockAlertsUseCase } from '@/use-cases/stock/items/factories/make-check-stock-alerts-use-case';
import { makeGetCashflowUseCase } from '@/use-cases/finance/dashboard/factories/make-get-cashflow-use-case';
import { makeGetForecastUseCase } from '@/use-cases/finance/dashboard/factories/make-get-forecast-use-case';

// ─── Types ───────────────────────────────────────────────────────────

export interface InsightGeneratorResult {
  generated: number;
  skippedDuplicates: number;
  errors: string[];
}

interface PendingInsight {
  type: string;
  priority: string;
  title: string;
  content: string;
  module: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  actionUrl?: string | null;
  suggestedAction?: string | null;
  renderData?: Record<string, unknown> | null;
  expiresAt?: Date | null;
  aiModel?: string | null;
  /** Dedup key: type + dedupEntityType + dedupEntityId */
  dedupEntityType?: string | null;
  dedupEntityId?: string | null;
}

// ─── Insight Generator ──────────────────────────────────────────────

export class InsightGenerator {
  constructor(private insightsRepository: AiInsightsRepository) {}

  async generate(
    tenantId: string,
    targetUserIds: string[],
  ): Promise<InsightGeneratorResult> {
    const t0 = Date.now();
    const pending: PendingInsight[] = [];
    const errors: string[] = [];

    // Collect insights from all modules in parallel
    const [stockInsights, financeInsights, hrInsights] =
      await Promise.allSettled([
        this.collectStockInsights(tenantId),
        this.collectFinanceInsights(tenantId),
        this.collectHrInsights(tenantId),
      ]);

    if (stockInsights.status === 'fulfilled') {
      pending.push(...stockInsights.value);
    } else {
      errors.push(`Stock insights failed: ${stockInsights.reason}`);
    }

    if (financeInsights.status === 'fulfilled') {
      pending.push(...financeInsights.value);
    } else {
      errors.push(`Finance insights failed: ${financeInsights.reason}`);
    }

    if (hrInsights.status === 'fulfilled') {
      pending.push(...hrInsights.value);
    } else {
      errors.push(`HR insights failed: ${hrInsights.reason}`);
    }

    // Celebration insights (non-critical)
    try {
      const celebrations = await this.collectCelebrationInsights(tenantId);
      pending.push(...celebrations);
    } catch (err) {
      errors.push(
        `Celebration insights failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    // Deduplicate and persist
    let generated = 0;
    let skippedDuplicates = 0;

    for (const insight of pending) {
      try {
        // Check for existing non-dismissed insight of same type + entity
        const existing =
          await this.insightsRepository.findExistingByTypeAndEntity(
            tenantId,
            insight.type,
            insight.dedupEntityType ?? insight.relatedEntityType,
            insight.dedupEntityId ?? insight.relatedEntityId,
          );

        if (existing) {
          skippedDuplicates++;
          continue;
        }

        const {
          dedupEntityType: _dt,
          dedupEntityId: _di,
          ...insightData
        } = insight;

        await this.insightsRepository.create({
          tenantId,
          targetUserIds,
          ...insightData,
        });

        generated++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Failed to create insight "${insight.type}": ${msg}`);
      }
    }

    logger.info(
      {
        tenantId,
        generated,
        skippedDuplicates,
        errors: errors.length,
        elapsedMs: Date.now() - t0,
      },
      '[InsightGenerator] completed',
    );

    return { generated, skippedDuplicates, errors };
  }

  // ─── Stock Insights ─────────────────────────────────────────────

  private async collectStockInsights(
    tenantId: string,
  ): Promise<PendingInsight[]> {
    const insights: PendingInsight[] = [];

    // LOW_STOCK — Products below minimum stock level
    try {
      const checkAlerts = makeCheckStockAlertsUseCase();
      const { alerts } = await checkAlerts.execute({ tenantId });

      for (const alert of alerts) {
        insights.push({
          type: 'ALERT',
          priority: 'HIGH',
          title: `Estoque baixo: ${alert.variantName}`,
          content: `A variante "${alert.variantName}" (${alert.fullCode}) está com ${alert.currentQuantity} unidades, abaixo do ponto de reposição de ${alert.reorderPoint}. Déficit de ${alert.deficit} unidades.`,
          module: 'stock',
          relatedEntityType: 'VARIANT',
          relatedEntityId: alert.variantId,
          dedupEntityType: 'VARIANT',
          dedupEntityId: alert.variantId,
          actionUrl: `/stock/variants/${alert.variantId}`,
          suggestedAction: `Criar ordem de compra para repor ${alert.reorderQuantity ?? alert.deficit} unidades`,
          renderData: {
            insightCode: 'LOW_STOCK',
            variantName: alert.variantName,
            fullCode: alert.fullCode,
            currentQuantity: alert.currentQuantity,
            reorderPoint: alert.reorderPoint,
            deficit: alert.deficit,
          },
        });
      }
    } catch (err) {
      logger.error(err, '[InsightGenerator] LOW_STOCK check failed');
    }

    // NO_MOVEMENT — Products with no movement > 60 days
    try {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const staleVariants = await prisma.variant.findMany({
        where: {
          tenantId,
          deletedAt: null,
          items: {
            every: {
              movements: {
                none: {
                  createdAt: { gte: sixtyDaysAgo },
                },
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
          fullCode: true,
          items: {
            select: {
              currentQuantity: true,
            },
          },
        },
        take: 20,
      });

      for (const variant of staleVariants) {
        const totalQty = variant.items.reduce(
          (s, i) => s + Number(i.currentQuantity),
          0,
        );
        if (totalQty <= 0) continue; // Only flag if there's actual stock

        insights.push({
          type: 'RECOMMENDATION',
          priority: 'MEDIUM',
          title: `Sem movimentação: ${variant.name}`,
          content: `A variante "${variant.name}" (${variant.fullCode}) possui ${totalQty} unidades em estoque e não teve movimentação nos últimos 60 dias. Considere uma promoção ou liquidação.`,
          module: 'stock',
          relatedEntityType: 'VARIANT',
          relatedEntityId: variant.id,
          dedupEntityType: 'VARIANT',
          dedupEntityId: variant.id,
          actionUrl: `/stock/variants/${variant.id}`,
          suggestedAction:
            'Criar promoção para escoar o estoque parado ou verificar se o produto ainda é relevante',
          renderData: {
            insightCode: 'NO_MOVEMENT',
            variantName: variant.name,
            fullCode: variant.fullCode,
            currentQuantity: totalQty,
            staleDays: 60,
          },
        });
      }
    } catch (err) {
      logger.error(err, '[InsightGenerator] NO_MOVEMENT check failed');
    }

    return insights;
  }

  // ─── Finance Insights ───────────────────────────────────────────

  private async collectFinanceInsights(
    tenantId: string,
  ): Promise<PendingInsight[]> {
    const insights: PendingInsight[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // OVERDUE_ENTRIES — Entries past due date
    try {
      const overdueEntries = await prisma.financeEntry.findMany({
        where: {
          tenantId,
          status: 'PENDING',
          dueDate: { lt: today },
          deletedAt: null,
        },
        select: {
          id: true,
          type: true,
          description: true,
          dueDate: true,
          expectedAmount: true,
        },
        take: 50,
      });

      if (overdueEntries.length > 0) {
        const payable = overdueEntries.filter((e) => e.type === 'PAYABLE');
        const receivable = overdueEntries.filter(
          (e) => e.type === 'RECEIVABLE',
        );
        const totalAmount = overdueEntries.reduce(
          (s, e) => s + Number(e.expectedAmount),
          0,
        );

        insights.push({
          type: 'ALERT',
          priority: 'HIGH',
          title: `${overdueEntries.length} lançamentos vencidos`,
          content: `Existem ${overdueEntries.length} lançamentos vencidos (${payable.length} a pagar, ${receivable.length} a receber) totalizando R$ ${totalAmount.toFixed(2)}.`,
          module: 'finance',
          relatedEntityType: 'FINANCE_ENTRY',
          relatedEntityId: null,
          dedupEntityType: 'OVERDUE_ENTRIES',
          dedupEntityId: null,
          actionUrl: '/finance/entries?status=OVERDUE',
          suggestedAction:
            'Revisar lançamentos vencidos e registrar pagamentos ou renegociar',
          renderData: {
            insightCode: 'OVERDUE_ENTRIES',
            totalCount: overdueEntries.length,
            payableCount: payable.length,
            receivableCount: receivable.length,
            totalAmount,
          },
        });
      }
    } catch (err) {
      logger.error(err, '[InsightGenerator] OVERDUE_ENTRIES check failed');
    }

    // PAYMENT_DUE — Payments due in next 7 days
    try {
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const dueSoonEntries = await prisma.financeEntry.findMany({
        where: {
          tenantId,
          status: 'PENDING',
          dueDate: { gte: today, lte: sevenDaysFromNow },
          deletedAt: null,
        },
        select: {
          id: true,
          type: true,
          description: true,
          dueDate: true,
          expectedAmount: true,
        },
        take: 50,
      });

      if (dueSoonEntries.length > 0) {
        const totalAmount = dueSoonEntries.reduce(
          (s, e) => s + Number(e.expectedAmount),
          0,
        );

        insights.push({
          type: 'ALERT',
          priority: 'MEDIUM',
          title: `${dueSoonEntries.length} lançamentos vencem em 7 dias`,
          content: `Existem ${dueSoonEntries.length} lançamentos com vencimento nos próximos 7 dias, totalizando R$ ${totalAmount.toFixed(2)}.`,
          module: 'finance',
          relatedEntityType: 'FINANCE_ENTRY',
          relatedEntityId: null,
          dedupEntityType: 'PAYMENT_DUE',
          dedupEntityId: null,
          actionUrl: '/finance/entries?status=PENDING',
          suggestedAction: 'Preparar pagamentos e verificar saldo disponível',
          renderData: {
            insightCode: 'PAYMENT_DUE',
            count: dueSoonEntries.length,
            totalAmount,
            dueWithinDays: 7,
          },
        });
      }
    } catch (err) {
      logger.error(err, '[InsightGenerator] PAYMENT_DUE check failed');
    }

    // CASHFLOW_WARNING — Negative cashflow projection next 30 days
    try {
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const getCashflow = makeGetCashflowUseCase();
      const cashflow = await getCashflow.execute({
        tenantId,
        startDate: today,
        endDate: thirtyDaysFromNow,
        groupBy: 'week',
      });

      if (cashflow.summary.closingBalance < 0) {
        insights.push({
          type: 'ALERT',
          priority: 'HIGH',
          title: 'Projeção de fluxo de caixa negativo',
          content: `A projeção de fluxo de caixa para os próximos 30 dias indica saldo negativo de R$ ${Math.abs(cashflow.summary.closingBalance).toFixed(2)}. Receitas previstas: R$ ${cashflow.summary.totalInflow.toFixed(2)}, despesas previstas: R$ ${cashflow.summary.totalOutflow.toFixed(2)}.`,
          module: 'finance',
          relatedEntityType: 'CASHFLOW',
          relatedEntityId: null,
          dedupEntityType: 'CASHFLOW_WARNING',
          dedupEntityId: null,
          actionUrl: '/finance/dashboard',
          suggestedAction:
            'Revisar despesas futuras, antecipar recebimentos ou buscar fontes de capital',
          renderData: {
            insightCode: 'CASHFLOW_WARNING',
            closingBalance: cashflow.summary.closingBalance,
            totalInflow: cashflow.summary.totalInflow,
            totalOutflow: cashflow.summary.totalOutflow,
            periodDays: 30,
          },
        });
      }
    } catch (err) {
      logger.error(err, '[InsightGenerator] CASHFLOW_WARNING check failed');
    }

    // HIGH_EXPENSES — Expense spike (>20% above monthly average)
    try {
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

      const getForecast = makeGetForecastUseCase();
      const forecast = await getForecast.execute({
        tenantId,
        type: 'PAYABLE',
        startDate: threeMonthsAgo,
        endDate: today,
        groupBy: 'month',
      });

      if (forecast.data.length >= 2) {
        // Calculate average of previous months (excluding current)
        const previousMonths = forecast.data.filter(
          (d) => new Date(d.date) < currentMonthStart,
        );

        if (previousMonths.length > 0) {
          const avgExpense =
            previousMonths.reduce((s, d) => s + d.payable, 0) /
            previousMonths.length;

          // Get current month expenses
          const currentMonth = forecast.data.find(
            (d) =>
              new Date(d.date).getMonth() === now.getMonth() &&
              new Date(d.date).getFullYear() === now.getFullYear(),
          );

          if (currentMonth && avgExpense > 0) {
            const increasePercent =
              ((currentMonth.payable - avgExpense) / avgExpense) * 100;

            if (increasePercent > 20) {
              insights.push({
                type: 'ALERT',
                priority: 'MEDIUM',
                title: 'Aumento atípico de despesas',
                content: `As despesas deste mês estão ${increasePercent.toFixed(0)}% acima da média mensal (R$ ${currentMonth.payable.toFixed(2)} vs média de R$ ${avgExpense.toFixed(2)}).`,
                module: 'finance',
                relatedEntityType: 'EXPENSE',
                relatedEntityId: null,
                dedupEntityType: 'HIGH_EXPENSES',
                dedupEntityId: null,
                actionUrl: '/finance/dashboard',
                suggestedAction:
                  'Verificar despesas atípicas e identificar oportunidades de economia',
                renderData: {
                  insightCode: 'HIGH_EXPENSES',
                  currentExpense: currentMonth.payable,
                  averageExpense: avgExpense,
                  increasePercent: Math.round(increasePercent),
                },
              });
            }
          }
        }
      }
    } catch (err) {
      logger.error(err, '[InsightGenerator] HIGH_EXPENSES check failed');
    }

    return insights;
  }

  // ─── HR Insights ────────────────────────────────────────────────

  private async collectHrInsights(tenantId: string): Promise<PendingInsight[]> {
    const insights: PendingInsight[] = [];
    const now = new Date();

    // VACATION_DUE — Employees who haven't taken vacation in >10 months
    try {
      const tenMonthsAgo = new Date(now);
      tenMonthsAgo.setMonth(tenMonthsAgo.getMonth() - 10);

      // Find active employees hired at least 10 months ago with no recent
      // absence of type VACATION in the last 10 months
      const employees = await prisma.employee.findMany({
        where: {
          tenantId,
          deletedAt: null,
          status: 'ACTIVE',
          hireDate: { lte: tenMonthsAgo },
          absences: {
            none: {
              type: 'VACATION',
              startDate: { gte: tenMonthsAgo },
            },
          },
        },
        select: {
          id: true,
          fullName: true,
          registrationNumber: true,
          hireDate: true,
        },
        take: 20,
      });

      for (const emp of employees) {
        insights.push({
          type: 'RECOMMENDATION',
          priority: 'MEDIUM',
          title: `Férias pendentes: ${emp.fullName}`,
          content: `O colaborador ${emp.fullName} (${emp.registrationNumber}) não possui registro de férias nos últimos 10 meses. Verifique o período aquisitivo.`,
          module: 'hr',
          relatedEntityType: 'EMPLOYEE',
          relatedEntityId: emp.id,
          dedupEntityType: 'EMPLOYEE',
          dedupEntityId: emp.id,
          actionUrl: `/hr/employees/${emp.id}`,
          suggestedAction:
            'Programar férias do colaborador para evitar acúmulo de período aquisitivo',
          renderData: {
            insightCode: 'VACATION_DUE',
            employeeName: emp.fullName,
            registrationNumber: emp.registrationNumber,
          },
        });
      }
    } catch (err) {
      logger.error(err, '[InsightGenerator] VACATION_DUE check failed');
    }

    // ABSENCE_SPIKE — Unusual absence rate in a department
    try {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date(now);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      // Since Absence doesn't have departmentId directly,
      // we query absences with employee's department
      const recentAbsences = await prisma.absence.findMany({
        where: {
          tenantId,
          startDate: { gte: thirtyDaysAgo },
          deletedAt: null,
        },
        select: {
          id: true,
          employee: {
            select: { departmentId: true },
          },
        },
      });

      const previousAbsences = await prisma.absence.findMany({
        where: {
          tenantId,
          startDate: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
          deletedAt: null,
        },
        select: {
          id: true,
          employee: {
            select: { departmentId: true },
          },
        },
      });

      // Group by department manually
      const recentByDept = new Map<string, number>();
      for (const a of recentAbsences) {
        const deptId = a.employee.departmentId;
        if (!deptId) continue;
        recentByDept.set(deptId, (recentByDept.get(deptId) ?? 0) + 1);
      }

      const previousByDept = new Map<string, number>();
      for (const a of previousAbsences) {
        const deptId = a.employee.departmentId;
        if (!deptId) continue;
        previousByDept.set(deptId, (previousByDept.get(deptId) ?? 0) + 1);
      }

      for (const [deptId, currentCount] of recentByDept) {
        const previousCount = previousByDept.get(deptId) ?? 0;

        // Flag if >50% increase and at least 3 absences
        if (
          currentCount >= 3 &&
          previousCount > 0 &&
          currentCount > previousCount * 1.5
        ) {
          // Get department name
          const department = await prisma.department.findUnique({
            where: { id: deptId },
            select: { name: true },
          });

          const deptName = department?.name ?? 'Departamento';
          const increasePercent = Math.round(
            ((currentCount - previousCount) / previousCount) * 100,
          );

          insights.push({
            type: 'ALERT',
            priority: 'MEDIUM',
            title: `Aumento de ausências: ${deptName}`,
            content: `O departamento "${deptName}" registrou ${currentCount} ausências nos últimos 30 dias, um aumento de ${increasePercent}% em relação ao período anterior (${previousCount} ausências).`,
            module: 'hr',
            relatedEntityType: 'DEPARTMENT',
            relatedEntityId: deptId,
            dedupEntityType: 'DEPARTMENT',
            dedupEntityId: deptId,
            actionUrl: `/hr/departments/${deptId}`,
            suggestedAction:
              'Investigar causas do aumento de ausências e verificar clima organizacional',
            renderData: {
              insightCode: 'ABSENCE_SPIKE',
              departmentName: deptName,
              currentCount,
              previousCount,
              increasePercent,
            },
          });
        }
      }
    } catch (err) {
      logger.error(err, '[InsightGenerator] ABSENCE_SPIKE check failed');
    }

    return insights;
  }

  // ─── Celebration Insights ───────────────────────────────────────

  private async collectCelebrationInsights(
    tenantId: string,
  ): Promise<PendingInsight[]> {
    const insights: PendingInsight[] = [];

    try {
      // Check product milestones
      const productCount = await prisma.product.count({
        where: { tenantId, deletedAt: null },
      });

      const milestones = [100, 500, 1000, 5000, 10000];
      for (const milestone of milestones) {
        if (productCount >= milestone && productCount < milestone + 10) {
          insights.push({
            type: 'CELEBRATION',
            priority: 'LOW',
            title: `Marco atingido: ${milestone} produtos!`,
            content: `Parabéns! Sua empresa atingiu a marca de ${milestone} produtos cadastrados. Isso demonstra o crescimento do seu catálogo.`,
            module: 'stock',
            relatedEntityType: 'MILESTONE',
            relatedEntityId: `products_${milestone}`,
            dedupEntityType: 'MILESTONE',
            dedupEntityId: `products_${milestone}`,
            actionUrl: '/stock/products',
            suggestedAction: null,
            renderData: {
              insightCode: 'CELEBRATION',
              milestoneType: 'products',
              milestone,
              currentCount: productCount,
            },
          });
          break; // Only one milestone at a time
        }
      }

      // Check employee milestones
      const employeeCount = await prisma.employee.count({
        where: { tenantId, deletedAt: null },
      });

      const empMilestones = [10, 50, 100, 500, 1000];
      for (const milestone of empMilestones) {
        if (employeeCount >= milestone && employeeCount < milestone + 5) {
          insights.push({
            type: 'CELEBRATION',
            priority: 'LOW',
            title: `Marco atingido: ${milestone} colaboradores!`,
            content: `Parabéns! Sua empresa conta agora com ${milestone} colaboradores. Isso reflete o crescimento da equipe.`,
            module: 'hr',
            relatedEntityType: 'MILESTONE',
            relatedEntityId: `employees_${milestone}`,
            dedupEntityType: 'MILESTONE',
            dedupEntityId: `employees_${milestone}`,
            actionUrl: '/hr/employees',
            suggestedAction: null,
            renderData: {
              insightCode: 'CELEBRATION',
              milestoneType: 'employees',
              milestone,
              currentCount: employeeCount,
            },
          });
          break;
        }
      }
    } catch (err) {
      logger.error(err, '[InsightGenerator] CELEBRATION check failed');
    }

    return insights;
  }
}
