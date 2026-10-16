import { getPrismaClient } from "../config/database.js";

/**
 * Centralise la vérification et la consommation d'invitations.
 *
 * Règles :
 * - code/lien invalide -> 404
 * - expiré / épuisé / révoqué -> 400
 * - organisation/communauté inactive -> 403
 * - consommation atomique via transaction
 */

export type InvitationVerificationResult =
  | { valid: true; invitation: any; organization: any; community: any }
  | { valid: false; status: number; error: string };

export type InvitationLinkVerificationResult =
  | { valid: true; link: any; organization: any; community: any; campaign: any }
  | { valid: false; status: number; error: string };

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function verifyAndResolveInvitationByCode(code: string): Promise<InvitationVerificationResult> {
  const prisma = getPrismaClient();
  if (!prisma) {
    return { valid: false, status: 503, error: "Base de données non connectée." };
  }

  const cleanCode = normalizeCode(code);
  const invitation = await prisma.invitation.findUnique({
    where: { code: cleanCode },
    include: {
      community: { select: { id: true, name: true, slug: true, description: true, category: true, icon: true, rules: true, status: true } },
      organization: { select: { id: true, name: true, acronym: true, logo: true, status: true } },
    },
  });

  if (!invitation) {
    return { valid: false, status: 404, error: "Code d'invitation invalide ou non reconnu." };
  }

  if (invitation.status !== "active" || invitation.expiresAt < new Date()) {
    return { valid: false, status: 400, error: "Ce code d'invitation a expiré." };
  }

  if (invitation.currentUses >= invitation.maxUses) {
    return { valid: false, status: 400, error: "Ce code d'invitation a atteint son quota d'utilisations." };
  }

  if (invitation.community.status !== "active" || invitation.organization.status !== "approved") {
    return { valid: false, status: 403, error: "Ce code d'invitation ne donne plus accès à cette communauté." };
  }

  return {
    valid: true,
    invitation,
    organization: invitation.organization,
    community: invitation.community,
  };
}

export async function verifyAndResolveInvitationLink(token: string): Promise<InvitationLinkVerificationResult> {
  const prisma = getPrismaClient();
  if (!prisma) {
    return { valid: false, status: 503, error: "Base de données non connectée." };
  }

  const cleanToken = token.trim();
  const link = await prisma.invitationLink.findUnique({
    where: { token: cleanToken },
    include: {
      organization: { select: { id: true, name: true, acronym: true, logo: true, status: true } },
      community: { select: { id: true, name: true, slug: true, description: true, category: true, icon: true, rules: true, status: true } },
      campaign: { select: { id: true, title: true, description: true, status: true, communityId: true } },
    },
  });

  if (!link) {
    return { valid: false, status: 404, error: "Lien d'invitation invalide ou introuvable." };
  }

  if (link.status !== "active" || link.expiresAt < new Date()) {
    return { valid: false, status: 400, error: "Ce lien d'invitation a expiré." };
  }

  if (link.currentUses >= link.maxUses) {
    return { valid: false, status: 400, error: "Ce lien d'invitation a atteint son quota d'utilisations." };
  }

  if (link.organization.status !== "approved") {
    return { valid: false, status: 403, error: "Ce lien d'invitation ne donne plus accès à cette organisation." };
  }

  if (link.type === "community" && link.community && link.community.status !== "active") {
    return { valid: false, status: 403, error: "Ce lien d'invitation ne donne plus accès à cette communauté." };
  }

  if (link.type === "campaign" && link.campaign && link.campaign.status !== "active") {
    return { valid: false, status: 403, error: "Ce lien d'invitation ne donne plus accès à cette campagne." };
  }

  return {
    valid: true,
    link,
    organization: link.organization,
    community: link.community,
    campaign: link.campaign,
  };
}

export async function consumeInvitationCodeTx(tx: any, invitationId: string, maxUses: number) {
  const nextUsageCount = maxUses + 1;
  await tx.invitation.update({
    where: { id: invitationId },
    data: {
      currentUses: { increment: 1 },
      status: nextUsageCount >= maxUses ? "expired" : "active",
    },
  });
}

export async function consumeInvitationLinkTx(tx: any, linkId: string, maxUses: number) {
  const nextUsageCount = maxUses + 1;
  await tx.invitationLink.update({
    where: { id: linkId },
    data: {
      currentUses: { increment: 1 },
      status: nextUsageCount >= maxUses ? "exhausted" : "active",
    },
  });
}
