import { GoogleGenAI } from "@google/genai";
import { ASSISTANT_TOOLS, assistantFallbackText, executeAssistantTool } from "@/lib/ai-agent/tools";
import { GEMINI_ALTERNATE_FALLBACK_MODEL, GEMINI_FALLBACK_MODEL, MAX_TOOL_ROUNDS } from "@/lib/ai-agent/types";
import type { AssistantProperty, AssistantProviderInput, AssistantReply } from "@/lib/ai-agent/types";

const tools = ASSISTANT_TOOLS.map((tool) => ({
  type: "function" as const,
  name: tool.name,
  description: tool.description,
  // Sin campos obligatorios: si Gemini tiene que completarlos todos, inventa
  // filtros ("Capital Federal", un presupuesto) y la búsqueda vuelve vacía.
  parameters: { ...tool.parameters, required: [] },
}));

// Cada llamada falla rápido y pasa a otro modelo: los reintentos del SDK ante
// un 503 de Gemini llevaban las respuestas a más de un minuto.
const REQUEST_OPTIONS = { maxRetries: 0, timeout: 15_000 };

function shouldTryAnotherModel(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  // Sin status: se cortó por tiempo o por la red.
  return status === undefined || status === 408 || status === 429 || status >= 500;
}

// El último mensaje va aparte: si todo queda en el mismo hilo de texto, el
// modelo vuelve a contestar también las preguntas anteriores.
function transcript(input: AssistantProviderInput): string {
  const previous = input.history.slice(0, -1);
  const last = input.history[input.history.length - 1];
  const context = previous
    .map((message) => `${message.role === "user" ? "Cliente" : "Asistente"}: ${message.content}`)
    .join("\n\n");
  return context
    ? `Conversación hasta ahora (ya respondida, solo como contexto):\n\n${context}\n\nNuevo mensaje del cliente, respondé solo esto:\n${last.content}`
    : last.content;
}

function functionResult(name: string, callId: string, output: string, isError = false) {
  return {
    type: "function_result" as const,
    name,
    call_id: callId,
    ...(isError ? { is_error: true } : {}),
    result: [{ type: "text" as const, text: output }],
  };
}

export async function runGeminiAssistant(tenantId: string, input: AssistantProviderInput): Promise<AssistantReply> {
  const client = new GoogleGenAI({ apiKey: input.apiKey });
  const fallbackModel = input.model === GEMINI_FALLBACK_MODEL ? GEMINI_ALTERNATE_FALLBACK_MODEL : GEMINI_FALLBACK_MODEL;
  const requestConfig = {
    system_instruction: input.instructions,
    tools,
    // store: true para poder encadenar las rondas con previous_interaction_id:
    // Gemini rechaza (400) un historial armado a mano que no deje cada
    // llamada a función justo después del turno del usuario.
    store: true,
  };
  const generationConfig = { thinking_level: "low" as const, max_output_tokens: 1000 };
  type CreateParams = Omit<Parameters<typeof client.interactions.create>[0], "model" | "stream">;
  const createInteraction = async (params: CreateParams) => {
    try {
      return await client.interactions.create({ ...params, model: input.model, stream: false } as never, REQUEST_OPTIONS as never);
    } catch (error) {
      if (!shouldTryAnotherModel(error)) throw error;
      console.warn(`estate-ai gemini ${input.model} no respondió, probando ${fallbackModel}`, (error as Error).message);
      return client.interactions.create({ ...params, model: fallbackModel, stream: false } as never, REQUEST_OPTIONS as never);
    }
  };
  let interaction = await createInteraction({
    ...requestConfig,
    generation_config: generationConfig,
    input: transcript(input),
  } as CreateParams);
  let properties: AssistantProperty[] = [];
  let tokens = interaction.usage?.total_tokens ?? 0;
  let searched = false;
  const answeredCalls = new Set<string>();

  const finish = (text?: string): AssistantReply => ({
    text:
      text?.trim() ||
      (searched ? assistantFallbackText(properties.length) : "No pude armar una respuesta. Probá reformulando la consulta."),
    properties,
    tokens,
  });

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const calls = (interaction.steps ?? []).filter(
        (step) => step.type === "function_call" && !answeredCalls.has(step.id),
      ) as Extract<NonNullable<typeof interaction.steps>[number], { type: "function_call" }>[];
      if (calls.length === 0) return finish(interaction.output_text);

      const functionResults = await Promise.all(
        calls.map(async (call) => {
          answeredCalls.add(call.id);
          try {
            const result = await executeAssistantTool(tenantId, call.name, call.arguments);
            if (result.properties) {
              properties = result.properties;
              searched = true;
            }
            return functionResult(call.name, call.id, result.output);
          } catch (error) {
            console.error("AI tool failed", call.name, error);
            return functionResult(call.name, call.id, JSON.stringify({ error: "No se pudo consultar esa información" }), true);
          }
        }),
      );
      const lastRound = round === MAX_TOOL_ROUNDS - 1;
      interaction = await createInteraction({
        ...requestConfig,
        generation_config: { ...generationConfig, ...(lastRound ? { tool_choice: "none" as const } : {}) },
        previous_interaction_id: interaction.id,
        input: functionResults,
      } as CreateParams);
      tokens += interaction.usage?.total_tokens ?? 0;
    }
    return finish(interaction.output_text);
  } catch (error) {
    if (!searched) throw error;
    // La búsqueda ya se hizo: si falla la redacción, se muestran los resultados.
    console.error("estate-ai gemini follow-up failed", error);
    return finish();
  }
}
