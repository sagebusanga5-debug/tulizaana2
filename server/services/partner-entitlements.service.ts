/**
 * Chantier 4 - Service centralise d'entitlements partenaire.
 *
 * C'est le SEUL endroit du code autorise a decider si une action partenaire est
 * permise. Aucun controleur n'implementer sa propre regle d'acces.
 *
 * Identite de l'organisation
 * --------------------------
 * L'organisation n'est jamais lue depuis le corps de la requete. Elle est
 * resolue par la chaine :
 *
 *   JWT -> User -> OrganizationAdmin -> Organization
 *
 * `req.body.organizationId` est donc structurellement inepu : meme envoye, il
 * n'est jamais lu. Un utilisateur qui gere plusieurs organisations ne peut
 * utiliser que celles listees par sa table `OrganizationAdmin` : toute
 * organisation demandee est verifiee cote serveur comme appartenant a ses
 * organisations reellement gerees.
 *
 * Autorite des quotas
 * -------------------
 * `Organization.quotaCommunitiesMax`, `quotaMembersMax` et `quotaCampaignsMax`
 * sont l'unique autorite operationnelle. Le catalogue `shared/partner-plans.ts`
 * n'est JAMAIS consulte pour autoriser une action ; il ne sert qu'a la
 * configuration, l'affichage et les valeurs par defaut de candidature.
 *
 * Conditions cumulatives
 * ----------------------
 * `paymentStatus = "validated"` ne suffit jamais a lui seul. Une action
 * partenaire exige SIMULTANEMENT :
 *
 *   1. status === "approved"
 *   2. abonnement defini        (subscriptionStartedAt non nul)
 *   3. paymentStatus === "validated"
 *   4. abonnement non expire    (subscriptionExpiresAt null ou dans le futur)
 *   5. quota disponible
 *
 * Etat de validation du paiement
 * ------------------------------
 * `paymentStatus` est un etat, pas un drapeau historique. Un changement
 * d'abonnement remet explicitement la validation a zero : voir
 * `applySubscriptionChange`, qui n'herite jamais d'un ancien `validated` et
 * exige une validation de paiement correspondant a l'abonnement actif.
 *
 * Codes d'erreur
 * --------------
 * Les codes sont stables et exploitables par le frontend. Le texte est
 * libre ; le client ne doit jamais l'analyser.
 */

import type { Response } from "express";
import type { Prisma, PrismaClient } from "@prisma/client";
import { sendError } from "../utils/response.js";

/** Codes d'erreur metier stables. Le frontend branche son comportement sur ces valeurs. */
export const PARTNER_ERROR_CODES = {
  NO_ORGANIZATION: "PARTNER_NO_ORGANIZATION",
  NOT_APPROVED: "ORGANIZATION_NOT_APPROVED",
  SUBSCRIPTION_REQUIRED: "SUBSCRIPTION_REQUIRED",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  SUBSCRIPTION_EXPIRED: "SUBSCRIPTION_EXPIRED",
  DEMO_EXPIRED: "DEMO_EXPIRED",
  DEMO_ALREADY_USED: "DEMO_ALREADY_USED",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  FORBIDDEN_RESOURCE: "FORBIDDEN_RESOURCE",
} as const;

export type PartnerErrorCode =
  (typeof PARTNER_ERROR_CODES)[keyof typeof PARTNER_ERROR_CODES];

