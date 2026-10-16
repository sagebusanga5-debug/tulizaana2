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

/** Types de publication reconnus par le modele. Liste fermee cote serveur. */
const POST_TYPES = new Set([
  "discussion",
  "question",
  "announcement",
  "campaign_share",
  "testimony",
]);

/**
 * Liste des publications d'un cercle avec pagination et respect de l'anonymat.
 */
export async function listPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de données non connectée.", 503);
    return;
  }

  try {
    const { communityId, type, tag, page = "1", limit = "20" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const take = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * take;

    // Chantier 5 - la portee de lecture est decidee par l'adhesion en base.
    // Un `communityId` fourni en query n'est plus un acces : il est valide
    // contre la portee reelle de l'appelant, et un cercle prive ou suspendu
    // auquel il n'appartient pas repond 404 sans reveler son existence.
    const whereClause: Record<string, unknown> = {
      community: await buildReadableCommunityFilter(prisma, req.user?.id),
    };
    if (communityId && typeof communityId === "string") {
      const readable = await resolveReadableCommunityId(prisma, req.user?.id, communityId);
      if (!readable) {
        sendError(res, "Cercle introuvable.", 404, "FORBIDDEN_RESOURCE");
        return;
      }
      whereClause.communityId = readable;
    }
    if (type && typeof type === "string") {
      whereClause.type = type;
    }
    if (tag && typeof tag === "string") {
      whereClause.tags = { has: tag.slice(0, 40) };
    }

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
        include: {
          media: {
            orderBy: { position: "asc" },
          },
          community: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
            },
          },
          _count: {
            select: {
              comments: true,
              reactions: true,
            },
          },
          reactions: req.user
            ? {
                where: { userId: req.user.id },
                select: { type: true },
              }
            : false,
        },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        take,
        skip,
      }),
      prisma.post.count({ where: whereClause }),
    ]);

    const formatted = posts.map((post) => {
      const isAnon = post.isAnonymous;
      return {
        id: post.id,
        communityId: post.communityId,
        communityName: post.community.name,
        communitySlug: post.community.slug,
        authorId: isAnon ? null : post.authorId,
        authorName: isAnon ? "Membre du Cercle" : post.authorName,
        authorAvatar: isAnon ? null : post.authorAvatar,
        type: post.type,
        title: post.title,
        content: post.content,
        tags: post.tags,
        isAnonymous: post.isAnonymous,
        isPinned: post.isPinned,
        media: post.media.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.secureUrl || m.url,
          thumbnailUrl: m.thumbnailUrl,
        })),
        reactions: {
          support: post.reactionsSupport,
          understand: post.reactionsUnderstand,
          courage: post.reactionsCourage,
          bravo: post.reactionsBravo,
          total: post.reactionsSupport + post.reactionsUnderstand + post.reactionsCourage + post.reactionsBravo,
          myReaction: post.reactions && post.reactions.length > 0 ? post.reactions[0].type : null,
        },
        commentsCount: post._count.comments,
        createdAt: post.createdAt,
      };
    });

    sendSuccess(res, formatted, 200, {
      total: totalCount,
      page: pageNum,
      limit: take,
      hasMore: skip + posts.length < totalCount,
    });
  } catch (err) {
    console.error("Erreur listPosts:", err);
    sendError(res, "Impossible de charger les publications.", 500);
  }
}

/**
 * Création d'une nouvelle publication d'entraide.
 */
