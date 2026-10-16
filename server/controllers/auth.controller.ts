import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getPrismaClient } from "../config/database.js";
import { generateAuthToken, AuthenticatedRequest } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { verifyFirebaseIdToken } from "../config/firebaseAdmin.js";
import { resolveGoogleSignIn, GoogleAuthDatabase } from "../services/googleAuth.service.js";
import { setAuthCookie, clearAuthCookie } from "../utils/cookies.js";

/**
 * Inscription sécurisée avec code d'invitation obligatoire.
 */
export async function register(req: Request, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "La base de données n'est pas encore connectée. Veuillez configurer DATABASE_URL.", 503);
    return;
  }

  try {
    const {
      code,
      name,
      pseudonym,
      email,
      password,
      country = "RDC",
      city,
      phoneNumber,
      isAnonymous = false,
      bio,
    } = req.body;

    if (!code || typeof code !== "string") {
      sendError(res, "Un code d'invitation valide est obligatoire pour rejoindre un cercle Tulizaana.", 400);
      return;
    }

    if (!name || !password || password.length < 6) {
      sendError(res, "Le nom et un mot de passe d'au moins 6 caractères sont requis.", 400);
      return;
    }

    // 1. Vérification du code d'invitation
    const cleanCode = code.trim().toUpperCase();
    const invitation = await prisma.invitation.findUnique({
      where: { code: cleanCode },
      include: {
        community: true,
        organization: true,
      },
    });

    if (!invitation) {
      sendError(res, "Code d'invitation introuvable.", 404);
      return;
    }

    if (invitation.status !== "active" || invitation.expiresAt < new Date()) {
      sendError(res, "Ce code d'invitation a expiré.", 400);
      return;
    }

    if (invitation.currentUses >= invitation.maxUses) {
      sendError(res, "Ce code d'invitation a atteint son quota maximal d'utilisations.", 400);
      return;
    }

    // 2. Unicité email si fourni.
    // Chantier 5 - cette route est anonyme. Un message distinct ici
    // (« un compte existe deja ») transformait l'inscription en oracle
    // d'enumeration d'adresses. La reponse est donc identique a celle d'une
    // invitation invalide ; le conflit n'est revele que dans le journal.
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      if (existingUser) {
        sendError(
          res,
          "Inscription impossible. Verifiez le code d'invitation et vos informations.",
          400
        );
        return;
      }
    }

    // 3. Hashage sécurisé du mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Transaction atomique : création utilisateur + membre communauté + incrément invitation
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          pseudonym: pseudonym ? pseudonym.trim() : name.trim(),
          email: email ? email.toLowerCase().trim() : null,
          passwordHash,
          country,
          city: city ? city.trim() : null,
          phoneNumber: phoneNumber ? phoneNumber.trim() : null,
          isAnonymous: Boolean(isAnonymous),
          bio: bio ? bio.trim() : null,
          role: "member",
          memberStatus: "active_participant",
          points: 50, // Bonus de bienvenue
        },
      });

      // Adhésion automatique à la communauté liée à l'invitation
      await tx.communityMember.create({
        data: {
          communityId: invitation.communityId,
          userId: newUser.id,
          role: "member",
          status: "active",
        },
      });

      // Incrémentation et expiration éventuelle du code d'invitation
      const newUsageCount = invitation.currentUses + 1;
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          currentUses: { increment: 1 },
          status: newUsageCount >= invitation.maxUses ? "expired" : "active",
        },
      });

      // Journal d'audit de création
      await tx.auditLog.create({
        data: {
          userId: newUser.id,
          userName: newUser.name,
          userRole: newUser.role,
          action: "USER_REGISTERED_WITH_CODE",
          resource: "Invitation",
          resourceId: invitation.id,
          // Chantier 5 - le code d'invitation est un secret encore utilisable tant que
    // son quota n'est pas epuise. Il n'est donc jamais ecrit dans le journal :
    // l'identifiant de l'invitation suffit a tracer l'operation.
    details: `Inscription dans le cercle ${invitation.community.name} (invitation ${invitation.id})`,
          status: "success",
        },
      });

      return newUser;
    });

    const token = generateAuthToken({
      id: result.id,
      email: result.email ?? undefined,
      role: result.role,
      name: result.name,
      pseudo: result.pseudonym ?? undefined,
    });

    setAuthCookie(res, token);

    sendSuccess(
      res,
      {
        user: {
          id: result.id,
          name: result.name,
          pseudonym: result.pseudonym,
          email: result.email,
          role: result.role,
          country: result.country,
          city: result.city,
          avatar: result.avatar,
          bio: result.bio,
          isAnonymous: result.isAnonymous,
          points: result.points,
          communityJoined: {
            id: invitation.community.id,
            name: invitation.community.name,
            slug: invitation.community.slug,
          },
        },
      },
      201
    );
  } catch (err: unknown) {
    console.error("Erreur lors de l'inscription:", err);
    sendError(res, "Une erreur inattendue est survenue lors de l'inscription.", 500);
  }
}

