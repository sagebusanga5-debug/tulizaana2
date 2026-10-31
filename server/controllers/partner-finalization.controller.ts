import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getPrismaClient } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { generateAuthToken } from "../middleware/auth.js";
import { setAuthCookie } from "../utils/cookies.js";
import { sendValidationEmail } from "../services/email.service.js";

/**
 * Valide un code de finalisation et verifie s'il peut etre utilise.
 */
export async function validateFinalizationCode(req: Request, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de donnees non connectee.", 503);
    return;
  }

  try {
    const { code, email } = req.body;

    if (!code || typeof code !== "string") {
      sendError(res, "Le code de finalisation est requis.", 400);
      return;
    }

    if (!email || typeof email !== "string") {
      sendError(res, "L'adresse e-mail est requise.", 400);
      return;
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    const preReg = await prisma.partnerPreRegistration.findUnique({
      where: { finalizationCode: cleanCode },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            acronym: true,
            logo: true,
            status: true,
            country: true,
            city: true,
          },
        },
      },
    });

    if (!preReg) {
      sendError(res, "Code de finalisation invalide.", 404);
      return;
    }

    if (preReg.status !== "approved") {
      sendError(res, "Ce code n'est pas encore actif. Votre demande est en cours d'examen.", 400);
      return;
    }

    if (preReg.finalizationCodeUsed) {
      sendError(res, "Ce code a deja ete utilise. Si vous avez deja finalise votre compte, connectez-vous.", 400);
      return;
    }

    if (preReg.finalizationCodeExpiresAt && preReg.finalizationCodeExpiresAt < new Date()) {
      sendError(res, "Ce code a expire.", 400);
      return;
    }

    if (preReg.email !== cleanEmail) {
      sendError(res, "L'adresse e-mail ne correspond pas a la demande.", 400);
      return;
    }

    if (preReg.organization.status !== "approved") {
      sendError(res, "L'organisation n'est pas approuvee.", 403);
      return;
    }

    sendSuccess(res, {
      valid: true,
      organization: preReg.organization,
      responsibleName: preReg.responsibleName,
    });
  } catch (err) {
    console.error("Erreur validateFinalizationCode:", err);
    sendError(res, "Impossible de valider le code.", 500);
  }
}

/**
 * Finalise le compte partenaire avec le code de finalisation.
 * Cree l'utilisateur, le lie a l'organisation, et consomme le code.
 */
