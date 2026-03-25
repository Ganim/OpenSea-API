import { makeAiRouter } from '@/services/ai-provider/make-ai-router';
import { AnalyzeDocumentUseCase } from '../analyze-document';

export function makeAnalyzeDocumentUseCase() {
  const aiRouter = makeAiRouter();
  return new AnalyzeDocumentUseCase(aiRouter);
}
