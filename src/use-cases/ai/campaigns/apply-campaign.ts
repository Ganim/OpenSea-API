import type { AiInsightsRepository } from '@/repositories/ai/ai-insights-repository';
import type { ToolExecutor } from '@/services/ai-tools/tool-executor';
import type { ToolExecutionContext } from '@/services/ai-tools/tool-types';

interface ApplyCampaignRequest {
  tenantId: string;
  userId: string;
  insightId: string;
}

interface ApplyCampaignResponse {
  success: boolean;
  executedActions: Array<{
    tool: string;
    description: string;
    result: unknown;
    error?: string;
  }>;
}

export class ApplyCampaignUseCase {
  constructor(
    private insightsRepository: AiInsightsRepository,
    private toolExecutor: ToolExecutor,
  ) {}

  async execute(request: ApplyCampaignRequest): Promise<ApplyCampaignResponse> {
    const insight = await this.insightsRepository.findById(
      request.insightId,
      request.tenantId,
    );

    if (!insight) {
      throw new Error('Insight não encontrado.');
    }

    if (insight.status === 'ACTED_ON') {
      throw new Error('Esta campanha já foi aplicada.');
    }

    if (insight.status === 'DISMISSED') {
      throw new Error('Esta campanha foi descartada.');
    }

    const renderData = insight.renderData;
    if (!renderData || !Array.isArray(renderData.suggestedActions)) {
      throw new Error('Este insight não possui ações sugeridas para aplicar.');
    }

    const suggestedActions = renderData.suggestedActions as Array<{
      tool: string;
      description: string;
      args: Record<string, unknown>;
    }>;

    const context: ToolExecutionContext = {
      tenantId: request.tenantId,
      userId: request.userId,
      permissions: [],
      conversationId: '',
    };

    const executedActions: ApplyCampaignResponse['executedActions'] = [];

    for (const action of suggestedActions) {
      try {
        const result = await this.toolExecutor.execute(
          {
            id: `campaign-${request.insightId}-${Date.now()}`,
            name: action.tool,
            arguments: action.args,
          },
          context,
        );

        const parsedContent = JSON.parse(result.content);

        executedActions.push({
          tool: action.tool,
          description: action.description,
          result: parsedContent,
          error: result.isError ? parsedContent.error : undefined,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro desconhecido';
        executedActions.push({
          tool: action.tool,
          description: action.description,
          result: null,
          error: message,
        });
      }
    }

    // Mark insight as acted on
    await this.insightsRepository.markActedOn(
      request.insightId,
      request.tenantId,
    );

    const hasErrors = executedActions.some((a) => a.error);

    return {
      success: !hasErrors,
      executedActions,
    };
  }
}