/** Statuts d'approbation reconnus par le produit. */
export const APPROVAL_STATUSES = ["pending", "under_review", "approved", "rejected", "suspended"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

/** Etats de paiement reconnus. `null` signifie « jamais renseigne ». */
export const PAYMENT_STATUSES = ["pending", "validated", "failed"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/**
 * Champ de quota controle par l'entitlement.
 *
 * Chantier 5 - `members` manquait. `Organization.quotaMembersMax` etait donc
 * declare comme autorite operationnelle mais n'etait applique nulle part :
 * `joinCommunity` pouvait porter une organisation partenaire a une adhésion
 * illimitee sans jamais consulter le quota.
 */
export type QuotaKind = "communities" | "members" | "campaignsPerMonth";

/** Colonnes minimales d'une organisation necessaires a l'evaluation des droits. */
export interface PartnerOrganizationRecord {
  id: string;
  name: string;
  status: string;
  subscriptionPlan: string;
  planId: string | null;
  quotaCommunitiesMax: number;
  quotaMembersMax: number;
  quotaCampaignsMax: number;
  subscriptionStartedAt: Date | null;
  subscriptionExpiresAt: Date | null;
  paymentStatus: string | null;
  demoUsed: boolean;
  demoStartedAt: Date | null;
  demoExpiresAt: Date | null;
}

export const PARTNER_ORGANIZATION_SELECT = {
  id: true,
  name: true,
  status: true,
  subscriptionPlan: true,
  planId: true,
  quotaCommunitiesMax: true,
  quotaMembersMax: true,
  quotaCampaignsMax: true,
  subscriptionStartedAt: true,
  subscriptionExpiresAt: true,
  paymentStatus: true,
  demoUsed: true,
  demoStartedAt: true,
  demoExpiresAt: true,
} as const;

/**
 * Leve une erreur metier interne, rattrapee par `deny`.
 * Permet aux controleurs d'ecrire une logique lineaire et de deleguer
 * l'ecriture de la reponse au point de sortie unique.
 */
export class PartnerEntitlementError extends Error {
  readonly code: PartnerErrorCode;
  readonly status: number;
  readonly meta?: Record<string, unknown>;

  constructor(
    code: PartnerErrorCode,
    message: string,
    status = 403,
    meta?: Record<string, unknown>
  ) {
    super(message);
    this.name = "PartnerEntitlementError";
    this.code = code;
    this.status = status;
    this.meta = meta;
  }
}

export type EntitlementResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: PartnerEntitlementError };

/**
 * Ecrit la reponse d'erreur correspondant a une entite refusee.
 * Point de sortie unique : garantit qu'aucun code n'est oublie ou mal orthographie.
 */
export function deny(res: Response, error: PartnerEntitlementError): Response {
  return sendError(res, error.message, error.status, error.code, error.meta);
}

/**
 * Borne de debut du mois civil courant, en heure locale du serveur.
 *
 * Le quota de campagnes est mensuel : il doit porter sur le mois civil, pas sur
 * les N derniers jours glissants. Une fenetre glissante ferait dependre le droit
 * d'un partner du jour ou il tente l'action.
 */
export function startOfCurrentCivilMonth(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

/** Borne de debut du mois civil suivant, exclusive. */
export function startOfNextCivilMonth(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
}

/** Fenetre [debut, fin) du mois civil courant. */
export function currentCivilMonthWindow(now: Date = new Date()): { gte: Date; lt: Date } {
  return { gte: startOfCurrentCivilMonth(now), lt: startOfNextCivilMonth(now) };
}

/** true si l'abonnement a expire a l'instant `now`. Une echeance nulle n'expire jamais. */
export function isSubscriptionExpired(
  organization: Pick<PartnerOrganizationRecord, "subscriptionExpiresAt">,
  now: Date = new Date()
): boolean {
  if (!organization.subscriptionExpiresAt) return false;
  return organization.subscriptionExpiresAt.getTime() < now.getTime();
}

/** true si la periode de demo est expiree. */
export function isDemoExpired(
  organization: Pick<PartnerOrganizationRecord, "demoUsed" | "demoExpiresAt">,
  now: Date = new Date()
): boolean {
  if (!organization.demoUsed || !organization.demoExpiresAt) return false;
  return organization.demoExpiresAt.getTime() < now.getTime();
}

/** true si l'organisation a consomme sa demo 30 jours. */
export function hasUsedDemo(
  organization: Pick<PartnerOrganizationRecord, "demoUsed">
): boolean {
  return organization.demoUsed === true;
}

/** true si un abonnement a ete active (et non seulement selectionne). */
export function hasActiveSubscription(
  organization: Pick<PartnerOrganizationRecord, "subscriptionStartedAt">
): boolean {
  return organization.subscriptionStartedAt !== null;
}

/** true si le paiement de l'abonnement actif a ete valide. `null` ne vaut jamais `validated`. */
export function hasValidatedPayment(
  organization: Pick<PartnerOrganizationRecord, "paymentStatus">
): boolean {
  return organization.paymentStatus === "validated";
}

/** true si l'organisation est approuvee. Seul `approved` autorise une action partenaire. */
export function isApproved(organization: Pick<PartnerOrganizationRecord, "status">): boolean {
  return organization.status === "approved";
}

/**
 * Verifie l'approbation. Un statut inconnu est traite comme un refus : une
 * valeur de statut non reconnue ne doit jamais ouvrir un acces.
 */
function assertApproved(organization: PartnerOrganizationRecord): void {
  if (isApproved(organization)) return;
  throw new PartnerEntitlementError(
    PARTNER_ERROR_CODES.NOT_APPROVED,
    organization.status === "pending" || organization.status === "under_review"
      ? "Votre organisation n'est pas encore approuvee. La creation de comunaute et de campagne est reservee aux organisations agreees."
      : "L'acces de votre organisation est suspendu ou refuse par la plateforme.",
    403,
    { status: organization.status }
  );
}

/** Verifie qu'un abonnement a ete active. */
function assertSubscriptionDefined(organization: PartnerOrganizationRecord): void {
  if (hasActiveSubscription(organization)) return;
  throw new PartnerEntitlementError(
    PARTNER_ERROR_CODES.SUBSCRIPTION_REQUIRED,
    "Aucun abonnement actif n'est defini pour votre organisation. Contactez la plateforme pour activer votre formule.",
    403,
    { plan: organization.subscriptionPlan }
  );
}

/**
 * Verifie que le paiement de l'ABONNEMENT EN COURS est valide.
 *
 * Point cle : un `validated` herite d'un ancien abonnement n'est pas reutilise.
 * `applySubscriptionChange` remet `paymentStatus` a `pending` a chaque changement
 * de formule, donc un `validated` ne peut decrire que l'abonnement actif.
 */
function assertPaymentValidated(organization: PartnerOrganizationRecord): void {
  if (hasValidatedPayment(organization)) return;
  throw new PartnerEntitlementError(
    PARTNER_ERROR_CODES.PAYMENT_PENDING,
    organization.paymentStatus === "failed"
      ? "Le paiement de votre abonnement a echoue. Mettez a jour votre moyen de paiement pour retablir vos droits."
      : "Le paiement de votre abonnement n'est pas encore valide. Vos droits restent en attente de validation.",
    403,
    { paymentStatus: organization.paymentStatus, plan: organization.subscriptionPlan }
  );
}

/** Verifie que l'abonnement n'est pas expire. */
function assertNotExpired(organization: PartnerOrganizationRecord, now: Date): void {
  if (!isSubscriptionExpired(organization, now)) return;
  throw new PartnerEntitlementError(
    PARTNER_ERROR_CODES.SUBSCRIPTION_EXPIRED,
    "Votre abonnement a expire. Vos ressources existantes restent accessibles, mais aucune nouvelle communaute ni campagne ne peut etre creee tant que l'abonnement n'est pas renouvele.",
    403,
    {
      plan: organization.subscriptionPlan,
      expiredAt: organization.subscriptionExpiresAt ? organization.subscriptionExpiresAt.toISOString() : null,
    }
  );
}

/** Verifie que la demo n'a pas expiree. */
function assertDemoNotExpired(organization: PartnerOrganizationRecord, now: Date): void {
  if (!isDemoExpired(organization, now)) return;
  throw new PartnerEntitlementError(
    PARTNER_ERROR_CODES.DEMO_EXPIRED,
    "Votre periode de decouverte a expire. Contactez la plateforme pour souscrire une formule.",
    403,
    {
      demoExpiredAt: organization.demoExpiresAt ? organization.demoExpiresAt.toISOString() : null,
    }
  );
}

/**
 * Valide l'approbation ET le cycle abonnement/paiement, hors quota.
 *
 * Ordre d'evaluation strictement sequentiel. Chaque condition est necessaire :
 * `paymentStatus === "validated"` ne suffit jamais a lui seul.
 */
export function assertPartnerSubscription(organization: PartnerOrganizationRecord, now: Date = new Date()): void {
  assertApproved(organization);

  if (hasUsedDemo(organization)) {
    assertDemoNotExpired(organization, now);
    return;
  }

  assertSubscriptionDefined(organization);
  assertPaymentValidated(organization);
  assertNotExpired(organization, now);
}

/**
 * Leve si le quota est epuise.
 *
 * L'autorite est la colonne stockee sur l'organisation, jamais le catalogue de
 * plans : le seed peut attribuer des quotas plus eleves ou plus bas que le plan.
 */
export function assertQuotaAvailable(
  kind: QuotaKind,
  used: number,
  max: number
): void {
  if (used < max) return;
  const label =
    kind === "communities"
      ? "communautes"
      : kind === "members"
        ? "membres"
        : "campagnes du mois";
  throw new PartnerEntitlementError(
    PARTNER_ERROR_CODES.QUOTA_EXCEEDED,
    `Quota de ${label} atteint : ${used}/${max}. Delivrez plus de valeur ou contactez la plateforme pour agrandir votre quota.`,
    403,
    { quota: kind, used, max }
  );
}

/**
 * Resout l'organisation partenaire a partir de l'identite serveur.
 *
 * `requestedOrganizationId` n'est accepte que pour le cas legitime d'un
 * utilisateur qui gere PLUSIEURES organisations. Il est alors verifie contre la
 * liste reelle de `OrganizationAdmin` : une organisation arbitraire demandee
 * depuis le client est rejetee.
 */
export async function resolvePartnerOrganization(
  prisma: PrismaClient,
  userId: string,
  requestedOrganizationId?: string | null
): Promise<PartnerOrganizationRecord> {
  const links = await prisma.organizationAdmin.findMany({
    where: { userId },
    select: { organizationId: true },
  });

  if (links.length === 0) {
    throw new PartnerEntitlementError(
      PARTNER_ERROR_CODES.NO_ORGANIZATION,
      "Aucune organisation partenaire n'est associee a votre compte. Faites-vous rattacher a une organisation par la plateforme.",
      403
    );
  }

  const managedIds = links.map((link) => link.organizationId);

  let targetId: string;
  if (requestedOrganizationId) {
    if (!managedIds.includes(requestedOrganizationId)) {
      // 404 plutot que 403 : ne pas reveler l'existence d'une organisation
      // arbitraire demande depuis le client.
      throw new PartnerEntitlementError(
        PARTNER_ERROR_CODES.FORBIDDEN_RESOURCE,
        "Organisation introuvable.",
        404
      );
    }
    targetId = requestedOrganizationId;
  } else {
    // Sans selection explicite, une seule organisation gerable est resolue
    // automatiquement. Plusieurs organisations sans selection sont ambigues.
    if (managedIds.length > 1) {
      throw new PartnerEntitlementError(
        PARTNER_ERROR_CODES.NO_ORGANIZATION,
        "Votre compte gere plusieurs organisations. Precisez organisationId parmi celles que vous administrez.",
        403,
        { managedOrganizationsCount: managedIds.length }
      );
    }
    targetId = managedIds[0]!;
  }

  const organization = await prisma.organization.findUnique({
    where: { id: targetId },
    select: PARTNER_ORGANIZATION_SELECT,
  });

  if (!organization) {
    throw new PartnerEntitlementError(
      PARTNER_ERROR_CODES.NO_ORGANIZATION,
      "Organisation partenaire introuvable.",
      404
    );
  }

  return organization as PartnerOrganizationRecord;
}

/**
 * Identite de l'appelant pour une organisation donnee.
 * Reserve aux lectures de gestion, pas aux mutations.
 */
export async function isOrganizationManager(
  prisma: PrismaClient,
  userId: string,
  organizationId: string
): Promise<boolean> {
  const link = await prisma.organizationAdmin.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    select: { id: true },
  });
  return link !== null;
}

