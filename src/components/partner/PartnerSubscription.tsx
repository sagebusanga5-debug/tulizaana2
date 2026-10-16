import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Zap,
  Building2,
  ShieldCheck,
  ArrowRight,
  Smartphone,
Check,
  Clock,
  Lock,
  X,
  AlertCircle,
  Receipt,
  Download,
  Loader2,
  Globe,
  Radio,
} from 'lucide-react';
import { Organization } from '../../types';
import { api } from '../../services/api';

interface PartnerSubscriptionProps {
  organization: Organization;
  onUpgradePlan?: (newPlan: 'basic' | 'starter' | 'growth' | 'enterprise') => void;
}

interface PlanItem {
  id: 'basic' | 'starter' | 'growth' | 'enterprise';
  name: string;
  price: number;
  priceFormatted: string;
  description: string;
  maxMembers: string;
  maxCampaigns: string;
  storage: string;
  isPopular?: boolean;
  features: string[];
}

export const PartnerSubscription: React.FC<PartnerSubscriptionProps> = ({
  organization,
  onUpgradePlan,
}) => {
  const currentPlan = organization.subscriptionPlan;

  /**
   * Quotas reels de l'organisation, lus par le serveur.
   *
   * Aucune valeur n'est deduite du nom du plan : `Organization.quota*` est
   * l'autorite, et une organisation de seed peut porter des quotas plus
   * specifiques que le catalogue. Le champ reste donc vide tant que le
   * serveur n'a pas repondu, plutot que d'afficher une valeur inventee.
   */
  const [liveQuotas, setLiveQuotas] = useState<{
    communities: { used: number; max: number; remaining: number; exceeded: boolean };
    members: { used: number; max: number };
    campaignsPerMonth: { used: number; max: number; remaining: number; exceeded: boolean };
  } | null>(null);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await api.partner.organizationManage(organization.id);
      if (cancelled) return;
      if (res.success && res.data) {
        setLiveQuotas(res.data.quotas);
        setSubscriptionExpiry(res.data.subscription.expiresAt);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organization.id]);

  const plans: PlanItem[] = [
    {
      id: 'basic',
      name: 'Initiative & Communauté',
      price: 59,
      priceFormatted: '59 $ / mois',
      description: 'Pour les collectifs émergents, initiatives citoyennes et associations de proximité.',
      maxMembers: '250 membres',
      maxCampaigns: '1 campagne / mois',
      storage: '5 GB Cloudinary',
      features: [
        '1 Communauté fermée & sécurisée',
        'Codes d’invitation personnalisés',
        'Messagerie chiffrée de bout en bout',
        'Tableau de bord statistique basique',
      ],
    },
    {
      id: 'starter',
      name: 'Starter ONG',
      price: 149,
      priceFormatted: '149 $ / mois',
      description: 'Pour les petites associations locales débutant leurs premiers cercles de parole.',
      maxMembers: liveQuotas ? `${liveQuotas.members.max} membres` : '—',
      maxCampaigns: liveQuotas
        ? `${liveQuotas.campaignsPerMonth.max} campagnes / mois`
        : '—',
      storage: '10 GB Cloudinary',
      features: [
        '1 Communauté privée sécurisée',
        'Codes d’invitation personnalisés',
        'Messagerie et cercles sécurisés pour tous les membres',
        'Export rapports PDF standard',
      ],
    },
    {
      id: 'growth',
      name: 'Growth Association',
      price: 399,
      priceFormatted: '399 $ / mois',
      isPopular: true,
      description: 'Pour les ONG d’envergure nationale gérant plusieurs programmes thématiques.',
      maxMembers: '5,000 membres',
      maxCampaigns: '10 campagnes / mois',
      storage: '50 GB Cloudinary',
      features: [
        '5 Communautés privées distinctes',
        'Studio de campagne avancé (8 étapes)',
        'Tableaux de bord d’impact approfondis',
        'Modération multi-comptes avec journal d’audit',
        'Support prioritaire 24/7',
      ],
    },
    {
      id: 'enterprise',
      name: 'Institution & Fondation',
      price: 899,
      priceFormatted: '899 $ / mois',
      description: 'Pour les grands programmes internationaux, agences onusiennes et ministères.',
      maxMembers: '50,000+ membres',
      maxCampaigns: '50 campagnes / mois',
      storage: 'Stockage dédié sécurisé',
      features: [
        '25+ Communautés privées',
        'Intégration API & Webhooks sur-mesure',
        'Hébergement en région dédiée',
        'Accompagnement clinique dédié',
        'SLA 99.9% garanti',
      ],
    },
  ];

  // Checkout Modal State
  const [selectedPlanToCheckout, setSelectedPlanToCheckout] = useState<PlanItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'card'>('mobile_money');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  // Mobile Money fields
  const [mobileCountry, setMobileCountry] = useState<'cd' | 'ke' | 'ci' | 'sn' | 'rw'>('cd');
  const [mobileOperator, setMobileOperator] = useState('mpesa');
  const [mobilePhone, setMobilePhone] = useState('+243 99 876 5432');

  // Card fields
  const [cardName, setCardName] = useState(organization.name || '');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8912');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvc, setCardCvc] = useState('742');

  // Checkout Processing States
  const [isProcessing, setIsProcessing] = useState(false);
