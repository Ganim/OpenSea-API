import { makeAiRouter } from '@/services/ai-provider/make-ai-router';
import { makeToolRegistry } from '@/services/ai-tools/make-tool-registry';
import { ToolUseCaseFactory } from '@/services/ai-tools/tool-use-case-factory';
import { ToolExecutor } from '@/services/ai-tools/tool-executor';
import { SetupWizardUseCase } from '../setup-wizard';

export function makeSetupWizardUseCase() {
  const aiRouter = makeAiRouter();
  const toolRegistry = makeToolRegistry();
  const toolFactory = new ToolUseCaseFactory();
  const toolExecutor = new ToolExecutor(toolRegistry, toolFactory);

  return new SetupWizardUseCase(aiRouter, toolRegistry, toolExecutor);
}
