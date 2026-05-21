import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import prisma from "../utils/prisma";
import { AppError } from "../middleware/errorHandler";

export async function listConversations(req: AuthRequest, res: Response) {
  if (!req.userId) throw new AppError(401, "Unauthorized");

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ user1Id: req.userId }, { user2Id: req.userId }] },
    orderBy: { lastMessageAt: "desc" },
    include: {
      user1: { select: { id: true, username: true, avatarUrl: true } },
      user2: { select: { id: true, username: true, avatarUrl: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, senderId: true, read: true },
      },
    },
  });

  const withUnread = conversations.map((c) => {
    const other = c.user1Id === req.userId ? c.user2 : c.user1;
    const lastMsg = c.messages[0] || null;
    const unreadCount = c.messages.filter((m) => !m.read && m.senderId !== req.userId).length;
    return { id: c.id, other, lastMessage: lastMsg, unreadCount, lastMessageAt: c.lastMessageAt };
  });

  res.json(withUnread);
}

export async function getOrCreateConversation(req: AuthRequest, res: Response) {
  if (!req.userId) throw new AppError(401, "Unauthorized");
  const { otherUserId } = req.params;
  if (otherUserId === req.userId) throw new AppError(400, "Cannot message yourself");

  const other = await prisma.user.findUnique({ where: { id: otherUserId }, select: { id: true } });
  if (!other) throw new AppError(404, "User not found");

  // user1Id is always the lesser id for uniqueness
  const [u1, u2] = [req.userId, otherUserId].sort();

  const conversation = await prisma.conversation.upsert({
    where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
    create: { user1Id: u1, user2Id: u2 },
    update: {},
    include: {
      user1: { select: { id: true, username: true, avatarUrl: true } },
      user2: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  res.json(conversation);
}

export async function getMessages(req: AuthRequest, res: Response) {
  if (!req.userId) throw new AppError(401, "Unauthorized");
  const { conversationId } = req.params;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const cursor = req.query.cursor as string | undefined;

  const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!convo) throw new AppError(404, "Conversation not found");
  if (convo.user1Id !== req.userId && convo.user2Id !== req.userId) throw new AppError(403, "Forbidden");

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { sender: { select: { id: true, username: true, avatarUrl: true } } },
  });

  const hasMore = messages.length > limit;
  const result = hasMore ? messages.slice(0, limit) : messages;

  // Mark messages from other user as read
  await prisma.message.updateMany({
    where: { conversationId, senderId: { not: req.userId }, read: false },
    data: { read: true },
  });

  res.json({ messages: result.reverse(), nextCursor: hasMore ? result[0]?.id : null });
}

export async function sendMessage(req: AuthRequest, res: Response) {
  if (!req.userId) throw new AppError(401, "Unauthorized");
  const { conversationId } = req.params;
  const { body } = req.body;
  if (!body?.trim()) throw new AppError(400, "Message body required");
  if (body.length > 2000) throw new AppError(400, "Message too long (max 2000 chars)");

  const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!convo) throw new AppError(404, "Conversation not found");
  if (convo.user1Id !== req.userId && convo.user2Id !== req.userId) throw new AppError(403, "Forbidden");

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, senderId: req.userId, body: body.trim() },
      include: { sender: { select: { id: true, username: true, avatarUrl: true } } },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  const receiverId = convo.user1Id === req.userId ? convo.user2Id : convo.user1Id;

  // Emit real-time message via Socket.io
  const io = req.app.get("io");
  if (io) {
    io.to(`user-${receiverId}`).emit("new_message", {
      conversationId,
      message,
    });
  }

  res.status(201).json(message);
}

export async function getUnreadCount(req: AuthRequest, res: Response) {
  if (!req.userId) throw new AppError(401, "Unauthorized");

  const count = await prisma.message.count({
    where: {
      senderId: { not: req.userId },
      read: false,
      conversation: { OR: [{ user1Id: req.userId }, { user2Id: req.userId }] },
    },
  });

  res.json({ unread: count });
}