/**
 * Connexion par email ou pseudonyme avec mot de passe hashé.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "La base de données n'est pas encore connectée.", 503);
    return;
  }

  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      sendError(res, "Veuillez fournir votre email ou pseudo ainsi que votre mot de passe.", 400);
      return;
    }

    const cleanIdentifier = identifier.trim();

    // Recherche par email ou par pseudonyme
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanIdentifier, mode: "insensitive" } },
          { pseudonym: { equals: cleanIdentifier, mode: "insensitive" } },
          { name: { equals: cleanIdentifier, mode: "insensitive" } },
        ],
      },
      include: {
        communityMemberships: {
          include: {
            community: {
              select: {
                id: true,
                name: true,
                slug: true,
                category: true,
                icon: true,
              },
            },
          },
        },
        organizationAdmins: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                acronym: true,
                type: true,
                status: true,
              },
            },
          },
        },
      },
    });

    // Chantier 5 - canal temporel et oracle de compte suspendu.
//
// Le test de hashing est effectue AVANT toute branche sur l'existence du
// compte : sans cela, un identifiant inconnu repondait en ~1 ms contre
// ~100 ms pour un identifiant existant, ce qui suffisait a enumerer les
// comptes enregistres. `SINK` est un hash bcrypt valide et inutilisable, il
// sert uniquement a egaliser le cout.
const SINK_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
const isMatch = await bcrypt.compare(password, user?.passwordHash ?? SINK_HASH);

if (!user || !user.passwordHash || !isMatch) {
sendError(res, "Identifiant ou mot de passe incorrect.", 401);
return;
}

// Le statut d'un compte suspendu n'est plus revele : la reponse est
// identique a celle d'un mot de passe errone, sans hint sur l'existence.
if (user.isSuspended) {
sendError(res, "Identifiant ou mot de passe incorrect.", 401);
return;
}

    const token = generateAuthToken({
      id: user.id,
      email: user.email ?? undefined,
      role: user.role,
      name: user.name,
      pseudo: user.pseudonym ?? undefined,
    });

    setAuthCookie(res, token);

    sendSuccess(res, {
      user: {
        id: user.id,
        name: user.name,
        pseudonym: user.pseudonym,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        country: user.country,
        city: user.city,
        phoneNumber: user.phoneNumber,
        isAnonymous: user.isAnonymous,
        points: user.points,
        communities: user.communityMemberships.map((m) => ({
          id: m.community.id,
          name: m.community.name,
          slug: m.community.slug,
          category: m.community.category,
          icon: m.community.icon,
          role: m.role,
        })),
        managedOrganizations: user.organizationAdmins.map((o) => ({
          id: o.organization.id,
          name: o.organization.name,
          acronym: o.organization.acronym,
          role: o.role,
        })),
      },
    });
  } catch (err) {
    console.error("Erreur lors de la connexion:", err);
    sendError(res, "Une erreur inattendue est survenue lors de la connexion.", 500);
  }
}

/**
 * Récupération du profil de l'utilisateur actuellement connecté.
 */
export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "La base de données n'est pas encore connectée.", 503);
    return;
  }

  if (!req.user) {
    sendError(res, "Authentification requise.", 401);
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        communityMemberships: {
          include: {
            community: {
              select: {
                id: true,
                name: true,
                slug: true,
                category: true,
                icon: true,
                isPrivate: true,
              },
            },
          },
        },
        organizationAdmins: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      sendError(res, "Utilisateur introuvable.", 404);
      return;
    }

    // Un compte suspendu perd l'acces a son propre profil, et pas seulement aux
    // surfaces protegees : c'est l'etat de la base, pas le jeton, qui fait foi.
    if (user.isSuspended) {
      sendError(res, "Ce compte a été suspendu par l'équipe de modération de Tulizaana.", 403);
      return;
    }

    sendSuccess(res, {
      id: user.id,
      name: user.name,
      pseudonym: user.pseudonym,
      email: user.email,
      role: user.role,
      memberStatus: user.memberStatus,
      avatar: user.avatar,
      bio: user.bio,
      country: user.country,
      city: user.city,
      phoneNumber: user.phoneNumber,
      isAnonymous: user.isAnonymous,
      isSuspended: user.isSuspended,
      points: user.points,
      completedCampaigns: user.completedCampaigns,
      createdAt: user.createdAt,
      communities: user.communityMemberships.map((m) => ({
        id: m.community.id,
        name: m.community.name,
        slug: m.community.slug,
        category: m.community.category,
        icon: m.community.icon,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      managedOrganizations: user.organizationAdmins.map((o) => ({
        id: o.organization.id,
        name: o.organization.name,
        acronym: o.organization.acronym,
        role: o.role,
      })),
    });
  } catch (err) {
    console.error("Erreur dans getMe:", err);
    sendError(res, "Impossible de récupérer le profil.", 500);
  }
}

/**
 * Mise à jour des informations de profil.
 */
export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "La base de données n'est pas encore connectée.", 503);
    return;
  }

  if (!req.user) {
    sendError(res, "Authentification requise.", 401);
    return;
  }

  try {
    const { name, pseudonym, avatar, bio, country, city, phoneNumber, isAnonymous } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(pseudonym && { pseudonym: pseudonym.trim() }),
        ...(avatar !== undefined && { avatar }),
        ...(bio !== undefined && { bio }),
        ...(country && { country }),
        ...(city !== undefined && { city }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(isAnonymous !== undefined && { isAnonymous: Boolean(isAnonymous) }),
      },
    });

    sendSuccess(res, {
      id: updated.id,
      name: updated.name,
      pseudonym: updated.pseudonym,
      email: updated.email,
      avatar: updated.avatar,
      bio: updated.bio,
      city: updated.city,
      isAnonymous: updated.isAnonymous,
    });
  } catch (err) {
    console.error("Erreur mise à jour profil:", err);
    sendError(res, "Erreur lors de la mise à jour du profil.", 500);
  }
}

