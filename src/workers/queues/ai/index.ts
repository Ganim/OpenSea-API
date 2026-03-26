export {
  startGenerateInsightsWorker,
  queueGenerateInsights,
  getAiGenerateInsightsQueue,
  type GenerateInsightsJobData,
} from './generate-insights.job';

/**
 * Starts all AI queue workers.
 */
export async function startAiWorkers(): Promise<void> {
  const { startGenerateInsightsWorker: startInsights } = await import(
    './generate-insights.job'
  );

  startInsights();

  console.log('[AI] All AI workers started');
}
