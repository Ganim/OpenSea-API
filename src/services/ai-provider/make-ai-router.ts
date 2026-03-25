import { AiRouter } from './ai-router';
import { ClaudeProvider } from './claude.provider';
import { GeminiProvider } from './gemini.provider';
import { GroqProvider } from './groq.provider';
import { OllamaProvider } from './ollama.provider';

let cachedRouter: AiRouter | null = null;

export function makeAiRouter(): AiRouter {
  if (cachedRouter) {
    return cachedRouter;
  }

  const router = new AiRouter();

  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const ollamaHost = process.env.OLLAMA_HOST;

  if (groqApiKey) {
    // Tier 1: Fast, cheap (Llama 8B — classification, extraction, simple tasks)
    router.registerProvider(
      1,
      new GroqProvider(groqApiKey, 'llama-3.1-8b-instant'),
    );

    // Tier 2: Powerful (Llama 70B — summaries, analysis, lead scoring)
    router.registerProvider(
      2,
      new GroqProvider(groqApiKey, 'llama-3.3-70b-versatile'),
    );
  } else if (ollamaHost) {
    // Ollama fallback for Tier 1/2 when Groq keys are not available
    router.registerProvider(1, new OllamaProvider(ollamaHost, 'llama3.2'));

    router.registerProvider(2, new OllamaProvider(ollamaHost, 'llama3.1'));
  }

  // Tier 3: Premium reasoning — Gemini preferred (free tier), Claude as fallback
  if (geminiApiKey) {
    router.registerProvider(
      3,
      new GeminiProvider(geminiApiKey, 'gemini-2.5-flash'),
    );
  } else if (anthropicApiKey) {
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