/** Liste des organisations reellement gerees par l'appelant, pour le selecteur du portail. */
export async function listManagedOrganizationIds(
  prisma: PrismaClient,
  userId: string
): Promise<string[]> {
  const links = await prisma.organizationAdmin.findMany({
    where: { userId },
    select: { organizationId: true },
    orderBy: { createdAt: "asc" },
  });
  return links.map((link) => link.organizationId);
}

/**
 * Compte les communites consommees par une organisation.
 * Le quota est une borne stricte : il n'est jamais augmente a la volee.
 */
export async function countUsedCommunities(
  tx: Pick<Prisma.TransactionClient, "community">,
  organizationId: string
): Promise<number> {
  return tx.community.count({ where: { organizationId } });
}

/**
 * Compte les membres actifs rattaches aux cercles d'une organisation.
 *
 * Le scope est l'organisation, via le cercle. Seuls les membres `active` sont
 * comptes : un membre suspendu ou reduit au silence ne consomme pas de quota,
 * ce qui laisse la place d'une remission apres une sanction.
 */
export async function countUsedMembers(
  tx: Pick<Prisma.TransactionClient, "communityMember">,
  organizationId: string,
  now: Date = new Date()
): Promise<number> {
  return tx.communityMember.count({
    where: {
      status: "active",
      community: { organizationId },
      joinedAt: { lte: now },
    },
  });
}