const [processingStep, setProcessingStep] = useState('');
const [paymentError, setPaymentError] = useState<string | null>(null);
const [requestAcknowledged, setRequestAcknowledged] = useState(false);

  const handleStartCheckout = (plan: PlanItem) => {
    setSelectedPlanToCheckout(plan);
    setPaymentError(null);
    setRequestAcknowledged(false);
    setIsProcessing(false);
  };

  const calculateFinalAmount = () => {
    if (!selectedPlanToCheckout) return 0;
    const base = selectedPlanToCheckout.price;
    if (billingPeriod === 'annual') {
      // 15% discount for annual billing
      return Math.round(base * 12 * 0.85);
    }
    return base;
  };

/**
 * Demande de changement de formule.
 *
 * Chantier 4 - plus aucune simulation de paiement.
 *
 * Avant : des minuteurs fictifs affichaient « Autorisation bancaire accordee »,
 * puis declenchaient des confettis, positionnaient `paymentSuccess = true` et
 * appelaient `onUpgradePlan`, qui elevait le plan ET les quotas cote client.
 *
 * Apres : la demande est enregistree cote serveur et ne change rien. La
 * formule, les quotas et l'etat de paiement restent inchanges jusqu'a une
 * validation administrative reelle. `subscription selected` ne devient jamais
 * `subscription active`.
 */
const handleSubmitPlanRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanToCheckout) return;

    setIsProcessing(true);
    setPaymentError(null);
    setProcessingStep('Transmission de la demande a la plateforme...');

    const res = await api.partner.requestSubscriptionChange(
      organization.id,
      selectedPlanToCheckout.id
    );

    setIsProcessing(false);

    if (!res.success) {
      setPaymentError(
        res.error || "La demande n'a pas pu etre transmise. Reessayez plus tard."
      );
      setProcessingStep('');
      return;
    }

    // Aucune validation n'est simulee : la demande reste en attente.
    setRequestAcknowledged(true);
    setProcessingStep('');
  };

  return (
    <div className="space-y-8">
      
      {/* 1. HEADER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#11192b] border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-extrabold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            <span>Gestion de la souscription partenaire</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Abonnements & Capacités d'Impact
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Paiement sécurisé par Mobile Money (M-Pesa, Airtel, Orange, MTN) ou cartes bancaires internationales (Visa, Mastercard). Débloquez des communautés supplémentaires et des quotas élargis.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex items-center gap-4 shrink-0">
          <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Forfait Actuel
            </span>
            <span className="text-base font-extrabold text-white">
              {plans.find((p) => p.id === currentPlan)?.name || 'Starter ONG'}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Actif • Renouvellement auto</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PLANS PRICING CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan;

          return (
            <div
              key={plan.id}
              className={`p-6 sm:p-8 rounded-3xl border flex flex-col justify-between relative transition-all duration-300 ${
                plan.isPopular
                  ? 'bg-gradient-to-b from-[#111c33] to-[#0b1220] border-cyan-500/50 shadow-2xl shadow-cyan-500/10 scale-100 lg:-translate-y-2'
                  : 'bg-[#0f172a] border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-linear-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-[10px] uppercase tracking-widest shadow-md">
                  Recommandé pour ONG régionales
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-white font-display">
                    {plan.name}
                  </h3>
                  <div className="text-2xl font-extrabold text-cyan-400 mt-1">
                    {plan.priceFormatted}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Capacité membres :</span>
                    <span className="font-bold text-white">{plan.maxMembers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Campagnes simultanées :</span>
                    <span className="font-bold text-white">{plan.maxCampaigns}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Stockage médias :</span>
                    <span className="font-bold text-white">{plan.storage}</span>
                  </div>
                </div>

                {/* Features list */}
                <ul className="space-y-2.5 text-xs text-slate-300">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800/80">
                {isCurrent ? (
                  <button
                    type="button"
                    onClick={() => handleStartCheckout(plan)}
                    className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-cyan-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Forfait Actuel (Renouveler)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartCheckout(plan)}
                    className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Passer à ce forfait</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. ACCEPTED PAYMENT CHANNELS BADGES */}
      <div className="p-6 rounded-3xl bg-[#0d1424] border border-slate-800 text-center space-y-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Moyens de paiement acceptés en Afrique et à l'international
        </span>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold flex items-center gap-1.5">
            📱 Vodacom M-Pesa
          </span>
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold flex items-center gap-1.5">
            📱 Airtel Money
          </span>
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold flex items-center gap-1.5">
            📱 Orange Money
          </span>
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold flex items-center gap-1.5">
            📱 MTN MoMo
          </span>
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold flex items-center gap-1.5">
            💳 Visa & Mastercard
          </span>
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold flex items-center gap-1.5">
            🛡️ Chiffrement TLS 1.3
          </span>
        </div>
      </div>

      {/* 4. CHECKOUT MODAL (MOBILE MONEY / BANK CARD) */}
      {selectedPlanToCheckout && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-[#11192b] rounded-3xl border border-slate-700 shadow-2xl p-6 sm:p-8 my-auto space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">
                    Paiement Sécurisé de l'Abonnement
                  </h3>
                  <p className="text-xs text-slate-400">
                    Forfait sélectionné : <span className="text-cyan-300 font-bold">{selectedPlanToCheckout.name}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isProcessing) setSelectedPlanToCheckout(null);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Demande enregistree : AUCUNE validation n'est simulee.
                Aucun numero de transaction n'est affiche, car aucun paiement
                n'a ete traite. Aucun quota n'est accorde a ce stade. */}
            {requestAcknowledged ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40">
                  <Clock className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-white font-display">
                    Demande transmise, en attente de validation
                  </h4>
                  <p className="text-xs text-slate-300">
                    Votre demande de formule <span className="text-cyan-400 font-bold">{selectedPlanToCheckout.name}</span> a ete enregistree.
                    Elle ne modifie ni vos quotas ni votre abonnement : tant que le
                    paiement n'est pas valide par la plateforme, la formule en cours
                    reste la seule active.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPlanToCheckout(null)}
                  className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-xl shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            ) : isProcessing ? (
              /* Traitement : simple transmission au serveur, aucun paiement. */
              <div className="p-8 text-center space-y-4">
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto" />
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-white">
                    Transmission de la demande...
                  </h4>
                  <p className="text-xs text-cyan-300 animate-pulse font-medium">
                    {processingStep}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Aucun montant n'est debite a cette etape.
                  </p>
                </div>
              </div>
            ) : (
              /* Checkout Form */
              <form onSubmit={handleSubmitPlanRequest} className="space-y-5">
                
                {/* Billing Period Selector */}
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setBillingPeriod('monthly')}
                    className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
                      billingPeriod === 'monthly'
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Facturation Mensuelle
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingPeriod('annual')}
                    className={`py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      billingPeriod === 'annual'
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Facturation Annuelle</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-extrabold">
                      -15%
                    </span>
                  </button>
                </div>

                {/* Payment Method Switcher */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">
                    Sélectionnez le mode de paiement :
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mobile_money')}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        paymentMethod === 'mobile_money'
                          ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-md shadow-cyan-500/10'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${paymentMethod === 'mobile_money' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Mobile Money</div>
                        <div className="text-[10px] text-slate-400">M-Pesa, Airtel, Orange, MTN</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-md shadow-cyan-500/10'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${paymentMethod === 'card' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Carte Bancaire</div>
                        <div className="text-[10px] text-slate-400">Visa, Mastercard, Amex</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Sub-form: Mobile Money */}
                {paymentMethod === 'mobile_money' && (
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Pays :
                        </label>
                        <select
                          value={mobileCountry}
                          onChange={(e) => setMobileCountry(e.target.value as any)}
                          className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                        >
                          <option value="cd">🇨🇩 R.D. Congo (+243)</option>
                          <option value="ke">🇰🇪 Kenya (+254)</option>
                          <option value="ci">🇨🇮 Côte d'Ivoire (+225)</option>
                          <option value="sn">🇸🇳 Sénégal (+221)</option>
                          <option value="rw">🇷🇼 Rwanda (+250)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Opérateur Mobile :
                        </label>
                        <select
                          value={mobileOperator}
                          onChange={(e) => setMobileOperator(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                        >
                          {mobileCountry === 'cd' && (
                            <>
                              <option value="mpesa">Vodacom M-Pesa</option>
                              <option value="airtel">Airtel Money</option>
                              <option value="orange">Orange Money</option>
                            </>
                          )}
                          {mobileCountry === 'ke' && (
                            <>
                              <option value="mpesa">Safaricom M-Pesa</option>
                              <option value="airtel">Airtel Money Kenya</option>
                            </>
                          )}
                          {mobileCountry === 'ci' && (
                            <>
                              <option value="orange">Orange Money CI</option>
                              <option value="mtn">MTN MoMo</option>
                              <option value="wave">Wave</option>
                            </>
                          )}
                          {mobileCountry === 'sn' && (
                            <>
                              <option value="wave">Wave Sénégal</option>
                              <option value="orange">Orange Money</option>
                              <option value="free">Free Money</option>
                            </>
                          )}
                          {mobileCountry === 'rw' && (
                            <>
                              <option value="mtn">MTN Mobile Money Rwanda</option>
                              <option value="airtel">Airtel Money Rwanda</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Numéro de téléphone Mobile Money :
                      </label>
                      <input
                        type="tel"
                        required
                        value={mobilePhone}
                        onChange={(e) => setMobilePhone(e.target.value)}
                        placeholder="+243 99 000 0000"
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-hidden focus:border-cyan-400"
                      />
                    </div>

                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-cyan-300">
                      <Zap className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        Une invitation USSD instantanée sera envoyée sur votre téléphone. Vous validerez la transaction en saisissant votre code PIN secret Mobile Money.
                      </span>
                    </div>
                  </div>
                )}

                {/* Sub-form: Card Payment */}
                {paymentMethod === 'card' && (
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Titulaire de la carte (Nom de l'ONG ou du Responsable) :
                      </label>
                      <input
                        type="text"
                        required
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Numéro de carte :
                      </label>
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-hidden focus:border-cyan-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Date d'expiration :
                        </label>
                        <input
                          type="text"
                          required
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/AA"
                          className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono text-center focus:outline-hidden focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          CVC / CVV :
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          required
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="•••"
                          className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono text-center focus:outline-hidden focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <Lock className="w-3 h-3" />
                        Chiffrement bancaire 3D Secure v2
                      </span>
                      <span>Visa • Mastercard • Amex</span>
                    </div>
                  </div>
                )}

                {/* Total & Action */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Souscription {selectedPlanToCheckout.name} ({billingPeriod === 'monthly' ? '1 mois' : '1 an'}) :</span>
                    <span className="font-bold">{calculateFinalAmount()} $ USD</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Frais de passerelle sécurisée :</span>
                    <span className="text-emerald-400 font-bold">Inclus (0,00 $)</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-sm font-bold text-white">Montant Total à Débiter :</span>
                    <span className="text-xl font-extrabold text-cyan-400">
                      {calculateFinalAmount()} $ USD
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlanToCheckout(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-7 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>
                      {isProcessing
                        ? 'Transmission en cours...'
                        : `Demander la formule ${selectedPlanToCheckout.name}`}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
