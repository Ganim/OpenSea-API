import { AiRouter } from './ai-router';
import { ClaudeProvider } from './claude.provider';
import { GroqProvider } from './groq.provider';

let cachedRouter: AiRouter | null = null;

export function makeAiRouter(): AiRouter {
  if (cachedRouter) {
    return cachedRouter;
  }

  const router = new AiRouter();

  const groqApiKey = process.env.GROQ_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (groqApiKey) {
    // Tier 1: Fast, cheap (8B model)
    router.registerProvider(1, new GroqProvider(groqApiKey, 'llama-3.1-8b-instant'));

    // Tier 2: Powerful (70B model)
    router.registerProvider(2, new GroqProvider(groqApiKey, 'llama-3.3-70b-versatile'));
  }

  if (anthropicApiKey) {
    // Tier 3: Premium (Claude)
    router.registerProvider(3, new ClaudeProvider(anthropicApiKey));
  }

  cachedRouter = router;
  return router;
}

/**
 * Clear cached router (useful for testing or env var changes).
 */
export function clearAiRouterCache(): void {
  cachedRouter = null;
}