export async function finalizePartnerAccount(req: Request, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de donnees non connectee.", 503);
    return;
  }

  try {
    const { code, email } = req.body;

    if (!code || typeof code !== "string") {
      sendError(res, "Le code de finalisation est requis.", 400);
      return;
    }

    if (!email || typeof email !== "string") {
      sendError(res, "L'adresse e-mail est requise.", 400);
      return;
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    const result = await prisma.$transaction(async (tx) => {
      // Verifier le code et la préinscription
      const preReg = await tx.partnerPreRegistration.findUnique({
        where: { finalizationCode: cleanCode },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              acronym: true,
              logo: true,
              status: true,
              country: true,
              city: true,
            },
          },
        },
      });

      if (!preReg) {
        throw { status: 404, message: "Code de finalisation invalide." };
      }

      if (preReg.status !== "approved") {
        throw { status: 400, message: "Ce code n'est pas encore actif." };
      }

      if (preReg.finalizationCodeUsed) {
        throw { status: 400, message: "Ce code a deja ete utilise." };
      }

      if (preReg.finalizationCodeExpiresAt && preReg.finalizationCodeExpiresAt < new Date()) {
        throw { status: 400, message: "Ce code a expire." };
      }

      if (preReg.email !== cleanEmail) {
        throw { status: 400, message: "L'adresse e-mail ne correspond pas." };
      }

      if (preReg.organization.status !== "approved") {
        throw { status: 403, message: "L'organisation n'est pas approuvee." };
      }

      // Verifier si un utilisateur existe deja avec cet email
      const existingUser = await tx.user.findUnique({
        where: { email: cleanEmail },
      });

      if (existingUser) {
        // L'utilisateur existe deja, verifier si c'est deja admin de cette organisation
        const existingAdmin = await tx.organizationAdmin.findUnique({
          where: {
            organizationId_userId: {
              organizationId: preReg.organizationId,
              userId: existingUser.id,
            },
          },
        });

        if (!existingAdmin) {
          // Lier l'utilisateur existant a l'organisation
          await tx.organizationAdmin.create({
            data: {
              organizationId: preReg.organizationId,
              userId: existingUser.id,
              role: "admin",
            },
          });
        }

        // Marquer le code comme utilise
        await tx.partnerPreRegistration.update({
          where: { id: preReg.id },
          data: {
            finalizationCodeUsed: true,
            finalizedAt: new Date(),
            status: "completed",
          },
        });

        return { user: existingUser, isNew: false };
      }

      // Creer le nouvel utilisateur avec le mot de passe haché
      const newUser = await tx.user.create({
        data: {
          email: cleanEmail,
          passwordHash: preReg.passwordHash,
          name: preReg.responsibleName,
          pseudonym: preReg.responsibleName.split(" ")[0] || preReg.responsibleName,
          role: "partner_admin",
          memberStatus: "active_participant",
          country: preReg.organization.country || "RDC",
          city: preReg.organization.city,
          points: 50,
        },
      });

      // Lier l'utilisateur a l'organisation
      await tx.organizationAdmin.create({
        data: {
          organizationId: preReg.organizationId,
          userId: newUser.id,
          role: "admin",
        },
      });

      // Marquer le code comme utilise
      await tx.partnerPreRegistration.update({
        where: { id: preReg.id },
        data: {
          finalizationCodeUsed: true,
          finalizedAt: new Date(),
          status: "completed",
        },
      });

      // Journal d'audit
      await tx.auditLog.create({
        data: {
          userId: newUser.id,
          userName: newUser.name,
          userRole: newUser.role,
          action: "PARTNER_ACCOUNT_FINALIZED",
          resource: "PartnerPreRegistration",
          resourceId: preReg.id,
          details: `Compte partenaire finalise pour l'organisation ${preReg.organization.name}`,
          status: "success",
        },
      });

      return { user: newUser, isNew: true };
    });

    // Generer le token JWT
    const token = generateAuthToken({
      id: result.user.id,
      email: result.user.email ?? undefined,
      role: result.user.role,
      name: result.user.name,
      pseudo: result.user.pseudonym ?? undefined,
    });

    setAuthCookie(res, token);

    sendSuccess(
      res,
      {
        message: result.isNew
          ? "Votre compte partenaire est pret. Vous pouvez maintenant vous connecter."
          : "Votre compte a ete lie a l'organisation avec succes.",
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        },
        isNew: result.isNew,
      },
      201
    );
  } catch (err: any) {
    console.error("Erreur finalizePartnerAccount:", err);
    if (err.status) {
      sendError(res, err.message, err.status);
    } else {
      sendError(res, "Erreur lors de la finalisation du compte.", 500);
    }
  }
}

/**
 * Genere un code de finalisation pour une organisation approuvee.
 * Reserve a l'administration.
 */
export async function generateFinalizationCode(
  req: Request,
  res: Response
): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "Base de donnees non connectee.", 503);
    return;
  }

  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      sendError(res, "ID d'organisation requis.", 400);
      return;
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, status: true, contactEmail: true },
    });

    if (!organization) {
      sendError(res, "Organisation introuvable.", 404);
      return;
    }

    if (organization.status !== "approved") {
      sendError(res, "L'organisation doit etre approuvee pour generer un code.", 400);
      return;
    }

    // Verifier si une préinscription existe
    const preReg = await prisma.partnerPreRegistration.findFirst({
      where: { organizationId: organizationId, status: "pending" },
    });

    if (!preReg) {
      sendError(res, "Aucune preinscription trouvee pour cette organisation.", 404);
      return;
    }

    // Generer un code unique et suffisamment imprevisible
    const randomHex = crypto.randomBytes(12).toString("hex").toUpperCase();
    const code = `TLZ-FINAL-${randomHex}`;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Valide 30 jours

    // Mettre a jour la préinscription avec le code
    const updated = await prisma.partnerPreRegistration.update({
      where: { id: preReg.id },
      data: {
        finalizationCode: code,
        finalizationCodeExpiresAt: expiresAt,
        status: "approved",
      },
    });

    // Envoyer l'email avec le code
    let emailSent = false;
    if (organization.contactEmail) {
      emailSent = await sendValidationEmail({
        to: organization.contactEmail,
        subject: `Finalisez votre compte partenaire - ${organization.name}`,
        body: `Votre organisation ${organization.name} a ete approuvee.\n\nCode de finalisation : ${code}\n\nCe code est valide jusqu'au ${expiresAt.toLocaleDateString('fr-FR')}.\n\nPour finaliser votre compte, rendez-vous sur Tulizaana et saisissez ce code avec votre adresse e-mail.`,
      });
    }

    sendSuccess(res, {
      message: "Code de finalisation genere avec succes.",
      code,
      expiresAt,
      emailSent,
      email: organization.contactEmail,
    });
  } catch (err) {
    console.error("Erreur generateFinalizationCode:", err);
    sendError(res, "Erreur lors de la generation du code.", 500);
  }
}