/**
 * Compte les campagnes consommees sur le mois civil en cours.
 *
 * Le comptage est borne a [1er du mois, 1er du mois suivant) et scope a
 * l'organisation. `startDate` est une colonne nullable : les campagnes sans
 * date de debut sont comptees par leur `createdAt`, sinon une campagne sans
 * `startDate` consommerait un quota invisible.
 */
export async function countUsedCampaignsThisMonth(
  tx: Pick<Prisma.TransactionClient, "campaign">,
  organizationId: string,
  now: Date = new Date()
): Promise<number> {
  const { gte, lt } = currentCivilMonthWindow(now);

  const [byStartDate, byCreationDate] = await Promise.all([
    tx.campaign.count({
      where: { organizationId, startDate: { gte, lt } },
    }),
    tx.campaign.count({
      where: { organizationId, startDate: null, createdAt: { gte, lt } },
    }),
  ]);

  return byStartDate + byCreationDate;
}

export type SubscriptionChangeData = {
  subscriptionPlan: string;
  paymentStatus: string;
  subscriptionExpiresAt?: Date | null;
  subscriptionStartedAt?: Date;
  quotaCommunitiesMax?: number;
  quotaMembersMax?: number;
  quotaCampaignsMax?: number;
};

/** true si la valeur est un etat de paiement reconnu par le produit. */
export function isKnownPaymentStatus(value: unknown): value is PaymentStatus {
  return typeof value === "string" && (PAYMENT_STATUSES as readonly string[]).includes(value);
}

