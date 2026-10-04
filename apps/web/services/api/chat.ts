import {
  ConversationListResponseSchema,
  type Conversation,
} from "@repo/validation/chat";

export const CHAT_API_URL =
  process.env.NEXT_PUBLIC_CHAT_API_URL ?? "http://localhost:8080/api/v1/chat";

export type { Conversation };

export async function listConversations(): Promise<Conversation[]> {
  const response = await fetch(`${CHAT_API_URL}/chats`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      typeof body === "object" && body !== null && "error" in body &&
      typeof body.error === "string"
        ? body.error
        : "Couldn’t load your conversations.";
    throw new Error(message);
  }

  const result: unknown = await response.json();
  const parsed = ConversationListResponseSchema.safeParse(result);
  if (!parsed.success) {
    throw new Error("The conversation list response had an unexpected format.");
  }

  return parsed.data.data;
}
