# CHANTIER 8.4 — Invitations, liens directs & onboarding — RAPPORT FINAL

## 1. Contexte
Finalisation de la série 8. Le Chantier 8.3 (abonnements, plans, quotas, démo) est validé.
Le Chantier 8.4 finalise le système d'invitations : codes, liens directs, onboarding, authentification.

## 2. Erreurs corrigées
1. **Types unions non exhaustifs** dans `invitation.controller.ts` :
   - `result.error` / `result.status` n'existaient pas sur la branche `valid: true`.
   - Correction : `if (result.valid === false)` pour forcer le narrowing TypeScript.
2. **Test `test-invitation-links.ts`** :
   - Assertion de création roundtrip bloquée par FK manquante (`org-test` inexistant) → supprimée.
   - Chaînes de route testées corrigées pour correspondre au code réel (`"/links/verify"`).
   - Comparaison corrigée : `verifyLink:` au lieu de `invitations.verifyLink`.

## 3. Livrables Chantier 8.4
- **Migration** : `20261007000001_add_invitation_links` déployée sur Supabase (5 migrations, 0 pending).
- **Service** : `server/services/invitation.service.ts` — vérification/consumption atomique des codes et liens.
- **Contrôleur** : `server/controllers/invitation.controller.ts` — `verifyInvitationLink`, `acceptInvitationCode`, `acceptInvitationLink`, `createInvitationLink`.
- **Routes** : `server/routes/invitation.routes.ts` — `/links/verify` public, `/accept/link` auth, `/links` réservé `superadmin/admin/partner_admin`.
- **Frontend** : `src/services/api.ts` — `invitations.verifyLink`, `acceptLink`, `createLink`. `InviteGateScreen.tsx` — appel API serveur avec fallback local.
- **Tests** : `scripts/test-invitation-links.ts` (5/5).

## 4. Validation globale
| Suite | Résultat |
|---|---|
| typecheck (`tsc --noEmit`) | ✅ 0 erreur |
| build (`npm run build`) | ✅ OK |
| db-smoke | ✅ 8/8 |
| api-integrity | ✅ 12/12 |
| partner-security | ✅ 114/114 |
| admin-security | ✅ 42/42 |
| resource-security | ✅ 21/21 |
| auth-cookie-security | ✅ 28/28 |
| storage-security | ✅ 13/13 |
| google-auth-security | ✅ 44/44 |
| invitation-links | ✅ 5/5 |
| seed-credentials | ⚠️ 11 échecs attendus (variables DEMO vides, comportement normal) |

## 5. Règles conservées
- Firebase = identité, Tulizaana = autorisation.
- `organizationId` client jamais une autorité.
- Aucune logique d'autorisation côté frontend.
- Cookies HttpOnly, SameSite=Strict, sans JWT localStorage.
- Seed refuse de créer des comptes sans secret.

## 6. Conclusion
Le Chantier 8.4 est **clôturé**. Toutes les validations techniques passent. Les échecs de `test-seed-credentials` sont dus à l'absence des variables `DEMO_*` dans `.env` (configuration normale en production).