export async function createPost(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de données non connectée.", 503);
    return;
  }

  if (!req.user) {
    sendError(res, "Vous devez être connecté pour publier un message.", 401);
    return;
  }

  try {
    const { communityId, content, title, type = "discussion", tags = [], isAnonymous = false, media = [] } = req.body;

    if (!communityId || !content || content.trim().length === 0) {
      sendError(res, "Le cercle d'entraide et le contenu sont obligatoires.", 400);
      return;
    }

    // Chantier 5 - l'existence du cercle ne vaut plus autorisation. L'appelant
    // doit etre membre actif du cercle vise, et le cercle doit etre `active`.
    const access = await resolveWritableCommunity(prisma, req.user.id, communityId);
    if (!access.ok || !access.communityId) {
      const denied = describeWriteAccess(access.reason ?? "NOT_FOUND");
      sendError(res, denied.message, denied.status, "FORBIDDEN_RESOURCE");
      return;
    }

    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          communityId: access.communityId,
          // Chantier 5 - l'anonymat n'etait qu'un masque d'affichage : la ligne
          // conservait une cle étrangère vers l'auteur. Une publication anonyme
          // ne porte plus d'identifiant d'auteur en base.
          authorId: isAnonymous ? null : req.user!.id,
          authorName: req.user!.name || "Membre",
          authorAvatar: null,
          title: title ? title.trim().slice(0, 200) : null,
          content: content.trim().slice(0, 8000),
          type: POST_TYPES.has(type) ? type : "discussion",
          tags: Array.isArray(tags) ? tags.filter((t: unknown) => typeof t === "string").slice(0, 10) : [],
          isAnonymous: Boolean(isAnonymous),
          media: {
            create: Array.isArray(media)
              ? media.map((m: { type: string; url: string; secureUrl?: string; publicId?: string }, index: number) => ({
                  type: m.type || "image",
                  url: m.url,
                  secureUrl: m.secureUrl || m.url,
                  publicId: m.publicId,
                  position: index,
                }))
              : [],
          },
        },
        include: {
          media: true,
          community: true,
        },
      });

      // Attribution de 10 points de solidarité à l'auteur
      await tx.user.update({
        where: { id: req.user!.id },
        data: { points: { increment: 10 } },
      });

      return created;
    });

    sendSuccess(res, post, 201);
  } catch (err) {
    console.error("Erreur createPost:", err);
    sendError(res, "Erreur lors de la publication.", 500);
  }
}

/**
 * Réaction d'empathie (Soutien, Je comprends, Courage, Bravo).
 */
export async function reactToPost(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de données non connectée.", 503);
    return;
  }

  if (!req.user) {
    sendError(res, "Connexion requise pour soutenir un membre.", 401);
    return;
  }

  try {
    const { id } = req.params;
    const { type } = req.body; // 'support' | 'understand' | 'courage' | 'bravo'

    const validTypes = ["support", "understand", "courage", "bravo"];
    if (!validTypes.includes(type)) {
      sendError(res, "Type de réaction non valide.", 400);
      return;
    }

    // Chantier 5 - une reaction modifie les compteurs d'une publication. Sans
    // relecture de la portee du cercle, n'importe quel compte authentifie
    // pouvait gonfler les compteurs d'une publication privee en changeant `:id`.
    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true, communityId: true },
    });
    if (!post) {
      sendError(res, "Publication introuvable.", 404);
      return;
    }

    const readable = await resolveReadableCommunityId(prisma, req.user.id, post.communityId);
    if (!readable) {
      sendError(res, "Publication introuvable.", 404, "FORBIDDEN_RESOURCE");
      return;
    }

    const fieldMap: Record<string, "reactionsSupport" | "reactionsUnderstand" | "reactionsCourage" | "reactionsBravo"> = {
      support: "reactionsSupport",
      understand: "reactionsUnderstand",
      courage: "reactionsCourage",
      bravo: "reactionsBravo",
    };

    const targetField = fieldMap[type];

    // Vérifier si une réaction existe déjà
    const existing = await prisma.reaction.findUnique({
      where: {
        postId_userId_type: {
          postId: id,
          userId: req.user.id,
          type,
        },
      },
    });

    if (existing) {
      // Toggle off : suppression de la réaction
      await prisma.$transaction([
        prisma.reaction.delete({ where: { id: existing.id } }),
        prisma.post.update({
          where: { id },
          data: { [targetField]: { decrement: 1 } },
        }),
      ]);
      sendSuccess(res, { toggled: "removed", type });
      return;
    }

    // Ajout de la réaction
    await prisma.$transaction([
      prisma.reaction.create({
        data: {
          postId: id,
          userId: req.user.id,
          type,
        },
      }),
      prisma.post.update({
        where: { id },
        data: { [targetField]: { increment: 1 } },
      }),
    ]);

    sendSuccess(res, { toggled: "added", type });
  } catch (err) {
    console.error("Erreur reactToPost:", err);
    sendError(res, "Erreur lors de l'enregistrement de la réaction.", 500);
  }
}

