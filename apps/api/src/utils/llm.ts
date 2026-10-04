import { OpenAI } from "openai";

export const llmClient = new OpenAI({
  apiKey: "ollama",
  baseURL: "http://127.0.0.1:11434/v1",
});
