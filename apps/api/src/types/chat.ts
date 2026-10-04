import { minLength, z } from "zod";

export const ChatMessageSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
