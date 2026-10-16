import { Request, Response } from "express";
import crypto from "crypto";
import { getPrismaClient } from "../config/database.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";
import {
  verifyAndResolveInvitationLink,
  verifyAndResolveInvitationByCode,
  consumeInvitationCodeTx,
  consumeInvitationLinkTx,
} from "../services/invitation.service.js";

/**
 * Vérifie la validité d'un code d'invitation avant soumission du formulaire.
 */
export async function verifyInvitationCode(req: Request, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de données non connectée.", 503);
    return;
  }

  try {
    const { code } = req.body;
    if (!code || typeof code !== "string") {
      sendError(res, "Veuillez renseigner un code d'invitation.", 400);
      return;
    }

    const cleanCode = code.trim().toUpperCase();
    const invitation = await prisma.invitation.findUnique({
      where: { code: cleanCode },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            category: true,
            icon: true,
            rules: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            acronym: true,
            logo: true,
          },
        },
      },
    });

    if (!invitation) {
      sendError(res, "Code d'invitation invalide ou non reconnu.", 404);
      return;
    }

    if (invitation.status !== "active" || invitation.expiresAt < new Date()) {
      sendError(res, "Ce code d'invitation a expiré.", 400);
      return;
    }

    if (invitation.currentUses >= invitation.maxUses) {
      sendError(res, "Ce code d'invitation a atteint son quota d'utilisations.", 400);
      return;
    }

    sendSuccess(res, {
      valid: true,
      community: invitation.community,
      organization: invitation.organization,
      expiresAt: invitation.expiresAt,
    });
  } catch (err) {
    console.error("Erreur verifyInvitationCode:", err);
    sendError(res, "Impossible de vérifier le code d'invitation.", 500);
  }
}

/**
 * Soumet une demande d'adhésion pour un candidat sans code.
 */
export async function requestInvitation(req: Request, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de données non connectée.", 503);
    return;
  }

  try {
    const {
      candidateName,
      contactEmail,
      contactPhone,
      situation,
      motivation,
      communityId,
    } = req.body;

    if (!candidateName || !contactPhone || !situation || !motivation || !communityId) {
      sendError(res, "Tous les champs obligatoires doivent être renseignés.", 400);
      return;
    }

    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: {
        id: true,
        organizationId: true,
        status: true,
        organization: { select: { status: true } },
      },
    });

    if (!community || community.status !== "active" || community.organization.status !== "approved") {
      sendError(res, "Cercle selectionne introuvable.", 404, "FORBIDDEN_RESOURCE");
      return;
    }
    const request = await prisma.invitationRequest.create({
      data: {
        candidateName: candidateName.trim(),
        contactEmail: contactEmail ? contactEmail.trim().toLowerCase() : "",
        contactPhone: contactPhone.trim(),
        situation: situation.trim(),
        motivation: motivation.trim(),
        communityId: community.id,
        organizationId: community.organizationId,
        status: "pending",
      },
    });

    sendSuccess(
      res,
      {
        message: "Votre demande a été transmise aux coordinateurs avec succès. Vous recevrez un SMS ou un email dès sa validation.",
        requestId: request.id,
      },
      201
    );
  } catch (err) {
    console.error("Erreur requestInvitation:", err);
    sendError(res, "Erreur lors du dépôt de la demande.", 500);
  }
}

/**
 * Génère un nouveau code d'invitation (réservé aux coordinateurs/admins).
 */
export async function generateInvitation(req: AuthenticatedRequest, res: Response): Promise<void> {
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
    const { communityId, organizationId, prefix = "TULIZ", maxUses = 1, validityDays = 30 } = req.body;

    if (!communityId || !organizationId) {
      sendError(res, "Cercle et organisation obligatoires.", 400);
      return;
    }

    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: { id: true, organizationId: true, status: true },
    });

    if (!community || community.status !== "active" || community.organizationId !== organizationId) {
      sendError(res, "Cercle introuvable pour cette organisation.", 404, "FORBIDDEN_RESOURCE");
      return;
    }

    // Génération d'un code lisible et unique ex: TULIZ-8F2A
    const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
    const cleanPrefix =
      typeof prefix === "string" && /^[A-Z0-9-]{3,16}$/i.test(prefix.trim())
        ? prefix.trim().toUpperCase()
        : "TULIZ";
    const code = `${cleanPrefix}-${randomHex}`;

    const expiresAt = new Date();
    const cleanValidityDays = Math.min(365, Math.max(1, Number(validityDays) || 30));
    const cleanMaxUses = Math.min(500, Math.max(1, Number(maxUses) || 1));
    expiresAt.setDate(expiresAt.getDate() + cleanValidityDays);

    const invitation = await prisma.invitation.create({
      data: {
        code,
        communityId: community.id,
        organizationId: community.organizationId,
        maxUses: cleanMaxUses,
        currentUses: 0,
        status: "active",
        expiresAt,
        createdBy: req.user.id,
      },
      include: {
        community: { select: { name: true } },
      },
    });

    sendSuccess(res, invitation, 201);
  } catch (err) {
    console.error("Erreur generateInvitation:", err);
    sendError(res, "Erreur lors de la génération du code.", 500);
  }
}

