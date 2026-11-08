import "server-only";
import { runGeminiAssistant } from "@/lib/ai-agent/providers/gemini";
import { runOpenAiAssistant } from "@/lib/ai-agent/providers/openai";
import type { AssistantProviderInput } from "@/lib/ai-agent/types";

export async function runAssistantProvider(
  provider: "openai" | "gemini",
  tenantId: string,
  input: AssistantProviderInput,
) {
  return provider === "gemini" ? runGeminiAssistant(tenantId, input) : runOpenAiAssistant(tenantId, input);
}