/**
 * Applique un changement de formule, cote serveur uniquement.
 *
 * Garde-fou 1 : un changement de formule NE REPASSE PAS implicitement un ancien
 * `paymentStatus = "validated"`. La validation doit correspondre a l'abonnement
 * actuellement actif : la validation est remise a zero sauf etat explicite.
 *
 * Garde-fou 2 : un quota non fourni est laisse intact, pour ne pas ecraser
 * silencieusement un plafond negoci plus specifique que le catalogue.
 *
 * Garde-fou 3 : une formule ou un etat de paiement inconnus sont rejetes en 400
 * par l'appelant. Ce ne sont pas des refus d'entitlement, donc ils ne recoivent
 * aucun des codes metier partenaires.
 *
 * Reserve a une route superadmin deja protegee
 * par `requireRole`. Aucun paiement n'est simule : si `paymentStatus` n'est pas
 * explicitement fourni, il vaut `pending`.
 */
export function applySubscriptionChange(input: {
  subscriptionPlan: string;
  quotaCommunitiesMax?: number | null;
  quotaMembersMax?: number | null;
  quotaCampaignsMax?: number | null;
  subscriptionExpiresAt?: Date | null;
  paymentStatus?: string | null;
  /** Demarre l'abonnement (rarement :activation explicite par la plateforme). */
  startSubscription?: boolean;
}): SubscriptionChangeData {
  const data: SubscriptionChangeData = {
    subscriptionPlan: input.subscriptionPlan,
    // Garde-fou 1 : un changement de formule n'herite PAS d'un ancien
    // `validated`. La validation doit correspondre a l'abonnement actif.
    // Aucun paiement n'est simule : sans etat explicite, reste `pending`.
    paymentStatus: input.paymentStatus ?? "pending",
  };

  if (input.subscriptionExpiresAt !== undefined) {
    data.subscriptionExpiresAt = input.subscriptionExpiresAt;
  }

  if (input.startSubscription) {
    data.subscriptionStartedAt = new Date();
  }

  // Garde-fou 2 : un quota non fourni est laisse intact. Une organisation de
  // seed porte `enterprise` avec 20 communutes, plus specifique que le
  // catalogue ; un changement de formule ne doit ni relever ni abaisser ce
  // plafond negoci sans decision explicite de la plateforme.
  if (input.quotaCommunitiesMax !== undefined && input.quotaCommunitiesMax !== null) {
    data.quotaCommunitiesMax = Number(input.quotaCommunitiesMax);
  }
  if (input.quotaMembersMax !== undefined && input.quotaMembersMax !== null) {
    data.quotaMembersMax = Number(input.quotaMembersMax);
  }
  if (input.quotaCampaignsMax !== undefined && input.quotaCampaignsMax !== null) {
    data.quotaCampaignsMax = Number(input.quotaCampaignsMax);
  }

  return data;
}

