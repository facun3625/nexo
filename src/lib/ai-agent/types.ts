export type AssistantHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantProperty = {
  id: string;
  title: string;
  operation: string;
  price: number | null;
  currency: string;
  showPrice: boolean;
  city: string;
  neighborhood: string;
  bedrooms: number;
  image: string | null;
  href: string;
};

export type AssistantReply = {
  text: string;
  properties: AssistantProperty[];
  // Tokens que consumió la respuesta (todas las vueltas con el proveedor)
  tokens: number;
};

export type AssistantProviderInput = {
  apiKey: string;
  model: string;
  instructions: string;
  history: AssistantHistoryMessage[];
};

// Si el modelo elegido está saturado o tarda, se responde con este otro.
// Es el que dio tiempos más parejos al medirlos (nov. 2026).
export const GEMINI_FALLBACK_MODEL = "gemini-3.1-flash-lite";
export const GEMINI_ALTERNATE_FALLBACK_MODEL = "gemini-3.5-flash-lite";

// Vueltas con búsquedas permitidas; la última obliga a responder sin herramientas.
export const MAX_TOOL_ROUNDS = 3;

export const DEFAULT_AI_MODELS = {
  openai: "gpt-4.1-mini",
  gemini: "gemini-3.1-flash-lite",
} as const;
