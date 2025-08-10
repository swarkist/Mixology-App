import { getModelForTask } from "./modelRouter";

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message: string;
  };
}

export async function callOpenRouter(
  task: "generate" | "parse" | "normalize" | "summarize", 
  userContent: string, 
  systemPrompt: string
): Promise<string> {
  const model = getModelForTask(task);
  
  const response = await fetch("/api/openrouter", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      systemPrompt,
      userContent
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.statusText}`);
  }

  const data: OpenRouterResponse = await response.json();
  
  if (data.error) {
    throw new Error(`OpenRouter error: ${data.error.message}`);
  }
  
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content returned from OpenRouter");
  }
  
  return content;
}