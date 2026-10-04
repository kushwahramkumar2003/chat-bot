import type { Request, Response } from "express";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { ChatMessageSchema } from "../types/chat";
import { llmClient } from "../utils/llm";
import type { AppContext } from "../middleware/context";
import { prisma } from "../utils/db";

export const chat = async (ctx: AppContext, req: Request, res: Response) => {
  if (!ctx.user) {
    res.status(401).json({ error: "Sign in to use chat." });
    return;
  }

  const payload = ChatMessageSchema.safeParse(req.body);
  if (!payload.success) {
    res.status(400).json({ error: payload.error.message });
    return;
  }

  const { conversationId, message } = payload.data;

  const chat = conversationId
    ? await prisma.chat.findFirst({
        where: {
          id: conversationId,
          userId: ctx.user.id,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
    })
    : await prisma.chat.create({
        data: {
          userId: ctx.user.id,
          title: message.trim().slice(0, 60),
        },
        include: { messages: true },
      });

  if (!chat) {
    res.status(404).json({ error: "Conversation not found." });
    return;
  }

  const userMessage = await prisma.message.create({
    data: {
      role: "user",
      content: message,
      chatId: chat.id,
    },
  });
  await prisma.chat.update({
    where: { id: chat.id },
    data: { updatedAt: new Date() },
  });

  const history: ChatCompletionMessageParam[] = [];
  for (const item of chat.messages) {
    if (item.role === "user") {
      history.push({ role: "user", content: item.content });
    } else if (item.role === "assistant") {
      history.push({ role: "assistant", content: item.content });
    }
  }

  const llmMessages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: "You are a helpful assistant. Answer politely and concisely.",
    },
    ...history,
    { role: "user", content: userMessage.content },
  ];

  const stream = await llmClient.chat.completions.stream({
    model: "openbmb/minicpm5-2b:latest",
    messages: llmMessages,
  });

  res.setHeader("X-Conversation-Id", chat.id);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let assistantReply = "";
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) {
      assistantReply += text;
      res.write(text);
    }
  }

  await prisma.message.create({
    data: {
      role: "assistant",
      content: assistantReply,
      chatId: chat.id,
    },
  });

  res.end();
};

export const conversationList = async (
  ctx: AppContext,
  _req: Request,
  res: Response
) => {
  if (!ctx.user) {
    res.status(401).json({ error: "Sign in to view your conversations." });
    return;
  }

  const chats = await prisma.chat.findMany({
    where: {
      userId: ctx.user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
        },
      },
    },
  });

  res.status(200).json({ data: chats });
};
