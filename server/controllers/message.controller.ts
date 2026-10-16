import { Response } from "express";
import { getPrismaClient } from "../config/database.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { rateLimit } from "../middleware/rate-limit.js";

const MESSAGE_TYPES = new Set(["text", "image", "audio"]);

const MESSAGE_RATE_LIMITER = rateLimit({
  name: "message-send",
  windowMs: 60_000,
  max: 30,
  message: "Trop de messages envoyes. Reessayez dans une minute.",
});

const MESSAGE_CONTENT_MAX = 4000;

/**
 * Liste des conversations privées de l'utilisateur connecté.
 */
export async function listThreads(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de données non connectée.", 503);
    return;
  }

  if (!req.user) {
    sendError(res, "Authentification requise.", 401);
    return;
  }

  try {
    const userId = req.user.id;

    const threads = await prisma.messageThread.findMany({
      where: {
        OR: [{ participantOneId: userId }, { participantTwoId: userId }],
      },
      orderBy: { lastMessageAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    // Récupération des profils des correspondants
    const partnerIds = threads.map((t) =>
      t.participantOneId === userId ? t.participantTwoId : t.participantOneId
    );

    const partners = await prisma.user.findMany({
      where: { id: { in: partnerIds } },
      select: {
        id: true,
        name: true,
        pseudonym: true,
        avatar: true,
        role: true,
        isAnonymous: true,
      },
    });

    const partnerMap = new Map(partners.map((p) => [p.id, p]));

    const formatted = threads.map((t) => {
      const partnerId = t.participantOneId === userId ? t.participantTwoId : t.participantOneId;
      const partner = partnerMap.get(partnerId);
      const lastMsg = t.messages[0];

      return {
        id: t.id,
        partner: {
          id: partnerId,
          name: partner ? (partner.isAnonymous ? "Membre du Cercle" : partner.pseudonym || partner.name) : "Utilisateur",
          avatar: partner && !partner.isAnonymous ? partner.avatar : null,
          role: partner?.role || "member",
        },
        lastMessage: t.lastMessage || (lastMsg ? lastMsg.content : ""),
        lastMessageAt: t.lastMessageAt,
        unreadCount: 0,
      };
    });

    sendSuccess(res, formatted);
  } catch (err) {
    console.error("Erreur listThreads:", err);
    sendError(res, "Impossible de charger vos conversations.", 500);
  }
}

/**
 * Messages d'une conversation ordonnés chronologiquement.
 */
export async function getThreadMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de données non connectée.", 503);
    return;
  }

  if (!req.user) {
    sendError(res, "Authentification requise.", 401);
    return;
  }

  try {
    const { threadId } = req.params;

    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      sendError(res, "Fil de discussion introuvable.", 404);
      return;
    }

    if (thread.participantOneId !== req.user.id && thread.participantTwoId !== req.user.id) {
      sendError(res, "Accès refusé à cette conversation.", 403);
      return;
    }

    const messages = await prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    // Marquer les messages reçus comme lus
    await prisma.message.updateMany({
      where: {
        threadId,
        receiverId: req.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    sendSuccess(
      res,
      messages.map((m) => ({
        id: m.id,
        threadId: m.threadId,
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.content,
        type: m.type,
        mediaUrl: m.mediaUrl,
        audioDuration: m.audioDuration,
        isMine: m.senderId === req.user!.id,
        isRead: m.isRead,
        createdAt: m.createdAt,
      }))
    );
  } catch (err) {
    console.error("Erreur getThreadMessages:", err);
    sendError(res, "Impossible de charger les messages.", 500);
  }
}

/**
 * Envoi d'un message privé.
 */
export async function sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de données non connectée.", 503);
    return;
  }

  if (!req.user) {
    sendError(res, "Authentification requise.", 401);
    return;
  }

  try {
    const { receiverId, content, type = "text", mediaUrl, audioDuration } = req.body;

    if (!receiverId || !content || content.trim().length === 0) {
      sendError(res, "Destinataire et contenu requis.", 400);
      return;
    }

    if (receiverId === req.user.id) {
      sendError(res, "Vous ne pouvez pas vous envoyer un message privé à vous-même.", 400);
      return;
    }

    const cleanType = MESSAGE_TYPES.has(type) ? type : "text";
    const cleanContent = content.trim().slice(0, MESSAGE_CONTENT_MAX);

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, isSuspended: true },
    });

    if (!receiver) {
      sendError(res, "Destinataire introuvable.", 404);
      return;
    }

    if (receiver.isSuspended) {
      sendError(res, "Ce compte est suspendu et ne peut pas recevoir de messages.", 403, "FORBIDDEN_RESOURCE");
      return;
    }

    const senderId = req.user.id;
    const [pOne, pTwo] = [senderId, receiverId].sort();
    const canonicalKey = `${pOne}:${pTwo}`;

    const message = await prisma.$transaction(async (tx) => {
      const thread = await tx.messageThread.upsert({
        where: { canonicalParticipantKey: canonicalKey },
        create: {
          canonicalParticipantKey: canonicalKey,
          participantOneId: pOne,
          participantTwoId: pTwo,
          lastMessage: cleanContent.slice(0, 150),
          lastMessageAt: new Date(),
        },
        update: {
          lastMessage: cleanContent.slice(0, 150),
          lastMessageAt: new Date(),
        },
      });

      const newMsg = await tx.message.create({
        data: {
          threadId: thread.id,
          senderId,
          receiverId,
          content: cleanContent,
          type: cleanType,
          mediaUrl: mediaUrl || null,
          audioDuration: audioDuration ? Number(audioDuration) : null,
          isRead: false,
        },
      });

      return { thread, message: newMsg };
    });

    sendSuccess(res, message.message, 201);
  } catch (err) {
    console.error("Erreur sendMessage:", err);
    sendError(res, "Impossible d'envoyer le message.", 500);
  }
}
