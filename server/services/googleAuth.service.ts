/**
 * Logique metier de l'authentification Google.
 *
 * Separation volontaire : ce module ne connait ni Express, ni Prisma.
 * Il recoit l'identite Google PROUVEE (extraite d'un Firebase ID token verifie)
 * et une fonction d'acces base de donnees, et applique les regles suivantes :
 *
 *  1. l'email et le displayName proviennent UNIQUEMENT du token verifie ;
 *  2. aucun role n'est accepte depuis le client : il vient de la base ;
 *  3. un compte inexistant n'est cree QUE si une invitation valide est presente ;
 *  4. la recherche d'utilisateur se fait par email uniquement (jamais par nom) ;
 *  5. le choix du role de depart est une constante serveur.
 */

export const DEFAULT_MEMBER_ROLE = "member";
export const DEFAULT_MEMBER_STATUS = "active_participant";
export const WELCOME_BONUS_POINTS = 50;

export interface GoogleIdentity {
  firebaseUid: string;
  email: string;
  emailVerified: boolean;
  displayName: string | null;
  photoUrl: string | null;
}

/**
 * Sous-ensemble du client Prisma utilise par ce module.
 * Typing volontairement minimal pour garder le module testable sans base reelle.
 */
export interface GoogleAuthDatabase {
  user: {
    findFirst(args: unknown): Promise<any>;
    create(args: unknown): Promise<any>;
  };
  invitation: {
    findUnique(args: unknown): Promise<any>;
    update(args: unknown): Promise<any>;
  };
  communityMember: {
    findUnique(args: unknown): Promise<any>;
    create(args: unknown): Promise<any>;
  };
}

export type GoogleAuthOutcome =
  | { status: "authenticated"; user: any }
  | { status: "forbidden"; error: string }
  | { status: "conflict"; error: string };

const USER_WITH_RELATIONS_INCLUDE = {
  communityMemberships: {
    include: {
      community: {
        select: { id: true, name: true, slug: true, category: true, icon: true },
      },
    },
  },
  organizationAdmins: {
    include: {
      organization: {
        select: { id: true, name: true, acronym: true, type: true, status: true },
      },
    },
  },
};

function buildDisplayName(identity: GoogleIdentity, email: string): string {
  const fromToken = identity.displayName?.trim();
  if (fromToken) {
    return fromToken;
  }
  const localPart = email.split("@")[0];
  return localPart || "Membre";
}

function buildPseudonym(displayName: string): string {
  const firstToken = displayName.split(" ")[0]?.trim();
  return firstToken || "Membre";
}

/**
 * Verifie qu'un code d'invitation est actuellement exploitable.
 * Meme regle que POST /api/auth/register, pour que les deux portes d'entree
 * ne puissent pas diverger.
 */
export function isInvitationUsable(invitation: any): boolean {
  if (!invitation) {
    return false;
  }
  if (invitation.status !== "active") {
    return false;
  }
  if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
    return false;
  }
  if (typeof invitation.currentUses === "number" && typeof invitation.maxUses === "number") {
    if (invitation.currentUses >= invitation.maxUses) {
      return false;
    }
  }
  return true;
}

export interface GoogleSignInParams {
  identity: GoogleIdentity;
  invitationCode?: string | null;
  database: GoogleAuthDatabase;
}

/**
 * Point d'entree unique de l'authentification Google.
 */
export async function resolveGoogleSignIn({
  identity,
  invitationCode,
  database,
}: GoogleSignInParams): Promise<GoogleAuthOutcome> {
  // Garde-fou : l'email du token doit etre explicitement verifie par Firebase
  // avant tout usage. Sans cela, un compte Google dont l'email n'est pas valide
  // pourrait heriter du compte d'un tiers partageant la meme adresse.
  if (!identity.emailVerified) {
    return {
      status: "forbidden",
      error: "Votre adresse Google n'est pas verifiee. Verifiez-la avant de rejoindre Tulizaana.",
    };
  }

  const email = identity.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { status: "forbidden", error: "Jeton Google sans adresse email exploitable." };
  }

  const displayName = buildDisplayName(identity, email);

  // Recherche par EMAIL UNIQUEMENT.
  // La version precedente acceptait aussi une correspondance sur le nom,
  // ce qui permettait de prendre la session d'un membre existant en envoyant
  // simplement son nom dans le corps de la requete.
  const existingUser = await database.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    include: USER_WITH_RELATIONS_INCLUDE,
  });

  if (existingUser && existingUser.isSuspended) {
    return {
      status: "forbidden",
      error: "Ce compte a été suspendu par l'équipe de modération de Tulizaana.",
    };
  }

  const cleanCode = invitationCode ? String(invitationCode).trim().toUpperCase() : null;

  const invitation = cleanCode
    ? await database.invitation.findUnique({
        where: { code: cleanCode },
        include: { community: true },
      })
    : null;

  const usableInvitation = isInvitationUsable(invitation);

  // Regle produit : l'inscription reste fermee par invitation.
  // Un compte Google sans invitation preexistante est refuse.
  if (!existingUser && !usableInvitation) {
    return {
      status: "forbidden",
      error:
        "Aucun code d'invitation valide n'a ete fourni. " +
        "L'acces a Tulizaana est reserve aux membres invité par une organisation partenaire. " +
        "Saisissez votre code d'invitation pour continuer.",
    };
  }

  let user = existingUser;

  if (!user) {
    // Role et statut imposes par le serveur, jamais par le client.
    user = await database.user.create({
      data: {
        email,
        name: displayName,
        pseudonym: buildPseudonym(displayName),
        avatar: identity.photoUrl,
        role: DEFAULT_MEMBER_ROLE,
        memberStatus: DEFAULT_MEMBER_STATUS,
        points: WELCOME_BONUS_POINTS,
        isAnonymous: false,
      },
      include: USER_WITH_RELATIONS_INCLUDE,
    });
  }

  if (usableInvitation) {
    await applyInvitationMembership({
      database,
      user,
      invitation,
    });
  }

  return { status: "authenticated", user };
}

/**
 * Adhere l'utilisateur au cercle lie a l'invitation et consomme une utilisation.
 * L'echec d'adhesion ne doit jamais invalider une authentification reussie.
 */
async function applyInvitationMembership({
  database,
  user,
  invitation,
}: {
  database: GoogleAuthDatabase;
  user: any;
  invitation: any;
}): Promise<void> {
  try {
    const existingMembership = await database.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: invitation.communityId,
          userId: user.id,
        },
      },
    });

    if (!existingMembership) {
      await database.communityMember.create({
        data: {
          userId: user.id,
          communityId: invitation.communityId,
          role: "member",
          status: "active",
        },
      });
    }

    const nextUsageCount =
      typeof invitation.currentUses === "number" ? invitation.currentUses + 1 : 1;
    const maxUses = typeof invitation.maxUses === "number" ? invitation.maxUses : Infinity;

    await database.invitation.update({
      where: { id: invitation.id },
      data: {
        currentUses: { increment: 1 },
        status: nextUsageCount >= maxUses ? "expired" : "active",
      },
    });
  } catch (err) {
    console.error(
      "[AUTH_GOOGLE] Echec de l'adhesion via invitation (authentification conservee):",
      err
    );
  }
}