/**
 * Liste des demandes d'adhésion pour les coordinateurs d'ONG et administrateurs.
 */
export async function listInvitationRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de données non connectée.", 503);
    return;
  }

  if (!req.user || !["superadmin", "partner_admin", "admin", "moderator"].includes(req.user.role)) {
    sendError(res, "Accès réservé aux coordinateurs d'organisations partenaires.", 403);
    return;
  }

  try {
    const { status, communityId, organizationId } = req.query;

    const requests = await prisma.invitationRequest.findMany({
      where: {
        ...(status && typeof status === "string" && { status }),
        ...(communityId && typeof communityId === "string" && { communityId }),
        ...(organizationId && typeof organizationId === "string" && { organizationId }),
      },
      include: {
        community: { select: { id: true, name: true, slug: true } },
        organization: { select: { id: true, name: true, acronym: true, logo: true } },
      },
      orderBy: { requestedAt: "desc" },
    });

    sendSuccess(res, requests);
  } catch (err) {
    console.error("Erreur listInvitationRequests:", err);
    sendError(res, "Impossible de charger les demandes d'adhésion.", 500);
  }
}

/**
 * Traitement d'une demande d'adhésion (Accepter avec génération de code ou Rejeter).
 */
export async function handleInvitationRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de données non connectée.", 503);
    return;
  }

  if (!req.user || !["superadmin", "partner_admin", "admin"].includes(req.user.role)) {
    sendError(res, "Accès réservé aux coordinateurs.", 403);
    return;
  }

  try {
    const { id } = req.params;
    const { status, dispatchedVia } = req.body; // status: 'accepted' | 'rejected'

    if (!["accepted", "rejected"].includes(status)) {
      sendError(res, "Statut invalide ('accepted' ou 'rejected' attendu).", 400);
      return;
    }

    const request = await prisma.invitationRequest.findUnique({
      where: { id },
    });

    if (!request) {
      sendError(res, "Demande d'adhésion introuvable.", 404);
      return;
    }

    if (status === "accepted") {
      // Génération automatique d'un code d'invitation à usage unique valable 30 jours
      const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
      const code = `INVIT-${randomHex}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const [updatedRequest, newInvitation] = await prisma.$transaction([
        prisma.invitation.create({
          data: {
            code,
            communityId: request.communityId,
            organizationId: request.organizationId,
            maxUses: 1,
            currentUses: 0,
            status: "active",
            expiresAt,
            createdBy: req.user.id,
          },
        }),
        prisma.invitationRequest.update({
          where: { id },
          data: {
            status: "accepted",
            assignedCode: code,
            dispatchedVia: dispatchedVia || "whatsapp",
            dispatchedAt: new Date(),
          },
          include: {
            community: { select: { name: true } },
          },
        }),
      ]);

      sendSuccess(res, {
        message: `Demande acceptée ! Le code généré est ${code}.`,
        request: updatedRequest,
        code,
      });
      return;
    }

    // Rejet
    const updated = await prisma.invitationRequest.update({
      where: { id },
      data: { status: "rejected" },
    });

    sendSuccess(res, { message: "Demande d'adhésion rejetée.", request: updated });
  } catch (err) {
    console.error("Erreur handleInvitationRequest:", err);
    sendError(res, "Erreur lors du traitement de la demande.", 500);
  }
}

/**
 * Vérifie un lien d'invitation direct (public).
 */
export async function verifyInvitationLink(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.body;
    if (!token || typeof token !== "string") {
      sendError(res, "Token d'invitation requis.", 400);
      return;
    }

    const result = await verifyAndResolveInvitationLink(token.trim());
    if (result.valid === false) {
      sendError(res, result.error, result.status as number);
      return;
    }

    const { link, organization, community, campaign } = result;
    sendSuccess(res, {
      valid: true,
      type: link.type,
      targetId: link.targetId,
      organization,
      community,
      campaign,
      expiresAt: link.expiresAt,
    });
  } catch (err) {
    console.error("Erreur verifyInvitationLink:", err);
    sendError(res, "Impossible de vérifier le lien d'invitation.", 500);
  }
}

/**
 * Accepte un code d'invitation et adhère à la communauté (utilisateur authentifié).
 */
export async function acceptInvitationCode(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma || !req.user) {
    sendError(res, "Authentification requise.", 401);
    return;
  }

  try {
    const { code } = req.body;
    if (!code || typeof code !== "string") {
      sendError(res, "Code d'invitation requis.", 400);
      return;
    }

    const verification = await verifyAndResolveInvitationByCode(code);
    if (verification.valid === false) {
      sendError(res, verification.error, verification.status as number);
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: verification.community.id,
            userId: req.user!.id,
          },
        },
      });

      if (!existing) {
        await tx.communityMember.create({
          data: {
            communityId: verification.community.id,
            userId: req.user!.id,
            role: "member",
            status: "active",
          },
        });
      }

      await consumeInvitationCodeTx(tx, verification.invitation.id, verification.invitation.maxUses);

      return { joined: !existing };
    });

    sendSuccess(res, {
      message: result.joined ? "Adhésion enregistrée." : "Adhésion déjà active.",
      community: verification.community,
      organization: verification.organization,
    });
  } catch (err) {
    console.error("Erreur acceptInvitationCode:", err);
    sendError(res, "Impossible d'accepter le code d'invitation.", 500);
  }
}

/**
 * Accepte un lien d'invitation direct (utilisateur authentifié).
 */
export async function acceptInvitationLink(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma || !req.user) {
    sendError(res, "Authentification requise.", 401);
    return;
  }

  try {
    const { token } = req.body;
    if (!token || typeof token !== "string") {
      sendError(res, "Token d'invitation requis.", 400);
      return;
    }

    const verification = await verifyAndResolveInvitationLink(token.trim());
    if (verification.valid === false) {
      sendError(res, verification.error, verification.status as number);
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      if (verification.link.type === "community" && verification.community) {
        const existing = await tx.communityMember.findUnique({
          where: {
            communityId_userId: {
              communityId: verification.community.id,
              userId: req.user!.id,
            },
          },
        });

        if (!existing) {
          await tx.communityMember.create({
            data: {
              communityId: verification.community.id,
              userId: req.user!.id,
              role: "member",
              status: "active",
            },
          });
        }
      }

      await consumeInvitationLinkTx(tx, verification.link.id, verification.link.maxUses);

      return { joined: true };
    });

    sendSuccess(res, {
      message: "Lien d'invitation accepté.",
      type: verification.link.type,
      community: verification.community,
      campaign: verification.campaign,
      organization: verification.organization,
    });
  } catch (err) {
    console.error("Erreur acceptInvitationLink:", err);
    sendError(res, "Impossible d'accepter le lien d'invitation.", 500);
  }
}

/**
 * Crée un lien d'invitation direct (admin/partner).
 */
export async function createInvitationLink(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma || !req.user) {
    sendError(res, "Authentification requise.", 401);
    return;
  }

  try {
    const { type, targetId, organizationId, communityId, campaignId, maxUses = 1, validityDays = 30 } = req.body;

    if (!["community", "campaign"].includes(type)) {
      sendError(res, "Type de lien invalide.", 400);
      return;
    }

    if (!organizationId || !targetId) {
      sendError(res, "Organisation et cible requises.", 400);
      return;
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, status: true },
    });

    if (!organization || organization.status !== "approved") {
      sendError(res, "Organisation introuvable ou non approuvée.", 404, "FORBIDDEN_RESOURCE");
      return;
    }

    if (type === "community" && communityId) {
      const community = await prisma.community.findUnique({
        where: { id: communityId },
        select: { id: true, organizationId: true, status: true },
      });

      if (!community || community.organizationId !== organizationId || community.status !== "active") {
        sendError(res, "Communauté introuvable pour cette organisation.", 404, "FORBIDDEN_RESOURCE");
        return;
      }
    }

    if (type === "campaign" && campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { id: true, organizationId: true, status: true },
      });

      if (!campaign || campaign.organizationId !== organizationId || campaign.status !== "active") {
        sendError(res, "Campagne introuvable pour cette organisation.", 404, "FORBIDDEN_RESOURCE");
        return;
      }
    }

    const token = crypto.randomBytes(16).toString("base64url");
    const expiresAt = new Date();
    const cleanValidityDays = Math.min(365, Math.max(1, Number(validityDays) || 30));
    const cleanMaxUses = Math.min(500, Math.max(1, Number(maxUses) || 1));
    expiresAt.setDate(expiresAt.getDate() + cleanValidityDays);

    const link = await prisma.invitationLink.create({
      data: {
        token,
        type,
        targetId,
        organizationId,
        communityId: type === "community" ? communityId : null,
        campaignId: type === "campaign" ? campaignId : null,
        maxUses: cleanMaxUses,
        currentUses: 0,
        status: "active",
        expiresAt,
        createdBy: req.user.id,
      },
      select: {
        id: true,
        token: true,
        type: true,
        targetId: true,
        organizationId: true,
        communityId: true,
        campaignId: true,
        maxUses: true,
        currentUses: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    sendSuccess(res, link, 201);
  } catch (err) {
    console.error("Erreur createInvitationLink:", err);
    sendError(res, "Impossible de créer le lien d'invitation.", 500);
  }
}

