import OpenAI from "openai";
import { toResponseInputItems } from "openai/lib/responses/ResponseInputItems";
import type {
  FunctionTool,
  ResponseFunctionToolCall,
  ResponseInputItem,
} from "openai/resources/responses/responses";
import { ASSISTANT_TOOLS, assistantFallbackText, executeAssistantTool } from "@/lib/ai-agent/tools";
import { MAX_TOOL_ROUNDS } from "@/lib/ai-agent/types";
import type { AssistantProperty, AssistantProviderInput, AssistantReply } from "@/lib/ai-agent/types";

const tools: FunctionTool[] = ASSISTANT_TOOLS.map((tool) => ({
  type: "function",
  name: tool.name,
  description: tool.description,
  parameters: tool.parameters,
  strict: true,
}));

export async function runOpenAiAssistant(tenantId: string, input: AssistantProviderInput): Promise<AssistantReply> {
  const client = new OpenAI({ apiKey: input.apiKey });
  let responseInput: ResponseInputItem[] = input.history.map((message) => ({
    type: "message",
    role: message.role,
    content: message.content,
  }));
  let properties: AssistantProperty[] = [];
  let tokens = 0;
  let searched = false;

  const finish = (text?: string): AssistantReply => ({
    text:
      text?.trim() ||
      (searched ? assistantFallbackText(properties.length) : "No pude armar una respuesta. Probá reformulando la consulta."),
    properties,
    tokens,
  });

  try {
    // Una vuelta más que las de búsqueda: la última obliga a responder.
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
      const response = await client.responses.create({
        model: input.model,
        instructions: input.instructions,
        input: responseInput,
        tools,
        ...(round === MAX_TOOL_ROUNDS ? { tool_choice: "none" as const } : {}),
        store: false,
        max_output_tokens: 1000,
      });
      tokens += response.usage?.total_tokens ?? 0;
      const calls = response.output.filter(
        (item): item is ResponseFunctionToolCall => item.type === "function_call",
      );
      if (calls.length === 0) return finish(response.output_text);

      const toolResults = await Promise.all(
        calls.map(async (call) => {
          try {
            const result = await executeAssistantTool(tenantId, call.name, JSON.parse(call.arguments));
            if (result.properties) {
              properties = result.properties;
              searched = true;
            }
            return { type: "function_call_output" as const, call_id: call.call_id, output: result.output };
          } catch (error) {
            console.error("AI tool failed", call.name, error);
            return {
              type: "function_call_output" as const,
              call_id: call.call_id,
              output: JSON.stringify({ error: "No se pudo consultar esa información" }),
            };
          }
        }),
      );
      responseInput = [...responseInput, ...toResponseInputItems(response.output), ...toolResults];
    }
    return finish();
  } catch (error) {
    if (!searched) throw error;
    // La búsqueda ya se hizo: si falla la redacción, se muestran los resultados.
    console.error("estate-ai openai follow-up failed", error);
    return finish();
  }
}