/**
 * Vue d'ensemble des droits, pour le tableau de bord et les tests.
 * Aucune decision : cette fonction ne leve pas d'entitlement.
 */
export function describeEntitlements(
  organization: PartnerOrganizationRecord,
  usage: { communities: number; campaignsThisMonth: number },
  now: Date = new Date()
): {
  organizationStatus: string;
  plan: string;
  approval: boolean;
  subscription: {
    defined: boolean;
    paymentStatus: string | null;
    paymentValidated: boolean;
    startedAt: Date | null;
    expiresAt: Date | null;
    expired: boolean;
  };
  demo: {
    used: boolean;
    startedAt: Date | null;
    expiresAt: Date | null;
    expired: boolean;
  };
  quotas: {
    communities: { used: number; max: number; remaining: number; exceeded: boolean };
    members: { used: number; max: number };
    campaignsPerMonth: { used: number; max: number; remaining: number; exceeded: boolean };
  };
  canPerformSubscriptionActions: boolean;
  blockedBy: PartnerErrorCode | null;
} {
  const approval = isApproved(organization);
  const defined = hasActiveSubscription(organization);
  const paymentValidated = hasValidatedPayment(organization);
  const expired = isSubscriptionExpired(organization, now);
  const demoUsed = hasUsedDemo(organization);
  const demoExpired = isDemoExpired(organization, now);

  let blockedBy: PartnerErrorCode | null = null;
  if (!approval) blockedBy = PARTNER_ERROR_CODES.NOT_APPROVED;
  else if (demoUsed) {
    if (demoExpired) blockedBy = PARTNER_ERROR_CODES.DEMO_EXPIRED;
  } else {
    if (!defined) blockedBy = PARTNER_ERROR_CODES.SUBSCRIPTION_REQUIRED;
    else if (!paymentValidated) blockedBy = PARTNER_ERROR_CODES.PAYMENT_PENDING;
    else if (expired) blockedBy = PARTNER_ERROR_CODES.SUBSCRIPTION_EXPIRED;
  }

  return {
    organizationStatus: organization.status,
    plan: organization.subscriptionPlan,
    approval,
    subscription: {
      defined,
      paymentStatus: organization.paymentStatus,
      paymentValidated,
      startedAt: organization.subscriptionStartedAt,
      expiresAt: organization.subscriptionExpiresAt,
      expired,
    },
    demo: {
      used: demoUsed,
      startedAt: organization.demoStartedAt,
      expiresAt: organization.demoExpiresAt,
      expired: demoExpired,
    },
    quotas: {
      communities: {
        used: usage.communities,
        max: organization.quotaCommunitiesMax,
        remaining: Math.max(0, organization.quotaCommunitiesMax - usage.communities),
        exceeded: usage.communities >= organization.quotaCommunitiesMax,
      },
      members: { used: 0, max: organization.quotaMembersMax },
      campaignsPerMonth: {
        used: usage.campaignsThisMonth,
        max: organization.quotaCampaignsMax,
        remaining: Math.max(0, organization.quotaCampaignsMax - usage.campaignsThisMonth),
        exceeded: usage.campaignsThisMonth >= organization.quotaCampaignsMax,
      },
    },
    canPerformSubscriptionActions: blockedBy === null,
    blockedBy,
  };
}

