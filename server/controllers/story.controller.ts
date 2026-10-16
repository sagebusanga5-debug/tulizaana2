import { Response } from "express";
import { getPrismaClient } from "../config/database.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";
import {
  buildReadableCommunityFilter,
  describeWriteAccess,
  resolveReadableCommunityId,
  resolveWritableCommunity,
} from "../services/community-access.service.js";

/** Types de media reconnus par le modele. Liste fermee cote serveur. */
const STORY_MEDIA_TYPES = new Set(["image", "audio"]);

/**
 * Liste des récits et stories de résilience (actives ou mises en avant).
 */
export async function listStories(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de données non connectée.", 503);
    return;
  }

  try {
    const { communityId } = req.query;

    // Chantier 5 - la portee de lecture vient de l'adhesion, pas du parametre.
    const communityFilter =
      communityId && typeof communityId === "string"
        ? await (async () => {
            const readable = await resolveReadableCommunityId(
              prisma,
              req.user?.id,
              communityId
            );
            if (!readable) return null;
            return { id: readable };
          })()
        : await buildReadableCommunityFilter(prisma, req.user?.id);

    if (!communityFilter) {
      sendError(res, "Cercle introuvable.", 404, "FORBIDDEN_RESOURCE");
      return;
    }

    const stories = await prisma.story.findMany({
      where: {
        community: communityFilter,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      take: 40,
      include: {
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            pseudonym: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    });

    const formatted = stories.map((s) => ({
      id: s.id,
      communityId: s.communityId,
      communityName: s.community.name,
      communitySlug: s.community.slug,
      authorName: s.author?.pseudonym || s.authorName || "Membre Résilient",
      authorAvatar: s.author?.avatar || s.authorAvatar,
      caption: s.caption,
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType,
      audioDuration: s.audioDuration,
      isVoiceNote: s.isVoiceNote,
      isFeatured: s.isFeatured,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));

    sendSuccess(res, formatted);
  } catch (err) {
    console.error("Erreur listStories:", err);
    sendError(res, "Impossible de récupérer les stories.", 500);
  }
}

/**
 * Publication d'une nouvelle story (texte, photo ou note vocale).
 */
export async function createStory(req: AuthenticatedRequest, res: Response): Promise<void> {
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
    const {
      communityId,
      caption,
      mediaUrl,
      mediaType = "image",
      audioDuration,
      isVoiceNote = false,
      hoursValidity = 48,
    } = req.body;

    if (!communityId || !caption || caption.trim().length === 0) {
      sendError(res, "Le cercle d'entraide et une légende sont requis.", 400);
      return;
    }

    // Chantier 5 - aucune verification d'existence n'etait faite : un `communityId`
    // quelconque suffisait. L'appelant doit etre membre actif du cercle.
    const access = await resolveWritableCommunity(prisma, req.user.id, communityId);
    if (!access.ok || !access.communityId) {
      const denied = describeWriteAccess(access.reason ?? "NOT_FOUND");
      sendError(res, denied.message, denied.status, "FORBIDDEN_RESOURCE");
      return;
    }

    // `hoursValidity` etaitborne par aucune limite : `1e9` produisait une
    // story qui n'expire jamais.
    const validityHours = Math.min(
      168,
      Math.max(1, Math.trunc(Number(hoursValidity)) || 48)
    );
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + validityHours);

    const story = await prisma.$transaction(async (tx) => {
      const created = await tx.story.create({
        data: {
          communityId: access.communityId,
          authorId: req.user!.id,
          authorName: req.user!.pseudonym || req.user!.name || "Membre",
          authorAvatar: req.user!.avatar,
          caption: caption.trim().slice(0, 600),
          mediaUrl: mediaUrl || null,
          mediaType: STORY_MEDIA_TYPES.has(mediaType) ? mediaType : "image",
          audioDuration: Number.isFinite(Number(audioDuration))
            ? Math.max(0, Number(audioDuration))
            : null,
          isVoiceNote: Boolean(isVoiceNote),
          expiresAt,
        },
        include: {
          community: { select: { name: true } },
        },
      });

      // Bonus points de solidarité (+10 points)
      await tx.user.update({
        where: { id: req.user!.id },
        data: { points: { increment: 10 } },
      });

      return created;
    });

    sendSuccess(res, story, 201);
  } catch (err) {
    console.error("Erreur createStory:", err);
    sendError(res, "Erreur lors de la publication du récit.", 500);
  }
}
