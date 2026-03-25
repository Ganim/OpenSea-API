import { makeAiRouter } from '@/services/ai-provider/make-ai-router';
import { GenerateContentUseCase } from '../generate-content';

export function makeGenerateContentUseCase() {
  const aiRouter = makeAiRouter();
  return new GenerateContentUseCase(aiRouter);
}