/**
 * Active la periode de demo 30 jours pour une organisation.
 *
 * Regles :
 * - demoUsed == false uniquement
 * - status == approved
 * - pas d'abonnement deja actif (subscriptionStartedAt == null)
 * - date calculee cote serveur, jamais depuis le client
 */
export function buildDemoActivation(now: Date = new Date()): {
  demoUsed: boolean;
  demoStartedAt: Date;
  demoExpiresAt: Date;
} {
  const expires = new Date(now);
  expires.setDate(expires.getDate() + 30);
  return {
    demoUsed: true,
    demoStartedAt: now,
    demoExpiresAt: expires,
  };
}

/**
 * Quotas appliques pendant la periode de demo.
 */
export const DEMO_QUOTAS = {
  quotaCommunitiesMax: 1,
  quotaMembersMax: 20,
  quotaCampaignsMax: 1,
} as const;

/**
 * Cree un snapshot d'abonnement dans l'historique.
 */
export function buildSubscriptionSnapshot(input: {
  organizationId: string;
  planId: string;
  planCode: string;
  planName: string;
  status: string;
  paymentStatus: string | null;
  quotaCommunitiesMax: number;
  quotaMembersMax: number;
  quotaCampaignsPerMonth: number;
  startedAt: Date | null;
  expiresAt: Date | null;
}): {
  organizationId: string;
  planId: string;
  planCode: string;
  planName: string;
  status: string;
  paymentStatus: string | null;
  quotaCommunitiesMax: number;
  quotaMembersMax: number;
  quotaCampaignsPerMonth: number;
  startedAt: Date | null;
  expiresAt: Date | null;
} {
  return {
    organizationId: input.organizationId,
    planId: input.planId,
    planCode: input.planCode,
    planName: input.planName,
    status: input.status,
    paymentStatus: input.paymentStatus,
    quotaCommunitiesMax: input.quotaCommunitiesMax,
    quotaMembersMax: input.quotaMembersMax,
    quotaCampaignsPerMonth: input.quotaCampaignsPerMonth,
    startedAt: input.startedAt,
    expiresAt: input.expiresAt,
  };
}