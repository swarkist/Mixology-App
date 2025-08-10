export function getModelForTask(task: "generate" | "parse" | "normalize" | "summarize"): string {
  switch (task) {
    case "generate": return "mistralai/mixtral-8x7b-instruct";
    case "parse": return "meta-llama/llama-3.1-70b-instruct";
    case "normalize": return "nousresearch/nous-capybara-7b:free";
    case "summarize": return "meta-llama/llama-3.1-70b-instruct";
    default: return "mistralai/mixtral-8x7b-instruct";
  }
}