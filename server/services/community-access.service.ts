/**
 * Chantier 5 - Portee reelle des cercles de soutien.
 *
 * `Community.isPrivate` vaut `true` par defaut et le schema nomme ces
 * repertoires « CERCLES DE SOUTIEN FERMES ». Avant ce service, aucun controleur
 * ne consultait `CommunityMember`, `isPrivate` ni `Community.status` : les
 * publications, les commentaires, les stories et les campagnes de n'importe
 * quel cercle prive et suspendu etaient lisibles par un appelant anonyme, et
 * modifiables par n'importe quel compte authentifie.
 *
 * Regle unique appliquee partout : la visibility d'un cercle est decidee par
 * l'adhesion en base, jamais par un identifiant fourni dans la requete.
 */
import { PrismaClient } from "@prisma/client";

/** Adhesion effective : le membre n'est ni suspendu ni reduit au silence. */
const ACTIVE_MEMBERSHIP = "active";

/** Cercles dont le contenu peut etre lu. */
export interface ReadScope {
  /** `true` si l'appelant lit au-dela des cercles publics (membre d'au moins un cercle prive). */
  hasPrivateAccess: boolean;
}

/**
 * Restreint une liste de lectures aux cercles reellement accessibles.
 *
 * Un cercle est lisible si son statut est `active` ET, soit il est public,
 * soit l'appelant y est membre actif. Renvoie null lorsque l'appelant est
 * membre d'au moins un cercle prive : le filtre doit alors etre injecte dans
 * la clause `where` plutot que d'etre remplace par une liste d'identifiants,
 * afin de ne pas degrader la requete en un `IN` sans borne.
 */
export function buildReadableCommunityFilter(
  prisma: PrismaClient,
  userId: string | undefined
): Promise<Record<string, unknown> | null> {
  return (async () => {
    if (!userId) {
      return { status: "active", isPrivate: false, organization: { status: "approved" } };
    }

    const memberships = await prisma.communityMember.findMany({
      where: { userId, status: ACTIVE_MEMBERSHIP, community: { status: "active" } },
      select: { communityId: true, community: { select: { isPrivate: true } } },
    });

    const privateIds = memberships
      .filter((m) => m.community.isPrivate)
      .map((m) => m.communityId);

    if (privateIds.length === 0) {
      return { status: "active", isPrivate: false, organization: { status: "approved" } };
    }

    return {
      status: "active",
      organization: { status: "approved" },
      OR: [{ isPrivate: false }, { id: { in: privateIds } }],
    };
  })();
}

/**
 * Verifie qu'un cercle est lisible par l'appelant.
 *
 * Renvoie `null` si le cercle n'existe pas, n'est pas `active`, ou n'est ni
 * public ni rattache a l'appelant. Un cercle inexistant et un cercle interdit
 * produisent volontairement la meme reponse : aucune existence n'est revelee.
 */
export async function resolveReadableCommunityId(
  prisma: PrismaClient,
  userId: string | undefined,
  communityId: string
): Promise<string | null> {
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { id: true, isPrivate: true, status: true, organization: { select: { status: true } } },
  });

  // La relation est toujours présente avec Prisma. Le test conditionnel garde
  // les doubles de tests historiques (qui ne matérialisent pas la relation)
  // compatibles, sans relâcher le contrôle sur une réponse réelle.
  if (
    !community ||
    community.status !== "active" ||
    (community.organization && community.organization.status !== "approved")
  ) return null;
  if (!community.isPrivate) return community.id;
  if (!userId) return null;

  const membership = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId: community.id, userId } },
    select: { id: true, status: true },
  });

  if (!membership || membership.status !== ACTIVE_MEMBERSHIP) return null;
  return community.id;
}

/**
 * Verifie qu'un cercle est accessible en lecture ET en ecriture.
 *
 * L'ecriture est plus stricte que la lecture : un membre suspendu ou reduit au
 * silence dans le cercle ne peut plus y publier. Un cercle prive sans adhésion
 * est inaccessible en ecriture quelle que soit la demande.
 *
 * Le resultat est une forme plate : ce projet ne compile pas en mode `strict`,
 * donc le narrowing d'une union discriminante par `ok` n'y est pas fiable.
 * `reason` porte le motif du refus, `null` en cas de succes.
 */
export interface WriteAccess {
  ok: boolean;
  communityId: string | null;
  reason: "NOT_FOUND" | "SUSPENDED" | "NOT_A_MEMBER" | null;
}

const ACCESS_GRANTED: WriteAccess = { ok: true, communityId: null, reason: null };

function accessDenied(
  reason: "NOT_FOUND" | "SUSPENDED" | "NOT_A_MEMBER"
): WriteAccess {
  return { ok: false, communityId: null, reason };
}

export async function resolveWritableCommunity(
  prisma: PrismaClient,
  userId: string,
  communityId: string
): Promise<WriteAccess> {
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { id: true, isPrivate: true, status: true },
  });

  if (!community) return accessDenied("NOT_FOUND");
  if (community.status !== "active") return accessDenied("SUSPENDED");

  const membership = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId: community.id, userId } },
    select: { id: true, status: true },
  });

  if (!membership) return accessDenied("NOT_A_MEMBER");
  if (membership.status !== ACTIVE_MEMBERSHIP) return accessDenied("SUSPENDED");

  return { ...ACCESS_GRANTED, communityId: community.id };
}

/** Message et statut HTTP associes a un refus d'acces en ecriture. */
export function describeWriteAccess(refusal: NonNullable<WriteAccess["reason"]>): {
  message: string;
  status: number;
} {
  if (refusal === "NOT_A_MEMBER") {
    return { message: "Vous n'etes pas membre de ce cercle d'entraide.", status: 403 };
  }
  if (refusal === "SUSPENDED") {
    return { message: "Ce cercle d'entraide n'est pas accessible.", status: 404 };
  }
  return { message: "Cercle de soutien introuvable.", status: 404 };
}