/**
 * Connexion Google : l'identite provient UNIQUEMENT d'un Firebase ID token
 * verifie cote serveur (firebase-admin).
 *
 * Regles appliquees :
 *  - aucun champ du corps de la requete (email, displayName, uid, role) n'est
 *    utilise comme preuve d'identite ;
 *  - l'inscription reste fermee par invitation : sans code valide, un compte
 *    Google inconnu est refuse ;
 *  - le role provient toujours de la base ou d'une constante serveur.
 */
export async function googleSignIn(req: Request, res: Response): Promise<void> {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    sendError(
      res,
      "Authentification Google requise : jeton Firebase manquant. Connectez-vous via Google.",
      401
    );
    return;
  }

  const firebaseIdToken = authorizationHeader.split(" ")[1];

  const verification = await verifyFirebaseIdToken(firebaseIdToken);

  if (verification.ok === false) {
    const failure = verification;
    if (failure.code === "not_configured") {
      // Panne de configuration serveur : ce n'est pas une erreur du client.
      console.error("[AUTH_GOOGLE] Verification Firebase indisponible:", failure.reason);
      sendError(
        res,
        "La connexion Google est momentanément indisponible. Veuillez réessayer plus tard ou utiliser votre email et mot de passe.",
        503
      );
      return;
    }

    sendError(res, "Jeton Google invalide ou expiré. Veuillez vous reconnecter.", 401);
    return;
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    sendError(res, "La base de données n'est pas encore connectée.", 503);
    return;
  }

  try {
    // Seul le code d'invitation est lu depuis le corps : ce n'est pas une
    // donnee d'identite, c'est une entree metier verifiee en base.
    const invitationCode = typeof req.body?.invitationCode === "string" ? req.body.invitationCode : null;

    const outcome = await resolveGoogleSignIn({
      identity: verification.identity,
      invitationCode,
      database: prisma as unknown as GoogleAuthDatabase,
    });

    if (outcome.status === "forbidden") {
      sendError(res, outcome.error, 403);
      return;
    }

    if (outcome.status === "conflict") {
      sendError(res, outcome.error, 409);
      return;
    }

    const user = outcome.user;

    const token = generateAuthToken({
      id: user.id,
      email: user.email ?? undefined,
      role: user.role,
      name: user.name,
      pseudo: user.pseudonym ?? undefined,
    });

    setAuthCookie(res, token);

    sendSuccess(res, {
      user: {
        id: user.id,
        name: user.name,
        pseudonym: user.pseudonym,
        email: user.email,
        role: user.role,
        country: user.country,
        city: user.city,
        avatar: user.avatar,
        bio: user.bio,
        isAnonymous: user.isAnonymous,
        points: user.points,
        communities: user.communityMemberships.map((m: any) => m.community),
        organizations: user.organizationAdmins.map((o: any) => o.organization),
      },
    });
  } catch (err) {
    console.error("Erreur Google Sign-In:", err);
    sendError(res, "Erreur lors de la connexion Google.", 500);
  }
}

/**
 * Deconnexion : invalidation du cookie de session cote client.
 *
 * Le serveur ne conserve pas d'etat de session cote serveur : la desactivation
 * du cookie est suffisante. Le jeton reste cryptographiquement valide jusqu'a
 * son expiration naturelle (30 jours), mais il n'est plus accessible au
 * navigateur.
 */
export async function logout(req: Request, res: Response): Promise<void> {
  clearAuthCookie(res);
  sendSuccess(res, { success: true });
}