/**
 * Ajout d'un commentaire bienveillant.
 */
export async function addComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de données non connectée.", 503);
    return;
  }

  if (!req.user) {
    sendError(res, "Connexion requise pour commenter.", 401);
    return;
  }

  try {
    const { id } = req.params;
    const { content, isAnonymous = false } = req.body;

    if (!content || content.trim().length === 0) {
      sendError(res, "Le contenu du commentaire ne peut pas être vide.", 400);
      return;
    }

    // Chantier 5 - la publication ciblee n'etait meme pas chargee : un
    // commentaire pouvait etre rattache a n'importe quel `postId`, y compris
    // dans un cercle suspendu. La portee du cercle conditionne desormais
    // l'ecriture.
    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, communityId: true },
    });
    if (!post) {
      sendError(res, "Publication introuvable.", 404);
      return;
    }

    const access = await resolveWritableCommunity(prisma, req.user.id, post.communityId);
    if (!access.ok) {
      const denied = describeWriteAccess(access.reason ?? "NOT_FOUND");
      sendError(res, denied.message, denied.status, "FORBIDDEN_RESOURCE");
      return;
    }

    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: {
          postId: post.id,
          // Meme regle que les publications : un commentaire anonyme ne porte
          // plus de cle etrangere vers son auteur.
          authorId: isAnonymous ? null : req.user!.id,
          authorName: req.user!.name || "Membre",
          content: content.trim().slice(0, 4000),
          isAnonymous: Boolean(isAnonymous),
        },
      });

      // 5 points pour un commentaire de soutien
      await tx.user.update({
        where: { id: req.user!.id },
        data: { points: { increment: 5 } },
      });

      return created;
    });

    sendSuccess(res, comment, 201);
  } catch (err) {
    console.error("Erreur addComment:", err);
    sendError(res, "Erreur lors de l'ajout du commentaire.", 500);
  }
}

/**
 * Récupération des commentaires d'un post.
 */
export async function listComments(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de données non connectée.", 503);
    return;
  }

  try {
    // Chantier 5 - la lecture des commentaires herite de la portee du cercle.
    // `take` evite qu'une publication ramene un nombre non borne de reponses.
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, communityId: true },
    });
    if (!post) {
      sendError(res, "Publication introuvable.", 404);
      return;
    }

    const readable = await resolveReadableCommunityId(prisma, req.user?.id, post.communityId);
    if (!readable) {
      sendError(res, "Publication introuvable.", 404, "FORBIDDEN_RESOURCE");
      return;
    }

    const comments = await prisma.comment.findMany({
      where: { postId: post.id },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: {
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
    });

    const formatted = comments.map((c) => ({
      id: c.id,
      postId: c.postId,
      authorId: c.isAnonymous ? null : c.authorId,
      authorName: c.isAnonymous ? "Membre du Cercle" : (c.author?.pseudonym || c.authorName),
      authorAvatar: c.isAnonymous ? null : c.author?.avatar,
      authorRole: c.author?.role || "member",
      content: c.content,
      isAnonymous: c.isAnonymous,
      createdAt: c.createdAt,
    }));

    sendSuccess(res, formatted);
  } catch (err) {
    console.error("Erreur listComments:", err);
    sendError(res, "Impossible de charger les commentaires.", 500);
  }
}
