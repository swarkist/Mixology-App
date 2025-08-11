/* OpenRouter multimodal helpers for image+text prompts */
type VisionResult = {
  name?: string;
  proof?: number | null;
  bottle_text?: string;
  confidence?: number; // 0..1
  notes?: string;
  warnings?: string[];
};

const DEFAULT_MODELS = [
  "qwen/qwen2.5-vl-32b-instruct:free",
  "qwen/qwen2.5-vl-72b-instruct:free",
  "opengvlab/internvl3-14b:free",
  "meta-llama/llama-3.2-11b-vision-instruct:free",
];

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function buildBody(base64DataUrl: string, systemHint?: string) {
  return {
    messages: [
      {
        role: "system",
        content:
          systemHint ??
          "You are an expert at reading bottle labels and extracting brand data with high accuracy and conservative confidence scoring.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Read the bottle label. Return strict JSON only with fields:
{
  "name": string,
  "proof": number|null,
  "bottle_text": string,
  "confidence": number,
  "notes": string
}
Rules:
- If only ABV is printed (e.g., "40% ABV"), you may compute proof = ABV*2 and mention this in "notes".
- If neither proof nor ABV appears, set proof=null.
- Favor the most prominent brand line as "name".
- Output ONLY JSON. No extra commentary.`,
          },
          {
            type: "image_url",
            image_url: { url: base64DataUrl },
          },
        ],
      },
    ],
    temperature: 0,
    response_format: { type: "json_object" },
  };
}

export async function extractBrandFromImage(
  base64DataUrl: string,
  preferredModels = DEFAULT_MODELS
): Promise<{ result: VisionResult; model: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY");

  console.log("🔥 Starting OCR with", preferredModels.length, "models");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": "https://miximixology.com",
    "X-Title": "Mixology - Brand OCR",
  };

  let lastErr: any;
  for (const model of preferredModels) {
    try {
      console.log("🔥 Trying model:", model);
      const body = JSON.stringify({ ...buildBody(base64DataUrl), model });
      console.log("🔥 Request body size:", body.length);
      
      const res = await fetch(OPENROUTER_URL, { method: "POST", headers, body } as any);
      console.log("🔥 OpenRouter response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.log("🔥 OpenRouter error response:", errorText);
        throw new Error(`OpenRouter ${model} failed: ${res.status} ${res.statusText} - ${errorText}`);
      }
      
      const json = await res.json();
      console.log("🔥 OpenRouter JSON response:", JSON.stringify(json, null, 2));

      const raw = json?.choices?.[0]?.message?.content;
      if (!raw) throw new Error(`No content from ${model}`);
      
      console.log("🔥 Raw content from model:", raw);
      const parsed: VisionResult = typeof raw === "string" ? JSON.parse(raw) : raw;
      console.log("🔥 Parsed result:", parsed);

      if (parsed && typeof parsed.proof === "string") {
        const n = Number(String(parsed.proof).replace(/[^\d.]/g, ""));
        parsed.proof = Number.isFinite(n) ? n : null;
      }

      if (parsed && Number.isFinite(parsed.confidence as number)) {
        parsed.confidence = Math.max(0, Math.min(1, Number(parsed.confidence)));
      } else if (parsed) {
        parsed.confidence = 0.5;
      }

      console.log("🔥 Final processed result:", parsed);
      return { result: parsed, model };
    } catch (err) {
      console.log("🔥 Model", model, "failed:", err);
      lastErr = err;
      // Try next model
    }
  }
  console.log("🔥 All models failed, last error:", lastErr);
  throw lastErr ?? new Error("All models failed");
}