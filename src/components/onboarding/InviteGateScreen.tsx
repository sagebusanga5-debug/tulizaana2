import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  Users,
  Building2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Mail,
  Lock,
  Globe,
  AlertCircle,
  Check,
  Send,
  User,
  Phone,
  MessageCircle,
  HelpCircle,
  BookOpen,
  FileText,
  Upload,
  Trash2,
  MapPin,
  Plus,
  X,
  FileCheck,
  Sparkles,
  Compass,
  Target,
  Camera,
  Image as ImageIcon,
  ImagePlus,
  RotateCcw,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Community, Organization, InvitationCode, Language, UserProfile, LegalDocument } from '../../types';
import { TulizaanaLogo } from '../brand/TulizaanaBrand';
import { t } from '../../translations';
import { authenticateWithGoogle } from '../../services/googleAuthService';
import { api } from '../../services/api';

// Presets pour photo de profil / logo et couverture pour ONG & associations africaines
const PRESET_LOGOS = [
  { label: 'Croix Médicale & Écoute', url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=200&auto=format&fit=crop&q=80' },
  { label: 'Soins de santé', url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&auto=format&fit=crop&q=80' },
  { label: 'Cœur Solidaire', url: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=200&auto=format&fit=crop&q=80' },
  { label: 'Praticien / Écouteur', url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80' },
  { label: 'Cercle Communautaire', url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=200&auto=format&fit=crop&q=80' },
];

const PRESET_COVERS = [
  { label: 'Solidarité & Communauté', url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Écoute & Soins Bienveillants', url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Équipe Médicale Terrain', url: 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Cercle de Résilience', url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Mains Unies Humanitaires', url: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=1200&auto=format&fit=crop&q=80' },
];

interface InviteGateScreenProps {
  initialRole: 'user' | 'partner';
  communities: Community[];
  organizations: Organization[];
  invitations: InvitationCode[];
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  onBackToWelcome: () => void;
  onSuccessUserLogin: (communityId: string, userProfile?: Partial<UserProfile>) => void;
  onSuccessPartnerLogin: (organizationId: string) => void;
  onRegisterOrganization?: (organization: Organization) => void;
  onOpenAdminBackOffice?: () => void;
}

export const InviteGateScreen: React.FC<InviteGateScreenProps> = ({
  initialRole,
  communities = [],
  organizations = [],
  invitations = [],
  language,
  onSelectLanguage,
  onBackToWelcome,
  onSuccessUserLogin,
  onSuccessPartnerLogin,
  onRegisterOrganization,
  onOpenAdminBackOffice,
}) => {
  const [role, setRole] = useState<'user' | 'partner'>(initialRole);

  const authLang = t[language]?.auth || t.fr.auth;
  const commonLang = t[language]?.common || t.fr.common;

  // View state: 'login' | 'register_user' | 'register_partner' | 'user_submitted' | 'partner_submitted'
  const [viewState, setViewState] = useState<
    'login' | 'register_user' | 'register_partner' | 'user_submitted' | 'partner_submitted'
  >('login');

  // Login mode: 'code' | 'credentials'
  const [loginMethod, setLoginMethod] = useState<'code' | 'credentials'>('code');

  // Login inputs
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Status messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- BENEFICIARY MULTI-STEP REGISTRATION STATE ---
  const [userStep, setUserStep] = useState<1 | 2 | 3>(1);
  const [userForm, setUserForm] = useState({
    nameOrPseudo: '',
    email: '',
    whatsappNumber: '',
    password: '',
    motivation: '',
    selectedInterests: ['Drépanocytose'] as string[],
    prefLanguage: language as Language,
    selectedCommunityIds: [] as string[],
  });

  // --- PARTNER MULTI-STEP REGISTRATION STATE ---
  const [partnerStep, setPartnerStep] = useState<1 | 2 | 3>(1);
  const [partnerForm, setPartnerForm] = useState({
    orgName: '',
    acronym: '',
    orgType: 'ong' as Organization['type'],
    country: 'RDC',
    city: 'Kinshasa',
    logo: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&auto=format&fit=crop&q=80',
    description: '',
    vision: '',
    mission: '',
    interventionDomains: [
      'Santé mentale & Dépression',
      'Drépanocytose (Anémie SS/SC)',
    ] as string[],
    legalDocuments: [] as LegalDocument[],
    contactEmail: '',
    contactPhone: '',
    responsibleName: '',
    responsibleRole: 'Directeur / Coordinateur',
    password: '',
    estimatedBeneficiaries: '500+',
  });

  const [newDocType, setNewDocType] = useState<LegalDocument['documentType']>('agrement_ministeriel');
  const [newCustomDomain, setNewCustomDomain] = useState('');
  const [isDraggingDoc, setIsDraggingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const [logoInputUrl, setLogoInputUrl] = useState('');
  const [coverInputUrl, setCoverInputUrl] = useState('');
  const [showLogoUrlInput, setShowLogoUrlInput] = useState(false);
  const [showCoverUrlInput, setShowCoverUrlInput] = useState(false);
  const [createdOrgId, setCreatedOrgId] = useState<string>('');

  const handleUploadLogo = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setPartnerForm((prev) => ({ ...prev, logo: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadCover = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setPartnerForm((prev) => ({ ...prev, coverImage: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddLegalDocument = (file: File) => {
    const typeLabels: Record<LegalDocument['documentType'], string> = {
      agrement_ministeriel: "Arrêté ministériel d'agrément officiel",
      statuts_notaries: "Statuts notariés déposés au greffe",
      f92_rccm: "Certificat F92 / RCCM / NIF d'Afrique",
      attestation_siege: "Attestation de siège & localisation géographique",
      autre: "Document officiel d'accréditation légale",
    };

    const newDoc: LegalDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      documentType: newDocType,
      documentTypeLabel: typeLabels[newDocType] || 'Document officiel',
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date().toLocaleDateString('fr-FR'),
      status: 'pending_review',
    };

    setPartnerForm((prev) => ({
      ...prev,
      legalDocuments: [...prev.legalDocuments, newDoc],
    }));
  };

  const handleToggleDomain = (domain: string) => {
    setPartnerForm((prev) => {
      const exists = prev.interventionDomains.includes(domain);
      return {
        ...prev,
        interventionDomains: exists
          ? prev.interventionDomains.filter((d) => d !== domain)
          : [...prev.interventionDomains, domain],
      };
    });
  };

  const handleAddCustomDomain = () => {
    if (!newCustomDomain.trim()) return;
    if (!partnerForm.interventionDomains.includes(newCustomDomain.trim())) {
      setPartnerForm((prev) => ({
        ...prev,
        interventionDomains: [...prev.interventionDomains, newCustomDomain.trim()],
      }));
    }
    setNewCustomDomain('');
  };

  // Submitted info summary
  const [submittedCommunityName, setSubmittedCommunityName] = useState('');
  const [submittedWhatsapp, setSubmittedWhatsapp] = useState('');
  const [submittedOrgName, setSubmittedOrgName] = useState('');
  const [submittedOrgEmail, setSubmittedOrgEmail] = useState('');

  // Category labels matching CommunitiesView
  const categoryLabels: Record<string, string> = {
    chronic_disease: 'SENSIBILISATION & DRÉPANOCYTOSE',
    infectious: 'SENSIBILISATION & SUIVI ARV',
    trauma_gbv: 'TRAUMA, VBG & SORORITÉ',
    mental_health: 'SANTÉ MENTALE & SÉRÉNITÉ',
    disability: 'HANDICAP & INCLUSION',
    caregivers: 'PROCHES AIDANTS',
  };

  // --- LOGIN HANDLERS ---
  const handleValidateCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanCode = inviteCodeInput.trim().toUpperCase();

    if (!cleanCode) {
      setErrorMsg('Veuillez renseigner votre code d’invitation.');
      return;
    }

    try {
      const apiRes = await api.invitations.verify(cleanCode);

      if (apiRes.success && apiRes.data) {
        const data = apiRes.data as any;
        const communityId = data?.community?.id;
        const organizationId = data?.organization?.id;

        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        setSuccessMsg(`Code validé ! Bienvenue${data?.community?.name ? ` dans ${data.community.name}` : ''}.`);
        setTimeout(() => {
          if (role === 'partner') {
            onSuccessPartnerLogin(organizationId || organizations[0]?.id || 'org-drepano');
          } else {
            onSuccessUserLogin(communityId || communities[0]?.id || 'comm-drepano');
          }
        }, 600);
        return;
      }

      if (apiRes.status === 404 || apiRes.status === 400 || apiRes.status === 403) {
        setErrorMsg(apiRes.error || 'Code d’invitation non reconnu ou expiré.');
        return;
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Vérification du code impossible pour le moment.');
    }

    // Fallback local pour la démo si l’API est indisponible
    const foundInv = invitations.find(
      (inv) => inv.code.toUpperCase() === cleanCode && inv.status === 'active'
    );

    if (foundInv) {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      setSuccessMsg(`Code validé ! Bienvenue dans la communauté ${foundInv.communityName}.`);
      setTimeout(() => {
        if (role === 'partner') {
          onSuccessPartnerLogin(foundInv.organizationId);
        } else {
          onSuccessUserLogin(foundInv.communityId);
        }
      }, 600);
      return;
    }

    if (role === 'partner') {
      const matchedOrg =
        organizations.find(
          (o) =>
            cleanCode.includes(o.acronym?.toUpperCase() || '') ||
            cleanCode === `TLZ-ORG-${o.id.toUpperCase()}` ||
            cleanCode === 'TLZ-PARTNER-DEMO'
        ) || organizations[0];

      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      setSuccessMsg(`Code Partenaire validé ! Accès accordé à ${matchedOrg.name}.`);
      setTimeout(() => {
        onSuccessPartnerLogin(matchedOrg.id);
      }, 600);
      return;
    }

    const matchedCommunity = communities.find(
      (c) =>
        cleanCode.includes(c.slug.toUpperCase()) ||
        cleanCode.includes(c.id.toUpperCase()) ||
        cleanCode === 'TLZ-SANCTUARY-2026' ||
        cleanCode === 'TLZ-DEMO-ACCESS' ||
        cleanCode.startsWith('TLZ-')
    );

    if (matchedCommunity) {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      setSuccessMsg(`Code validé ! Bienvenue dans ${matchedCommunity.name}.`);
      setTimeout(() => {
        onSuccessUserLogin(matchedCommunity.id);
      }, 600);
      return;
    }

    setErrorMsg(
      'Code d’invitation non reconnu ou expiré. Vérifiez votre saisie ou demandez une invitation.'
    );
  };

  const handleLoginWithCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setErrorMsg('Veuillez renseigner votre identifiant et votre mot de passe.');
      return;
    }

    try {
      const loginRes = await api.auth.login({
        identifier: loginIdentifier.trim(),
        password: loginPassword,
      });

      if (!loginRes.success) {
        setErrorMsg(loginRes.error || 'Connexion refusee par le serveur.');
        return;
      }

      if (role === 'partner') {
        const managed = await api.partner.managedOrganizations();
        const firstOrg = managed.data?.[0];

        if (!managed.success || !firstOrg) {
          setErrorMsg("Aucune organisation partenaire n'est associee a ce compte sur le serveur.");
          return;
        }

        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        setSuccessMsg(`Connexion reussie. Bienvenue dans l'espace ${firstOrg.name} !`);
        setTimeout(() => {
          onSuccessPartnerLogin(firstOrg.id);
        }, 500);
        return;
      }

      const serverUser = loginRes.data?.user || {};
      const firstCommunity = communities[0]?.id || 'comm-drepano';

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      setSuccessMsg(`Connexion reussie. Bienvenue, ${serverUser.name || loginIdentifier} !`);
      setTimeout(() => {
        onSuccessUserLogin(firstCommunity, {
          name: serverUser.name || loginIdentifier,
          email: serverUser.email,
          avatar: serverUser.avatar,
          role: serverUser.role,
        });
      }, 500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Connexion impossible pour le moment.');
    }
  };
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Authentification Google réelle via popup Firebase Auth
      const googleProfile = await authenticateWithGoogle();

      // 2. Synchronisation avec le backend API Tulizaana.
      // Seul le Firebase ID token est transmis (en-tete Authorization) : il est la
      // seule preuve d'identite acceptee par le serveur. Les informations de profil
      // restent uniquement pour l'affichage local.
      const apiRes = await api.auth.googleLogin({
        idToken: googleProfile.idToken,
        invitationCode: inviteCodeInput.trim() || undefined,
      });

      if (!apiRes.success) {
        // Le serveur refuse l'acces (pas d'invitation valide, compte suspendu,
        // jeton expire...). On remonte le refus au lieu de laisser croire a une
        // connexion reussie.
        setErrorMsg(
          apiRes.error || "Connexion Google refusee. Un code d'invitation valide peut etre requis."
        );
        return;
      }

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      setSuccessMsg(`Bienvenue ${googleProfile.displayName} ! Authentification Google réussie.`);

      setTimeout(() => {
        if (role === 'partner') {
          onSuccessPartnerLogin(organizations[0]?.id || 'org-drepano');
        } else {
          onSuccessUserLogin(communities[0]?.id || 'comm-drepano', {
            name: googleProfile.displayName,
            email: googleProfile.email,
            avatar: googleProfile.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          });
        }
      }, 700);
    } catch (err: any) {
      console.warn('Google Sign-In failed or cancelled:', err);
      setErrorMsg(err.message || 'La connexion avec Google a échoué.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Google pre-fill for registration using real Google Account
  const handleGooglePreFill = async () => {
    setIsGoogleLoading(true);
    setErrorMsg(null);

    try {
      const googleProfile = await authenticateWithGoogle();
      setUserForm((prev) => ({
        ...prev,
        nameOrPseudo: googleProfile.displayName,
        email: googleProfile.email,
      }));
      setSuccessMsg(`Informations vérifiées et pré-remplies pour ${googleProfile.displayName} (${googleProfile.email}) !`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.warn('Google Pre-Fill cancelled or failed:', err);
      setErrorMsg(err.message || 'Impossible de récupérer les informations Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // --- BENEFICIARY REGISTRATION STEP HANDLERS ---
  const handleToggleCommunitySelection = (communityId: string) => {
    setUserForm((prev) => {
      const exists = prev.selectedCommunityIds.includes(communityId);
      return {
        ...prev,
        selectedCommunityIds: exists
          ? prev.selectedCommunityIds.filter((id) => id !== communityId)
          : [...prev.selectedCommunityIds, communityId],
      };
    });
  };

  const handleToggleInterest = (interest: string) => {
    setUserForm((prev) => {
      const exists = prev.selectedInterests.includes(interest);
      return {
        ...prev,
        selectedInterests: exists
          ? prev.selectedInterests.filter((i) => i !== interest)
          : [...prev.selectedInterests, interest],
      };
    });
  };

  const handleUserStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!userForm.nameOrPseudo.trim()) {
      setErrorMsg('Veuillez renseigner votre prénom, nom ou pseudonyme.');
      return;
    }
    if (!userForm.whatsappNumber.trim()) {
      setErrorMsg('Veuillez indiquer votre numéro WhatsApp avec l’indicatif (ex: +243...) pour recevoir votre invitation.');
      return;
    }
    if (!userForm.password.trim() || userForm.password.length < 4) {
      setErrorMsg('Veuillez définir un mot de passe d’au moins 4 caractères.');
      return;
    }

    setUserStep(2);
  };

  const handleUserStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setUserStep(3);
  };

  const handleFinalizeUserRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (userForm.selectedCommunityIds.length === 0) {
      setErrorMsg('Vous devez rejoindre au moins une communaute pour valider votre inscription.');
      return;
    }

    const chosenComm =
      communities.find((c) => c.id === userForm.selectedCommunityIds[0]) || communities[0];

    try {
      const registerRes = await api.auth.register({
        name: userForm.nameOrPseudo,
        email: userForm.email || `${userForm.nameOrPseudo.toLowerCase().replace(/\s+/g, '')}@tulizaana.org`,
        password: userForm.password,
        phoneNumber: userForm.whatsappNumber,
        invitationCode: inviteCodeInput.trim() || undefined,
        role: 'member',
      });

      if (!registerRes.success) {
        setErrorMsg(registerRes.error || "Le serveur n'a pas pu enregistrer l'inscription.");
        return;
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Le serveur n'a pas pu enregistrer l'inscription.");
      return;
    }

    setSubmittedCommunityName(chosenComm.name);
    setSubmittedWhatsapp(userForm.whatsappNumber);
    setViewState('user_submitted');
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.5 } });
  };
  // --- PARTNER REGISTRATION HANDLERS ---
  const handleFinalizePartnerRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!partnerForm.orgName.trim() || !partnerForm.contactEmail.trim() || !partnerForm.responsibleName.trim()) {
      setErrorMsg('Veuillez remplir les informations obligatoires de votre structure.');
      return;
    }

    const orgId = `org-${Date.now()}`;
    const newOrg: Organization = {
      id: orgId,
      name: partnerForm.orgName.trim(),
      acronym: partnerForm.acronym.trim() || undefined,
      country: partnerForm.country,
      city: partnerForm.city.trim() || 'Kinshasa',
      type: partnerForm.orgType,
      domain: partnerForm.interventionDomains[0] || 'Santé Mentale & Soutien psychosocial',
      description: partnerForm.description.trim() || `Organisation humanitaire ${partnerForm.orgName} basée à ${partnerForm.city || 'Kinshasa'} (${partnerForm.country}).`,
      vision: partnerForm.vision.trim() || "Promouvoir l'accès aux soins psychologiques et la résilience collective en Afrique.",
      mission: partnerForm.mission.trim() || "Accompagner les personnes vulnérables par des cercles de parole et un suivi solidaire.",
      interventionDomains: partnerForm.interventionDomains.length > 0 ? partnerForm.interventionDomains : ['Santé Mentale', 'Soutien psychosocial'],
      legalDocuments: partnerForm.legalDocuments,
      responsibleName: partnerForm.responsibleName.trim(),
      contactEmail: partnerForm.contactEmail.trim(),
      contactPhone: partnerForm.contactPhone.trim(),
      logo: partnerForm.logo || 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=200&auto=format&fit=crop&q=80',
      coverImage: partnerForm.coverImage || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&auto=format&fit=crop&q=80',
      status: 'pending',
      isVerified: false,
      subscriptionPlan: 'starter',
      quotaCommunities: { used: 0, max: 3 },
      quotaMembers: { used: 0, max: 500 },
      quotaCampaignsPerMonth: { used: 0, max: 10 },
      createdAt: new Date().toISOString(),
    };

    if (onRegisterOrganization) {
      onRegisterOrganization(newOrg);
    }

    setCreatedOrgId(orgId);
    setSubmittedOrgName(partnerForm.orgName);
    setSubmittedOrgEmail(partnerForm.contactEmail);
    setViewState('partner_submitted');
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.5 } });
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* 1. HEADER (SIMPLIFIED & CLEAN) */}
      <header className="sticky top-0 z-30 bg-[#0c121e]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        
        {/* Left: Home button + Tulizaana Wordmark */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onBackToWelcome}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{authLang.backHome}</span>
          </button>

          <TulizaanaLogo size="sm" iconClassName="w-6 h-6" />
        </div>

        {/* Center/Right: Simple Role Switcher & Context Action */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Header Switcher: Mode Membre / Mode Partenaire (Icons only) */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-bold">
            <button
              onClick={() => {
                setRole('user');
                setViewState('login');
                setErrorMsg(null);
              }}
              title={authLang.switchMember}
              aria-label={authLang.switchMember}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                role === 'user'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setRole('partner');
                setViewState('login');
                setErrorMsg(null);
              }}
              title={authLang.switchPartner}
              aria-label={authLang.switchPartner}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                role === 'partner'
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Header Toggle between Login and Registration */}
          {viewState !== 'login' && viewState !== 'user_submitted' && viewState !== 'partner_submitted' && (
            <button
              onClick={() => {
                setViewState('login');
                setErrorMsg(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-extrabold transition-all cursor-pointer hidden md:flex items-center gap-1.5"
            >
              <span>{authLang.alreadyAccount}</span>
            </button>
          )}

          {/* Language selector (visible on both mobile and desktop) */}
          <div
            id="login-language-switcher"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <select
              value={language}
              onChange={(e) => onSelectLanguage(e.target.value as Language)}
              aria-label={authLang.changeLanguage || "Changer de langue"}
              className="bg-transparent text-slate-200 font-bold focus:outline-hidden cursor-pointer text-xs"
            >
              <option value="en" className="bg-slate-900 text-white">EN</option>
              <option value="fr" className="bg-slate-900 text-white">FR</option>
              <option value="ar" className="bg-slate-900 text-white">AR</option>
              <option value="pt" className="bg-slate-900 text-white">PT</option>
              <option value="sw" className="bg-slate-900 text-white">SW</option>
            </select>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-center">
        
        {/* ========================================================================= */}
        {/* VIEW 1: LOGIN (CODE INVITATION OU PSEUDO/MOT DE PASSE OU GOOGLE)          */}
        {/* ========================================================================= */}
        {viewState === 'login' && (
          <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-xl mx-auto w-full">
            
            {/* Header Text */}
            <div className="text-center space-y-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
                {role === 'user' ? authLang.welcomeUserTitle : authLang.welcomePartnerTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                {role === 'user' ? authLang.welcomeUserSubtitle : authLang.welcomePartnerSubtitle}
              </p>
            </div>

            {/* Login Card */}
            <div className="rounded-3xl bg-linear-to-b from-[#111a28] to-[#0c1320] border border-slate-800 p-6 sm:p-8 shadow-2xl shadow-cyan-950/20 space-y-5">
              
              {/* Method Switch: Code d'invitation vs Compte existant */}
              <div className="flex p-1 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setLoginMethod('code')}
                  className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer text-center ${
                    loginMethod === 'code'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {authLang.tabCode}
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('credentials')}
                  className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer text-center ${
                    loginMethod === 'credentials'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {authLang.tabCredentials}
                </button>
              </div>

              {/* OPTION A: CODE D'INVITATION (NO KEY ICON) */}
              {loginMethod === 'code' ? (
                <form onSubmit={handleValidateCode} className="space-y-4">
                  <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-200/90 text-xs leading-relaxed">
                    <span className="font-semibold text-cyan-300">Première visite :</span> Réservé aux nouveaux membres munis de leur code d’invitation confidentiel reçu après validation de leur demande.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      {authLang.labelAccessCode}
                    </label>
                    <input
                      type="text"
                      value={inviteCodeInput}
                      onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                      placeholder={role === 'user' ? authLang.placeholderCodeUser : authLang.placeholderCodePartner}
                      className="w-full bg-[#080d16] border-2 border-slate-700 focus:border-cyan-400 rounded-2xl px-5 py-3.5 text-center text-base sm:text-lg font-mono font-black text-white tracking-widest uppercase placeholder:text-slate-600 focus:outline-hidden transition-all shadow-inner"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-5 rounded-2xl bg-linear-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all active:scale-98 cursor-pointer"
                  >
                    <span>{authLang.btnValidateCode}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* OPTION B: SE CONNECTER (MEMBRES DÉJÀ INSCRITS) */
                <div className="space-y-3.5">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 text-xs leading-relaxed">
                    <span className="font-semibold text-white">Déjà membre :</span> Réservé aux membres déjà inscrits revenant sur l’application. Connectez-vous avec vos identifiants ou votre compte Google.
                  </div>

                  <form onSubmit={handleLoginWithCredentials} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        {authLang.labelIdentifier}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          placeholder="Ex : Sage Busanga ou mon_pseudo"
                          className="w-full bg-[#080d16] border border-slate-700 focus:border-cyan-400 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-hidden"
                        />
                        <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        {authLang.labelPassword}
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#080d16] border border-slate-700 focus:border-cyan-400 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-hidden"
                        />
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 px-5 rounded-2xl bg-linear-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all active:scale-98 cursor-pointer"
                    >
                      <span>{authLang.btnLogin}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  {/* Séparateur pour Google */}
                  <div className="relative flex py-1 items-center">
                    <div className="grow border-t border-slate-800"></div>
                    <span className="shrink mx-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      ou
                    </span>
                    <div className="grow border-t border-slate-800"></div>
                  </div>

                  {/* Bouton Google réservé à la reconnexion */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md"
                  >
                    {isGoogleLoading ? (
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    )}
                    <span>{isGoogleLoading ? 'Connexion avec Google...' : authLang.orGoogle}</span>
                  </button>
                </div>
              )}

              {/* Error & Success Messages */}
              {errorMsg && (
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Divider */}
              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-slate-800"></div>
                <span className="shrink mx-3 text-[11px] font-bold text-slate-500 uppercase">
                  {role === 'user' ? authLang.noAccountUser : authLang.noAccountPartner}
                </span>
                <div className="grow border-t border-slate-800"></div>
              </div>

              {/* TRIGGER MULTI-STEP REGISTRATION */}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setViewState(role === 'user' ? 'register_user' : 'register_partner');
                }}
                className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  role === 'user'
                    ? 'bg-slate-900 hover:bg-slate-850 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 hover:border-cyan-500/60'
                    : 'bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 hover:text-purple-200 border border-purple-500/40 hover:border-purple-400'
                }`}
              >
                {role === 'user' ? (
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Building2 className="w-4 h-4 text-purple-400" />
                )}
                <span>
                  {role === 'user'
                    ? authLang.btnRequestAccessUser
                    : authLang.btnRegisterPartner}
                </span>
              </button>

              {/* Demo codes fast test tray */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 text-center">
                  Codes de test pour démonstration rapide :
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {(role === 'user'
                    ? [
                        { code: 'TLZ-DREPANO-77', label: 'Drépanocytose' },
                        { code: 'TLZ-SURVIVANTES-01', label: 'Survivantes' },
                        { code: 'TLZ-AFYAMIND-99', label: 'Santé Mentale' },
                      ]
                    : [
                        { code: 'TLZ-ORG-PANZI', label: 'Panzi' },
                        { code: 'TLZ-ORG-ALD', label: 'ALD' },
                        { code: 'TLZ-PARTNER-DEMO', label: 'Partenaire' },
                      ]
                  ).map((item) => (
                    <button
                      key={item.code}
                      onClick={() => {
                        setLoginMethod('code');
                        setInviteCodeInput(item.code);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 font-mono text-[11px] transition-all cursor-pointer"
                    >
                      {item.code} <span className="text-slate-500 font-sans">({item.label})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: CRÉATION DE COMPTE / DEMANDE D'INVITATION BÉNÉFICIAIRE (3 ÉTAPES) */}
        {/* ========================================================================= */}
        {viewState === 'register_user' && (
          <div className="space-y-6 animate-fade-in max-w-3xl mx-auto w-full">
            
            {/* Header Text (Simplified, no return button in body) */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                Créer votre compte Tulizaana
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
                Rejoignez une communauté d’entraide. Votre communauté vous enverra votre code d’invitation sur WhatsApp.
              </p>
            </div>

            {/* Stepper Progress Bar */}
            <div className="flex items-center justify-between max-w-md mx-auto px-4">
              {[
                { step: 1, label: 'Profil' },
                { step: 2, label: 'Besoins' },
                { step: 3, label: 'Communauté' },
              ].map((s, idx) => (
                <React.Fragment key={s.step}>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                        userStep === s.step
                          ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/20 shadow-md'
                          : userStep > s.step
                          ? 'bg-teal-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {userStep > s.step ? <Check className="w-4 h-4 stroke-[3]" /> : s.step}
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        userStep >= s.step ? 'text-cyan-300' : 'text-slate-500'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {idx < 2 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${
                        userStep > idx + 1 ? 'bg-teal-500' : 'bg-slate-800'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* STEP 1: IDENTIFIANTS & COORDONNÉES WHATSAPP */}
            {userStep === 1 && (
              <form
                onSubmit={handleUserStep1Next}
                className="rounded-3xl bg-[#0f1726] border border-slate-800 p-6 sm:p-8 space-y-5 shadow-xl"
              >
                {/* Google Pre-fill quick button */}
                <button
                  type="button"
                  onClick={handleGooglePreFill}
                  disabled={isGoogleLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 disabled:opacity-60 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isGoogleLoading ? (
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>{isGoogleLoading ? 'Récupération depuis Google...' : 'Pré-remplir mes informations avec Google'}</span>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name or Pseudonym */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Prénom, Nom ou Pseudonyme *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={userForm.nameOrPseudo}
                        onChange={(e) =>
                          setUserForm({ ...userForm, nameOrPseudo: e.target.value })
                        }
                        placeholder="Ex : Sage Busanga ou ÉtoileDuMatin"
                        className="w-full bg-[#080d16] border border-slate-700 focus:border-cyan-400 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-hidden"
                      />
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Adresse Email (optionnelle)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        placeholder="votre.email@exemple.com"
                        className="w-full bg-[#080d16] border border-slate-700 focus:border-cyan-400 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-hidden"
                      />
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                {/* WhatsApp Number (MANDATORY TO RECEIVE THE INVITATION CODE) */}
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <label className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                      Numéro WhatsApp (pour recevoir votre code d'invitation) *
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={userForm.whatsappNumber}
                      onChange={(e) =>
                        setUserForm({ ...userForm, whatsappNumber: e.target.value })
                      }
                      placeholder="Ex : +243 89 000 0000"
                      className="w-full bg-[#080d16] border border-emerald-500/50 focus:border-emerald-400 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-hidden font-mono"
                    />
                    <Phone className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[11px] text-emerald-300/80">
                    🔒 C'est sur ce numéro que la communauté que vous rejoignez vous enverra votre code d'invitation unique après validation.
                  </p>
                </div>

                {/* Password creation */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Définir un Mot de passe de connexion *
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-[#080d16] border border-slate-700 focus:border-cyan-400 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-hidden"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Vous permettra de vous reconnecter à tout moment sans redemander de code.
                  </span>
                </div>

                {errorMsg && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  <span>Suivant : Mon parcours & besoins</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 2: MOTIVATION, BESOINS & LANGUE */}
            {userStep === 2 && (
              <form
                onSubmit={handleUserStep2Next}
                className="rounded-3xl bg-[#0f1726] border border-slate-800 p-6 sm:p-8 space-y-5 shadow-xl"
              >
                {/* Motivation Text */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase">
                    Quelques mots sur votre situation ou votre parcours :
                  </label>
                  <textarea
                    rows={3}
                    value={userForm.motivation}
                    onChange={(e) => setUserForm({ ...userForm, motivation: e.target.value })}
                    placeholder="Ex : Je vis avec une maladie chronique et je cherche un espace bienveillant pour partager mon vécu et trouver des conseils fraternels..."
                    className="w-full bg-[#080d16] border border-slate-700 focus:border-cyan-400 rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-hidden resize-none"
                  />
                  <span className="text-[11px] text-slate-400">
                    Ces informations restent strictement confidentielles et permettent aux modérateurs de valider votre adhésion.
                  </span>
                </div>

                {/* Needs and Interests tags */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase">
                    Thématiques d’entraide qui vous concernent :
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Drépanocytose',
                      'Santé Mentale & Anxiété',
                      'VIH & Suivi Thérapeutique',
                      'Trauma, VBG & Sororité',
                      'Maladies Chroniques',
                      'Proches Aidants',
                      'Deuil & Résilience',
                    ].map((interest) => {
                      const isSelected = userForm.selectedInterests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => handleToggleInterest(interest)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                          }`}
                        >
                          {isSelected && '✓ '}
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Language Preference */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase">
                    Langue principale souhaitée pour les échanges :
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'en', label: 'English' },
                      { id: 'fr', label: 'Français' },
                      { id: 'ar', label: 'العربية' },
                      { id: 'pt', label: 'Português' },
                    ].map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setUserForm({ ...userForm, prefLanguage: l.id as Language })}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          userForm.prefLanguage === l.id
                            ? 'bg-teal-500/20 border-teal-400 text-teal-300 font-black'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setUserStep(1)}
                    className="py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-xs transition-all cursor-pointer"
                  >
                    ← Précédent
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-3.5 px-6 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                  >
                    <span>Suivant : Choisir ma communauté</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: CHOIX OBLIGATOIRE D'AU MOINS UNE COMMUNAUTÉ (MÊME DESIGN QUE COMMUNITIESVIEW) */}
            {userStep === 3 && (
              <form onSubmit={handleFinalizeUserRegistration} className="space-y-6">
                <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-cyan-300 font-bold">
                    <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                    <span>Sélectionnez au moins une communauté fermée à rejoindre :</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-cyan-500 text-slate-950 font-black text-xs shrink-0">
                    {userForm.selectedCommunityIds.length} sélectionnée(s)
                  </span>
                </div>

                {/* COMMUNITIES GRID WITH EXACT COMMUNITIESVIEW CARD DESIGN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {communities.map((comm) => {
                    const isSelected = userForm.selectedCommunityIds.includes(comm.id);
                    const org = organizations.find((o) => o.id === comm.organizationId);
                    const orgName = comm.organizationName || org?.name || 'ONG Partenaire';

                    return (
                      <div
                        key={comm.id}
                        onClick={() => handleToggleCommunitySelection(comm.id)}
                        className={`bg-[#0e1626] border-2 rounded-[28px] overflow-hidden transition-all duration-300 shadow-xl flex flex-col justify-between group cursor-pointer select-none relative ${
                          isSelected
                            ? 'border-cyan-400 shadow-cyan-500/20 ring-2 ring-cyan-400/40 bg-[#121c2d]'
                            : 'border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        {/* TOP COVER BANNER IMAGE WITH DARK FADE GRADIENT */}
                        <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-900">
                          <img
                            src={comm.coverImage || comm.image}
                            alt={comm.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />

                          {/* Dark gradient overlay */}
                          <div className="absolute inset-0 bg-linear-to-t from-[#0e1626] via-[#0e1626]/70 to-black/40" />

                          {/* Top-Left: Org badge */}
                          <div className="absolute top-3 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 max-w-[85%]">
                            <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20 shrink-0 bg-slate-800">
                              <img
                                src={comm.image || org?.logo}
                                alt={orgName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-[11px] font-bold text-white/95 truncate">
                              {orgName}
                            </span>
                          </div>

                          {/* Top-Right: Selection Badge */}
                          <div
                            className={`absolute top-3 right-4 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-cyan-500 border-white text-slate-950 shadow-md scale-110'
                                : 'bg-black/60 border-white/40 text-transparent'
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        </div>

                        {/* CARD BODY: TITLE, SUBTITLE & DESCRIPTION */}
                        <div className="px-5 pt-2 pb-3 space-y-1.5 flex-1">
                          <h3
                            className={`text-lg sm:text-xl font-black font-display tracking-tight leading-tight transition-colors ${
                              isSelected ? 'text-cyan-300' : 'text-white'
                            }`}
                          >
                            {comm.name}
                          </h3>

                          <div className="text-[10px] font-black uppercase tracking-wider text-teal-400 font-mono">
                            {categoryLabels[comm.category] || 'COMMUNAUTÉ & ENTRAIDE'}
                          </div>

                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                            {comm.description}
                          </p>
                        </div>

                        {/* BOTTOM FOOTER BAR */}
                        <div className="px-5 py-3 bg-[#090f1a]/90 border-t border-slate-800/80 flex items-center justify-between gap-3">
                          {/* Left Stats: 👥 • 💬 */}
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                            <span className="flex items-center gap-1">
                              <span>👥</span>
                              <span>{comm.membersCount}</span>
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="flex items-center gap-1">
                              <span>💬</span>
                              <span>{comm.postsCount || 430}</span>
                            </span>
                          </div>

                          {/* Action Pill */}
                          <span
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all ${
                              isSelected
                                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {isSelected ? '✓ Sélectionnée' : '+ Choisir cette communauté'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {errorMsg && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setUserStep(2)}
                    className="py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-xs transition-all cursor-pointer"
                  >
                    ← Précédent
                  </button>

                  <button
                    type="submit"
                    disabled={userForm.selectedCommunityIds.length === 0}
                    className="flex-1 py-4 px-6 rounded-2xl bg-linear-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 disabled:opacity-50 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer active:scale-98"
                  >
                    <Send className="w-4 h-4" />
                    <span>Valider mon inscription et demander mon code</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ============================================================================== */}
        {/* VIEW 3: CRÉER UN PROFIL ORGANISATION (DOCS LÉGAUX, LOCALISATION, VISION, DOMAINES) */}
        {/* ============================================================================== */}
        {viewState === 'register_partner' && (
          <div className="space-y-6 animate-fade-in max-w-3xl mx-auto w-full pb-10">
            {/* Header with Back Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setViewState('login')}
                className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour à la connexion partenaire</span>
              </button>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold w-fit">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Preuves d'existence en Afrique & Charte éthique</span>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                Déposer une candidature de partenariat
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                Renseignez la localisation de votre organisation en Afrique, vos domaines d’intervention, votre vision et téléversez vos documents légaux pour vérification.
                La candidature est examinée par la plateforme : elle n’accorde aucun accès au portail partenaire avant approbation.
              </p>
            </div>

            <form
              onSubmit={handleFinalizePartnerRegistration}
              className="rounded-3xl bg-[#111422] border border-purple-500/30 p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              {/* SECTION 1: IDENTITÉ & LOCALISATION EN AFRIQUE */}
              <div className="space-y-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                  <Building2 className="w-4 h-4" />
                  <span>1. Identité & Localisation en Afrique</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Nom de l'Organisation / ONG *
                    </label>
                    <input
                      type="text"
                      required
                      value={partnerForm.orgName}
                      onChange={(e) => setPartnerForm({ ...partnerForm, orgName: e.target.value })}
                      placeholder="Ex : Fondation Panzi, ALD-RDC, SOS Drépanocytose..."
                      className="w-full bg-[#090b14] border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Sigle / Acronyme
                    </label>
                    <input
                      type="text"
                      value={partnerForm.acronym}
                      onChange={(e) => setPartnerForm({ ...partnerForm, acronym: e.target.value })}
                      placeholder="Ex : FP, ALD..."
                      className="w-full bg-[#090b14] border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Type de structure *
                    </label>
                    <select
                      value={partnerForm.orgType}
                      onChange={(e) =>
                        setPartnerForm({
                          ...partnerForm,
                          orgType: e.target.value as Organization['type'],
                        })
                      }
                      className="w-full bg-[#090b14] border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-hidden cursor-pointer"
                    >
                      <option value="ong">ONG Locale / Internationale</option>
                      <option value="association">Association de Patients</option>
                      <option value="fondation">Fondation Humanitaire</option>
                      <option value="hopital">Hôpital / Centre Médical</option>
                      <option value="institution">Institution Publique / Ministère</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-purple-400" />
                      <span>Pays d'Afrique *</span>
                    </label>
                    <select
                      value={partnerForm.country}
                      onChange={(e) => setPartnerForm({ ...partnerForm, country: e.target.value })}
                      className="w-full bg-[#090b14] border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-hidden cursor-pointer"
                    >
                      <option value="RDC">RDC (RD Congo)</option>
                      <option value="Sénégal">Sénégal</option>
                      <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                      <option value="Cameroun">Cameroun</option>
                      <option value="Rwanda">Rwanda</option>
                      <option value="Burundi">Burundi</option>
                      <option value="Guinée">Guinée</option>
                      <option value="Mali">Mali</option>
                      <option value="Bénin">Bénin</option>
                      <option value="Togo">Togo</option>
                      <option value="Congo-Brazzaville">Congo-Brazzaville</option>
                      <option value="Gabon">Gabon</option>
                      <option value="Burkina Faso">Burkina Faso</option>
                      <option value="Niger">Niger</option>
                      <option value="Tchad">Tchad</option>
                      <option value="Centrafrique">Centrafrique</option>
                      <option value="Madagascar">Madagascar</option>
                      <option value="Autre Afrique">Autre pays africain</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-purple-400" />
                      <span>Ville du siège *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={partnerForm.city}
                      onChange={(e) => setPartnerForm({ ...partnerForm, city: e.target.value })}
                      placeholder="Ex : Kinshasa, Bukavu, Goma, Dakar, Abidjan..."
                      className="w-full bg-[#090b14] border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: IDENTITÉ VISUELLE (LOGO & COUVERTURE) */}
              <div className="space-y-5 pb-5 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                    <ImageIcon className="w-4 h-4" />
                    <span>2. Identité Visuelle : Photo de profil (Logo) & Couverture</span>
                  </div>
                  <span className="text-[11px] text-purple-300/90 bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/30 font-medium">
                    Logo & Bannière
                  </span>
                </div>

                {/* 1. Aperçu dynamique en direct (Live Card) */}
                <div className="rounded-2xl border border-purple-500/30 overflow-hidden bg-slate-950 shadow-xl">
                  {/* Bannière de couverture */}
                  <div className="relative h-32 sm:h-44 w-full bg-slate-900 overflow-hidden">
                    {partnerForm.coverImage ? (
                      <img
                        src={partnerForm.coverImage}
                        alt="Couverture de l'organisation"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-r from-purple-950 via-slate-900 to-slate-950 flex items-center justify-center text-slate-500">
                        <ImageIcon className="w-8 h-8 opacity-40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-slate-950/95 via-slate-950/30 to-transparent" />

                    {/* Actions sur la couverture */}
                    <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                      <button
                        type="button"
                        onClick={() => coverFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-slate-950/85 hover:bg-slate-900 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md shadow-md transition-all cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-purple-400" />
                        <span>Changer la couverture</span>
                      </button>
                      {partnerForm.coverImage && (
                        <button
                          type="button"
                          onClick={() => setPartnerForm((prev) => ({ ...prev, coverImage: '' }))}
                          title="Supprimer la photo de couverture"
                          className="p-1.5 rounded-xl bg-slate-950/85 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 text-xs backdrop-blur-md transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Logo en médaillon & infos en superposition */}
                  <div className="px-4 sm:px-6 pb-4 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-3 -mt-10 sm:-mt-14">
                    <div className="flex items-end gap-3.5">
                      {/* Médaillon Logo */}
                      <div className="relative">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900 border-4 border-[#111422] shadow-2xl overflow-hidden flex items-center justify-center shrink-0">
                          {partnerForm.logo ? (
                            <img
                              src={partnerForm.logo}
                              alt="Logo"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building2 className="w-8 h-8 text-purple-400" />
                          )}
                        </div>

                        {/* Bouton rapide upload sur le logo */}
                        <button
                          type="button"
                          onClick={() => logoFileInputRef.current?.click()}
                          title="Téléverser votre logo / photo de profil"
                          className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all cursor-pointer border border-purple-400"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Titre & Localisation preview */}
                      <div className="pb-1">
                        <h4 className="text-base sm:text-lg font-black text-white leading-tight">
                          {partnerForm.orgName.trim() || 'Nom de votre organisation'}
                          {partnerForm.acronym.trim() && (
                            <span className="text-purple-400 ml-1.5 font-mono text-sm font-semibold">
                              ({partnerForm.acronym.trim()})
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-purple-400" />
                          <span>{partnerForm.city.trim() || 'Ville'} ({partnerForm.country})</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-purple-300 uppercase font-semibold text-[10px] tracking-wider">
                            {partnerForm.orgType}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 italic">
                      Aperçu de la carte publique
                    </div>
                  </div>
                </div>

                {/* Inputs cachés de type file pour logo et couverture */}
                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadLogo(file);
                    e.target.value = '';
                  }}
                />
                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadCover(file);
                    e.target.value = '';
                  }}
                />

                {/* 2. Commandes de personnalisation côte à côte */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                  
                  {/* Option A: Photo de profil (Logo) */}
                  <div className="p-4 rounded-2xl bg-[#090b14] border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-purple-400" />
                        <span>Photo de profil (Logo officiel)</span>
                      </label>
                      <span className="text-[10px] text-slate-400">PNG, JPG, SVG, WebP</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Téléverser mon logo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowLogoUrlInput(!showLogoUrlInput)}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
                      >
                        {showLogoUrlInput ? 'Fermer URL' : 'Lien URL'}
                      </button>
                    </div>

                    {showLogoUrlInput && (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="url"
                          value={logoInputUrl}
                          onChange={(e) => setLogoInputUrl(e.target.value)}
                          placeholder="https://.../mon-logo.png"
                          className="flex-1 bg-[#05070d] border border-slate-700 focus:border-purple-400 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (logoInputUrl.trim()) {
                              setPartnerForm((prev) => ({ ...prev, logo: logoInputUrl.trim() }));
                              setLogoInputUrl('');
                              setShowLogoUrlInput(false);
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-purple-500 text-white font-bold text-xs cursor-pointer"
                        >
                          Appliquer
                        </button>
                      </div>
                    )}

                    {/* Presets rapides de logos */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-400 block font-medium">
                        Ou choisir un modèle de logo :
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_LOGOS.map((item, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => setPartnerForm((prev) => ({ ...prev, logo: item.url }))}
                            className={`flex items-center gap-1.5 p-1 pr-2 rounded-xl border text-[11px] transition-all cursor-pointer ${
                              partnerForm.logo === item.url
                                ? 'bg-purple-950/80 border-purple-400 text-purple-200 font-bold'
                                : 'bg-slate-900/70 hover:bg-slate-800 border-slate-800 text-slate-400'
                            }`}
                          >
                            <img
                              src={item.url}
                              alt={item.label}
                              className="w-5 h-5 rounded-lg object-cover"
                            />
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Option B: Photo de couverture */}
                  <div className="p-4 rounded-2xl bg-[#090b14] border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                        <span>Photo de couverture (Bannière)</span>
                      </label>
                      <span className="text-[10px] text-slate-400">1200 x 400 recommandé</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => coverFileInputRef.current?.click()}
                        className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                        <span>Téléverser une couverture</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowCoverUrlInput(!showCoverUrlInput)}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
                      >
                        {showCoverUrlInput ? 'Fermer URL' : 'Lien URL'}
                      </button>
                    </div>

                    {showCoverUrlInput && (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="url"
                          value={coverInputUrl}
                          onChange={(e) => setCoverInputUrl(e.target.value)}
                          placeholder="https://.../ma-banniere.jpg"
                          className="flex-1 bg-[#05070d] border border-slate-700 focus:border-purple-400 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (coverInputUrl.trim()) {
                              setPartnerForm((prev) => ({ ...prev, coverImage: coverInputUrl.trim() }));
                              setCoverInputUrl('');
                              setShowCoverUrlInput(false);
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-purple-500 text-white font-bold text-xs cursor-pointer"
                        >
                          Appliquer
                        </button>
                      </div>
                    )}

                    {/* Presets rapides de couvertures */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-400 block font-medium">
                        Ou choisir une photo thématique Afrique :
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_COVERS.map((item, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => setPartnerForm((prev) => ({ ...prev, coverImage: item.url }))}
                            className={`flex items-center gap-1.5 p-1 pr-2 rounded-xl border text-[11px] transition-all cursor-pointer ${
                              partnerForm.coverImage === item.url
                                ? 'bg-purple-950/80 border-purple-400 text-purple-200 font-bold'
                                : 'bg-slate-900/70 hover:bg-slate-800 border-slate-800 text-slate-400'
                            }`}
                          >
                            <img
                              src={item.url}
                              alt={item.label}
                              className="w-6 h-4 rounded-md object-cover"
                            />
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* SECTION 3: DESCRIPTION, VISION ET MISSION */}
              <div className="space-y-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>3. Présentation, Vision & Mission</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Description de l'organisation *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={partnerForm.description}
                    onChange={(e) =>
                      setPartnerForm({ ...partnerForm, description: e.target.value })
                    }
                    placeholder="Présentez l'historique, l'ancrage local et les actions sur le terrain auprès des communautés..."
                    className="w-full bg-[#090b14] border border-slate-700 focus:border-purple-400 rounded-xl p-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-hidden resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-purple-400" />
                      <span>Vision à long terme *</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={partnerForm.vision}
                      onChange={(e) =>
                        setPartnerForm({ ...partnerForm, vision: e.target.value })
                      }
                      placeholder="L'avenir et le changement durable que vous souhaitez voir pour les communautés en Afrique..."
                      className="w-full bg-[#090b14] border border-slate-700 focus:border-purple-400 rounded-xl p-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-hidden resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-purple-400" />
                      <span>Mission auprès des bénéficiaires *</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={partnerForm.mission}
                      onChange={(e) =>
                        setPartnerForm({ ...partnerForm, mission: e.target.value })
                      }
                      placeholder="Vos engagements concrets, programmes d'écoute et de prise en charge au quotidien..."
                      className="w-full bg-[#090b14] border border-slate-700 focus:border-purple-400 rounded-xl p-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-hidden resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: DOMAINES D'INTERVENTION */}
              <div className="space-y-4 pb-4 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                    <Target className="w-4 h-4" />
                    <span>4. Domaines d'intervention en Afrique</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {partnerForm.interventionDomains.length} sélectionné(s)
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    'Santé mentale & Dépression',
                    'Drépanocytose (Anémie SS/SC)',
                    'Traumatismes, Violences sexuelles & VSBG',
                    'Cercles de parole & Écoute active',
                    'VIH / Sida & Maladies chroniques',
                    'Santé maternelle & Néonatale',
                    'Handicap, Neurodiversité & Inclusion',
                    'Proches Aidants & Familles',
                    'Nutrition, Résilience & Réinsertion',
                  ].map((dom) => {
                    const isSelected = partnerForm.interventionDomains.includes(dom);
                    return (
                      <button
                        type="button"
                        key={dom}
                        onClick={() => handleToggleDomain(dom)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-purple-500 text-white shadow-md shadow-purple-500/25 border border-purple-400'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Plus className="w-3.5 h-3.5 shrink-0 text-slate-500" />}
                        <span>{dom}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Ajout d'un domaine personnalisé */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newCustomDomain}
                    onChange={(e) => setNewCustomDomain(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomDomain();
                      }
                    }}
                    placeholder="Ajouter un autre domaine d'intervention spécifique..."
                    className="flex-1 bg-[#090b14] border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-2 text-xs text-white focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomDomain}
                    className="px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter</span>
                  </button>
                </div>
              </div>

              {/* SECTION 5: TÉLÉVERSEMENT DES DOCUMENTS LÉGAUX (PREUVES D'EXISTENCE EN AFRIQUE) */}
              <div className="space-y-4 pb-4 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                    <FileCheck className="w-4 h-4" />
                    <span>5. Documents légaux (preuves d'existence en Afrique)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {partnerForm.legalDocuments.length} document(s) joint(s)
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Pour garantir l'intégrité de la communauté, chaque structure partenaire doit déposer ses documents administratifs légaux délivrés par les autorités compétentes du pays hôte.
                </p>

                {/* Choix du type de document à téléverser */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Type de document à joindre
                    </label>
                    <select
                      value={newDocType}
                      onChange={(e) => setNewDocType(e.target.value as LegalDocument['documentType'])}
                      className="w-full bg-[#090b14] border border-slate-700 focus:border-purple-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden cursor-pointer"
                    >
                      <option value="agrement_ministeriel">Arrêté ministériel d'agrément officiel / Arrêté provincial</option>
                      <option value="f92_rccm">Certificat F92 / RCCM / Numéro Impôt (NIF) d'Afrique</option>
                      <option value="statuts_notaries">Statuts notariés déposés au greffe du tribunal</option>
                      <option value="attestation_siege">Attestation de siège & existence géographique en Afrique</option>
                      <option value="autre">Autre document d'accréditation légale officielle</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleAddLegalDocument(file);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-600/20"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Téléverser un document</span>
                    </button>
                  </div>
                </div>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingDoc(true);
                  }}
                  onDragLeave={() => setIsDraggingDoc(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingDoc(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleAddLegalDocument(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                    isDraggingDoc
                      ? 'border-purple-400 bg-purple-500/15'
                      : 'border-slate-700 hover:border-purple-500/60 bg-[#090b14]/60'
                  }`}
                >
                  <Upload className="w-6 h-6 text-purple-400 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-white">
                    Glissez-déposez ici votre fichier légal ou cliquez pour parcourir
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Formats acceptés : PDF, DOCX, PNG, JPG (Max 10 Mo par pièce)
                  </p>
                </div>

                {/* Liste des documents téléversés */}
                {partnerForm.legalDocuments.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase block">
                      Documents légaux rattachés au profil :
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {partnerForm.legalDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#090b14] border border-purple-500/30 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate text-xs" title={doc.fileName}>
                                {doc.fileName}
                              </p>
                              <p className="text-[10px] text-purple-300 truncate">
                                {doc.documentTypeLabel} • {doc.fileSize}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                              ✓ Transmis
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setPartnerForm((prev) => ({
                                  ...prev,
                                  legalDocuments: prev.legalDocuments.filter((d) => d.id !== doc.id),
                                }))
                              }
                              className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Retirer ce document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 6: RÉFÉRENT & CONTACTS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                  <User className="w-4 h-4" />
                  <span>6. Référent Institutionnel & Contact</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Nom du Coordinateur / Responsable *
                    </label>
                    <input
                      type="text"
                      required
                      value={partnerForm.responsibleName}
                      onChange={(e) =>
                        setPartnerForm({ ...partnerForm, responsibleName: e.target.value })
                      }
                      placeholder="Ex : Dr. Denise Mwambayi"
                      className="w-full bg-[#090b14] border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Rôle / Fonction
                    </label>
                    <input
                      type="text"
                      value={partnerForm.responsibleRole}
                      onChange={(e) =>
                        setPartnerForm({ ...partnerForm, responsibleRole: e.target.value })
                      }
                      placeholder="Ex : Directrice Exécutive, Secrétaire Général"
                      className="w-full bg-[#090b14] border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Email Institutionnel *
                    </label>
                    <input
                      type="email"
                      required
                      value={partnerForm.contactEmail}
                      onChange={(e) =>
                        setPartnerForm({ ...partnerForm, contactEmail: e.target.value })
                      }
                      placeholder="contact@votre-ong.org"
                      className="w-full bg-[#090b14] border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Téléphone / WhatsApp de contact *
                    </label>
                    <input
                      type="tel"
                      required
                      value={partnerForm.contactPhone}
                      onChange={(e) => setPartnerForm({ ...partnerForm, contactPhone: e.target.value })}
                      placeholder="+243 ..."
                      className="w-full bg-[#090b14] border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-hidden font-mono"
                    />
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 px-6 rounded-2xl bg-linear-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all cursor-pointer active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Envoyer ma candidature</span>
              </button>
            </form>
          </div>
        )}

        {/* ============================================================================== */}
        {/* VIEW 4: CONFIRMATION INSCRIPTION BÉNÉFICIAIRE (ATTENTE CODE SUR WHATSAPP)      */}
        {/* ============================================================================== */}
        {viewState === 'user_submitted' && (
          <div className="space-y-6 animate-fade-in max-w-xl mx-auto w-full text-center">
            
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
              <MessageCircle className="w-8 h-8 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                Demande d’inscription enregistrée !
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Votre demande d’adhésion pour la communauté{' '}
                <strong className="text-cyan-300 font-bold">{submittedCommunityName}</strong> a été transmise aux modérateurs.
              </p>
            </div>

            {/* Instruction Card */}
            <div className="rounded-3xl bg-[#0d1624] border border-emerald-500/30 p-6 text-left space-y-3.5 shadow-xl">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Envoi de votre code d'invitation sécurisé</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Pour garantir la sécurité et le secret du cercle, votre code d'invitation unique vous sera envoyé directement par message sur votre compte WhatsApp :
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/40 flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Numéro WhatsApp renseigné :
                  </span>
                  <span className="text-sm font-mono font-black text-white">
                    {submittedWhatsapp || '+243 ...'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-normal">
                Dès réception de votre code, revenez sur cette page pour l'entrer et déverrouiller immédiatement votre accès à la communauté.
              </p>
            </div>

            {/* Action to go back to code input */}
            <button
              onClick={() => {
                setViewState('login');
                setLoginMethod('code');
              }}
              className="w-full py-4 px-6 rounded-2xl bg-linear-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer active:scale-98"
            >
              <span>J'ai reçu mon code → L'entrer maintenant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ============================================================================== */}
        {/* ============================================================================== */}
        {/* VIEW 5: CONFIRMATION DOSSIER ORGANISATION (EN ATTENTE DE VALIDATION BACK-OFFICE) */}
        {/* ============================================================================== */}
        {viewState === 'partner_submitted' && (
          <div className="space-y-6 animate-fade-in max-w-xl mx-auto w-full text-center">
            
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-950/40">
              <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                <span>Soumission reçue • En attente de validation</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                Dossier transmis à l'équipe de Tulizaana
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                La demande d'accréditation pour <strong className="text-amber-300 font-bold">{submittedOrgName}</strong> a été enregistrée. Elle est actuellement soumise à la vérification de conformité légale par notre équipe centrale.
              </p>
            </div>

            {/* Instruction & Status Card */}
            <div className="rounded-3xl bg-[#121324] border border-amber-500/30 overflow-hidden text-left shadow-xl">
              {/* Petite bannière avec logo */}
              <div className="relative h-24 w-full bg-slate-900 overflow-hidden">
                {partnerForm.coverImage ? (
                  <img
                    src={partnerForm.coverImage}
                    alt="Bannière"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-80"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-r from-amber-950 via-slate-900 to-slate-950" />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-[#121324] via-transparent to-transparent" />
                
                {/* Logo en médaillon */}
                <div className="absolute -bottom-3 left-6 w-14 h-14 rounded-xl bg-slate-900 border-2 border-amber-500/50 shadow-md overflow-hidden flex items-center justify-center">
                  {partnerForm.logo ? (
                    <img
                      src={partnerForm.logo}
                      alt="Logo"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-amber-400" />
                  )}
                </div>
              </div>

              <div className="p-6 pt-5 space-y-3.5">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Building2 className="w-4 h-4" />
                  <span>Statut d'accréditation du compte</span>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Structure candidate :</span>
                    <span className="font-bold text-white">{submittedOrgName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Statut du compte :</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      En attente de validation Back-Office
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Localisation :</span>
                    <span className="font-medium text-slate-200">{partnerForm.city} ({partnerForm.country})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Pièces légales soumises :</span>
                    <span className="font-bold text-emerald-400">{partnerForm.legalDocuments.length} document(s) rattaché(s)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Email institutionnel de contact :</span>
                    <span className="font-mono text-slate-200">{submittedOrgEmail}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                  🛡️ <strong>Protocole de sécurité Tulizaana :</strong> Toutes les organisations partenaires font l'objet d'un audit administratif par l'équipe centrale avant d'être autorisées à animer des communautés sensibles et délivrer des invitations.
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setViewState('login');
                  setLoginMethod('credentials');
                }}
                className="w-full py-4 px-6 rounded-2xl bg-linear-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 transition-all cursor-pointer active:scale-98"
              >
                <span>Retour à la page de connexion</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 3. FOOTER */}
      <footer className="border-t border-slate-800/80 px-4 py-4 text-center text-xs text-slate-500 space-y-1">
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={onOpenAdminBackOffice}
            title="Tulizaana Ecosystem"
            className="font-extrabold text-cyan-400 font-display tracking-wider hover:text-cyan-300 hover:underline cursor-pointer transition-colors"
          >
            TULIZAANA ECOSYSTEM
          </button>
          <span className="text-slate-700">•</span>
          <span className="text-slate-400">Communauté & Résilience Holistique</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Tulizaana • Espace Sécurisé par Chiffrement & Charte de Confidentialité
        </p>
      </footer>
    </div>
  );
};
