-- Chantier 4 : cycle de vie de l'abonnement partenaire.
--
-- Migration strictement additive : uniquement des colonnes NULLables sur
-- `Organization`. Aucun DROP, aucun ALTER TYPE, aucun backfill, donc aucune
-- donnee existante n'est modifiee et aucune migration historique n'est touchee.
--
-- Ces colonnes separent deux axes qui etaient confondus :
--   * `status`                -> approbation de la candidature (Chantier 3)
--   * abonnement + paiement   -> cycle de vie commercial
--
-- Une organisation `approved` n'est donc PAS automatiquement active.
--
-- `paymentStatus` n'est jamais ecrit depuis une requete client publique.
-- Il n'est renseigne que par une action superadmin explicite ou par le seed.
-- Aucun paiement n'est simule et aucun prestataire de paiement n'est invente :
-- tant que la valeur reste `pending`, les mutations soumises a abonnement sont refusees.

ALTER TABLE "Organization"
  ADD COLUMN "subscriptionStartedAt" TIMESTAMP(3),
  ADD COLUMN "subscriptionExpiresAt" TIMESTAMP(3),
  ADD COLUMN "paymentStatus" TEXT;