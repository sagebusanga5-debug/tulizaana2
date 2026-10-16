/**
 * Catalogue des plans partenaires.
 *
 * ATTENTION - ce fichier est une SOURCE DE DONNEES, PAS une autorite de securite.
 *
 * Il ne contient aucune fonction d'autorisation, volontairement. Un controle
 * d'acces qui importerait ce module pourrait interroger `plan === "enterprise"`
 * pour decider d'autoriser, ce qui est explicitement interdit.
 *
 * Architecture autorisee (configuration / affichage uniquement) :
 *
 *   Plan catalogue
 *        -> configuration / affichage / seed / valeurs par defaut de candidature
 *        -> Organization.quota*        <-- AUTORITE OPERATIONNELLE UNIQUE
 *        -> backend entitlement
 *        -> autorisation
 *
 * L'autorisation ne lit QUE les colonnes `Organization.quotaCommunitiesMax`,
 * `quotaMembersMax` et `quotaCampaignsMax`, relues en base a chaque requete.
 *
 * Valeurs reprises telles quelles du front existant (`src/data/mockData.ts`
 * `SUBSCRIPTION_PLANS` et `src/components/partner/PartnerSubscription.tsx`) :
 * aucune valeur n'est inventee. Le seed peut etre plus specifique que ce
 * catalogue et le seed prime toujours, car l'autorite reste la colonne stockee.
 */

export type PartnerPlanId = "basic" | "starter" | "growth" | "enterprise";

export const PARTNER_PLAN_IDS: readonly PartnerPlanId[] = [
  "basic",
  "starter",
  "growth",
  "enterprise",
] as const;

export interface PartnerPlanDefinition {
  id: PartnerPlanId;
  name: string;
  /** Montant mensuel de reference, en USD. Affichage uniquement : aucun paiement n'est traite ici. */
  priceMonthly: number;
  /** Nombre maximum de communautés. Valeur par défaut de configuration, jamais une autorisation. */
  maxCommunities: number;
  /** Nombre maximum de membres. Valeur par défaut de configuration. */
  maxMembers: number;
  /** Nombre maximum de campagnes par mois civil. Valeur par défaut de configuration. */
  maxCampaignsPerMonth: number;
  features: string[];
}

export const PARTNER_PLANS: Record<PartnerPlanId, PartnerPlanDefinition> = {
  basic: {
    id: "basic",
    name: "Initiative & Communaute",
    priceMonthly: 59,
    maxCommunities: 1,
    maxMembers: 250,
    maxCampaignsPerMonth: 1,
    features: [
      "1 Communaute fermee & securisee",
      "Codes d'invitation personnalises",
      "Messagerie chiffree de bout en bout",
      "Tableau de bord statistique basique",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter ONG",
    priceMonthly: 149,
    maxCommunities: 1,
    maxMembers: 500,
    maxCampaignsPerMonth: 2,
    features: [
      "1 Communaute privee securisee",
      "Jusqu'a 500 membres actifs",
      "2 campagnes collectives par mois",
      "Tableau de bord de moderation",
      "Support par email prioritaire",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth Association",
    priceMonthly: 399,
    maxCommunities: 5,
    maxMembers: 5000,
    maxCampaignsPerMonth: 10,
    features: [
      "5 Communautees privees distinctes",
      "Jusqu'a 5 000 membres par communaute",
      "10 campagnes collectives par mois",
      "Multi-animateurs & roles d'equipe",
      "Analytics approfondis & exports",
      "Support dedie 24/7",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Institution & Fondation",
    priceMonthly: 899,
    maxCommunities: 25,
    maxMembers: 50000,
    maxCampaignsPerMonth: 50,
    features: [
      "Communautes sur-mesure",
      "Quotas membres personnalises",
      "Campagnes illimitees avec suivi de cohortes",
      "API d'integration & webhook securises",
      "Accompagnement methodologique dedie",
      "Rapports institutionnels & bailleurs de fonds",
    ],
  },
};

/** true si la valeur correspond a un plan connu du catalogue. Validation de configuration uniquement. */
export function isKnownPartnerPlan(value: unknown): value is PartnerPlanId {
  return typeof value === "string" && (PARTNER_PLAN_IDS as readonly string[]).includes(value);
}

/**
 * Defauts de configuration d'un plan.
 *
 * Usage autorise : valeurs par defaut lors d'une candidature, ou affichage.
 * INTERDIT : s'en servir pour autoriser une action. L'autorisation compare
 * toujours la valeur au `Organization.quota*` stockee.
 */
export function planDefaults(plan: PartnerPlanId): {
  quotaCommunitiesMax: number;
  quotaMembersMax: number;
  quotaCampaignsMax: number;
} {
  const definition = PARTNER_PLANS[plan];
  return {
    quotaCommunitiesMax: definition.maxCommunities,
    quotaMembersMax: definition.maxMembers,
    quotaCampaignsMax: definition.maxCampaignsPerMonth,
  };
}