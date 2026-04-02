import type { AiWorkflowsRepository } from '@/repositories/ai/ai-workflows-repository';
import type { AiWorkflowExecutionsRepository } from '@/repositories/ai/ai-workflow-executions-repository';
import type { ToolExecutor } from '@/services/ai-tools/tool-executor';
import type { ToolExecutionContext } from '@/services/ai-tools/tool-types';
import type { AiWorkflowCondition } from '@/entities/ai/ai-workflow';

interface ExecuteWorkflowRequest {
  workflowId: string;
  tenantId: string;
  userId: string;
  trigger: string;
  userPermissions?: string[];
}

export class ExecuteWorkflowUseCase {
  constructor(
    private workflowsRepository: AiWorkflowsRepository,
    private executionsRepository: AiWorkflowExecutionsRepository,
    private toolExecutor: ToolExecutor,
  ) {}

  async execute(request: ExecuteWorkflowRequest) {
    const workflow = await this.workflowsRepository.findById(
      request.workflowId,
      request.tenantId,
    );

    if (!workflow) {
      throw new Error('Workflow não encontrado.');
    }

    if (!workflow.isActive) {
      throw new Error('Workflow está desativado.');
    }

    // Create execution record
    const execution = await this.executionsRepository.create({
      workflowId: request.workflowId,
      trigger: request.trigger,
    });

    const context: ToolExecutionContext = {
      tenantId: request.tenantId,
      userId: request.userId,
      permissions: request.userPermissions ?? [],
      conversationId: `workflow-${execution.id}`,
    };

    const results: Array<{
      toolName: string;
      order: number;
      success: boolean;
      result: unknown;
    }> = [];

    try {
      // Evaluate conditions (if any)
      if (workflow.conditions && workflow.conditions.length > 0) {
        const conditionsMet = this.evaluateConditions(workflow.conditions);
        if (!conditionsMet) {
          await this.executionsRepository.update(execution.id, {
            status: 'COMPLETED',
            results: {
              skipped: true,
              reason: 'Condições não atendidas',
            },
            completedAt: new Date(),
          });

          return {
            executionId: execution.id,
            status: 'COMPLETED',
            skipped: true,
            reason: 'Condições não atendidas',
          };
        }
      }

      // Sort actions by order
      const sortedActions = [...workflow.actions].sort(
        (a, b) => a.order - b.order,
      );

      // Execute actions sequentially
      for (const action of sortedActions) {
        const toolResult = await this.toolExecutor.execute(
          {
            id: `workflow-${execution.id}-${action.order}`,
            name: action.toolName,
            arguments: action.arguments,
          },
          context,
        );

        const success = !toolResult.isError;
        let parsedResult: unknown;

        try {
          parsedResult = JSON.parse(toolResult.content);
        } catch {
          parsedResult = toolResult.content;
        }

        results.push({
          toolName: action.toolName,
          order: action.order,
          success,
          result: parsedResult,
        });

        // Stop execution chain on error
        if (!success) {
          throw new Error(
            `Ação "${action.toolName}" falhou: ${toolResult.content}`,
          );
        }
      }

      // Update execution as completed
      const completedExecution = await this.executionsRepository.update(
        execution.id,
        {
          status: 'COMPLETED',
          results,
          completedAt: new Date(),
        },
      );

      // Update workflow run stats
      await this.workflowsRepository.update(
        request.workflowId,
        request.tenantId,
        {
          lastRunAt: new Date(),
          runCount: workflow.runCount + 1,
          lastError: null,
        },
      );

      return {
        executionId: completedExecution.id,
        status: 'COMPLETED',
        results,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';

      await this.executionsRepository.update(execution.id, {
        status: 'FAILED',
        results,
        error: errorMessage,
        completedAt: new Date(),
      });

      // Update workflow with error info
      await this.workflowsRepository.update(
        request.workflowId,
        request.tenantId,
        {
          lastRunAt: new Date(),
          runCount: workflow.runCount + 1,
          lastError: errorMessage,
        },
      );

      return {
        executionId: execution.id,
        status: 'FAILED',
        results,
        error: errorMessage,
      };
    }
  }

  private evaluateConditions(conditions: AiWorkflowCondition[]): boolean {
    // For now, conditions are evaluated as metadata hints.
    // Full dynamic evaluation would require runtime data fetching.
    // Return true to proceed — conditions serve as documentation
    // and can be enhanced with real-time data checks later.
    return conditions.length >= 0;
  }
}
