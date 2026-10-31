import React, { useState, useRef } from 'react';
import {
  Building2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Mail,
  Lock,
  MapPin,
  Camera,
  Image as ImageIcon,
  FileText,
  Upload,
  Trash2,
  X,
  Plus,
  Check,
  Send,
  User,
  Phone,
  Globe,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { LegalDocument } from '../../types';

const PRESET_LOGOS = [
  { label: 'Croix Médicale & Écoute', url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=200&auto=format&fit=crop&q=80' },
  { label: 'Cœur Solidaire', url: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=200&auto=format&fit=crop&q=80' },
  { label: 'Cercle Communautaire', url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=200&auto=format&fit=crop&q=80' },
];

const PRESET_COVERS = [
  { label: 'Solidarité & Communauté', url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Écoute & Soins Bienveillants', url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Équipe Médicale Terrain', url: 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Cercle de Résilience', url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Mains Unies Humanitaires', url: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=1200&auto=format&fit=crop&q=80' },
];

const INTERVENTION_DOMAINS = [
  'Santé mentale & Dépression',
  'Drépanocytose (Anémie SS/SC)',
  'Traumatismes, Violences sexuelles & VSBG',
  'Cercles de parole & Écoute active',
  'VIH / Sida & Maladies chroniques',
  'Santé maternelle & Néonatale',
  'Handicap, Neurodiversité & Inclusion',
  'Proches Aidants & Familles',
  'Nutrition, Résilience & Réinsertion',
];

const DOCUMENT_TYPES = [
  { value: 'agrement_ministeriel', label: "Arrêté ministériel d'agrément officiel / Arrêté provincial" },
  { value: 'statuts_notaries', label: 'Statuts notariés déposés au greffe' },
  { value: 'f92_rccm', label: 'Certificat F92 / RCCM / NIF d\'Afrique' },
  { value: 'attestation_siege', label: 'Attestation de siège & localisation géographique' },
  { value: 'autre', label: 'Document officiel d\'accréditation légale' },
];

const COUNTRIES = [
  'RDC', 'Rwanda', 'Burundi', 'Kenya', 'Ouganda', 'Tanzanie', 'Éthiopie', 'Nigeria', 'Ghana', 'Sénégal',
];

const ORG_TYPES = [
  { value: 'ong', label: 'ONG' },
  { value: 'association', label: 'Association' },
  { value: 'hospital', label: 'Hôpital / Centre de santé' },
  { value: 'clinic', label: 'Clinique' },
  { value: 'fondation', label: 'Fondation' },
];

interface PartnerRegistrationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const PartnerRegistrationForm: React.FC<PartnerRegistrationFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Étape 1: Identité et localisation
    orgName: '',
    acronym: '',
    orgType: 'ong' as typeof ORG_TYPES[number]['value'],
    country: 'RDC',
    city: 'Kinshasa',
    
    // Étape 2: Identité visuelle
    logo: PRESET_LOGOS[0].url,
    coverImage: PRESET_COVERS[0].url,
    
    // Étape 3: Présentation, vision et mission
    description: '',
    vision: '',
    mission: '',
    
    // Étape 4: Domaines d'intervention
    interventionDomains: [] as string[],
    customDomain: '',
    
    // Étape 5: Documents légaux
    legalDocuments: [] as LegalDocument[],
    newDocType: 'agrement_ministeriel' as LegalDocument['documentType'],
    
    // Étape 6: Référent et identifiants futurs
    responsibleName: '',
    responsibleTitle: 'Directeur / Coordinateur',
    contactEmail: '',
    contactPhone: '',
    password: '',
    confirmPassword: '',
  });

  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadLogo = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setFormData((prev) => ({ ...prev, logo: result }));
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setErrorMsg('Erreur lors du chargement du logo');
    }
  };

  const handleUploadCover = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setFormData((prev) => ({ ...prev, coverImage: result }));
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setErrorMsg('Erreur lors du chargement de la couverture');
    }
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
      documentType: formData.newDocType,
      documentTypeLabel: typeLabels[formData.newDocType] || 'Document officiel',
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date().toLocaleDateString('fr-FR'),
      status: 'pending_review',
    };

    setFormData((prev) => ({
      ...prev,
      legalDocuments: [...prev.legalDocuments, newDoc],
    }));
  };

  const handleToggleDomain = (domain: string) => {
    setFormData((prev) => {
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
    if (!formData.customDomain.trim()) return;
    if (!formData.interventionDomains.includes(formData.customDomain.trim())) {
      setFormData((prev) => ({
        ...prev,
        interventionDomains: [...prev.interventionDomains, formData.customDomain.trim()],
        customDomain: '',
      }));
    }
  };

  const validateStep1 = (): boolean => {
    if (!formData.orgName.trim()) {
      setErrorMsg('Le nom de l\'organisation est obligatoire');
      return false;
    }
    if (!formData.country) {
      setErrorMsg('Le pays est obligatoire');
      return false;
    }
    if (!formData.city.trim()) {
      setErrorMsg('La ville est obligatoire');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const validateStep2 = (): boolean => {
    setErrorMsg(null);
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!formData.description.trim()) {
      setErrorMsg('La présentation est obligatoire');
      return false;
    }
    if (!formData.vision.trim()) {
      setErrorMsg('La vision est obligatoire');
      return false;
    }
    if (!formData.mission.trim()) {
      setErrorMsg('La mission est obligatoire');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const validateStep4 = (): boolean => {
    if (formData.interventionDomains.length === 0) {
      setErrorMsg('Sélectionnez au moins un domaine d\'intervention');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const validateStep5 = (): boolean => {
    if (formData.legalDocuments.length === 0) {
      setErrorMsg('Ajoutez au moins un document légal');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const validateStep6 = (): boolean => {
    if (!formData.responsibleName.trim()) {
      setErrorMsg('Le nom du responsable est obligatoire');
      return false;
    }
    if (!formData.contactEmail.trim()) {
      setErrorMsg('L\'adresse e-mail est obligatoire');
      return false;
    }
    if (!formData.contactPhone.trim()) {
      setErrorMsg('Le numéro de téléphone est obligatoire');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      setErrorMsg('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep6()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.organizations.create({
        name: formData.orgName.trim(),
        acronym: formData.acronym.trim() || undefined,
        type: formData.orgType,
        country: formData.country,
        city: formData.city.trim(),
        domain: formData.interventionDomains[0] || 'Santé Mentale & Soutien psychosocial',
        mission: formData.mission.trim(),
        description: formData.description.trim(),
        responsibleName: formData.responsibleName.trim(),
        responsibleTitle: formData.responsibleTitle,
        contactEmail: formData.contactEmail.trim(),
        contactPhone: formData.contactPhone.trim(),
        password: formData.password,
        vision: formData.vision.trim(),
        interventionDomains: formData.interventionDomains,
        legalDocuments: formData.legalDocuments,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Erreur lors de l\'envoi de la demande');
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg('Votre demande a bien été envoyée');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur lors de l\'envoi de la demande');
      setIsSubmitting(false);
    }
  };

  const goToNextStep = () => {
    setErrorMsg(null);
    switch (currentStep) {
      case 1:
        if (validateStep1()) setCurrentStep(2);
        break;
      case 2:
        if (validateStep2()) setCurrentStep(3);
        break;
      case 3:
        if (validateStep3()) setCurrentStep(4);
        break;
      case 4:
        if (validateStep4()) setCurrentStep(5);
        break;
      case 5:
        if (validateStep5()) setCurrentStep(6);
        break;
      case 6:
        if (validateStep6()) setCurrentStep(7);
        break;
    }
  };

  const goToPrevStep = () => {
    setErrorMsg(null);
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as 1 | 2 | 3 | 4 | 5 | 6);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white">Présentez votre organisation</h2>
            <p className="text-sm text-slate-300">Renseignez les informations de base de votre structure.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Nom de l'organisation ou de l'ONG *
                </label>
                <input
                  type="text"
                  value={formData.orgName}
                  onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                  placeholder="Ex : Fondation Panzi"
                  className="w-full bg-[#080d16] border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Sigle ou acronyme
                </label>
                <input
                  type="text"
                  value={formData.acronym}
                  onChange={(e) => setFormData({ ...formData, acronym: e.target.value })}
                  placeholder="Ex : FP"
                  className="w-full bg-[#080d16] border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Type de structure *
                </label>
                <select
                  value={formData.orgType}
                  onChange={(e) => setFormData({ ...formData, orgType: e.target.value as any })}
                  className="w-full bg-[#080d16] border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden"
                >
                  {ORG_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Pays d'Afrique *
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full bg-[#080d16] border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden"
                >
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Ville du siège *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ex : Kinshasa"
                  className="w-full bg-[#080d16] border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white">Donnez une identité à votre organisation</h2>
            <p className="text-sm text-slate-300">Choisissez un logo et une couverture pour votre profil public.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Logo</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PRESET_LOGOS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setFormData({ ...formData, logo: preset.url })}
                      className={`p-2 rounded-xl border-2 transition-all ${
                        formData.logo === preset.url
                          ? 'border-purple-400 bg-purple-500/20'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-16 object-cover rounded-lg" />
                      <p className="text-[10px] text-slate-300 mt-1 truncate">{preset.label}</p>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="p-2 rounded-xl border-2 border-dashed border-slate-600 hover:border-purple-400 flex flex-col items-center justify-center gap-1 transition-all"
                  >
                    <Camera className="w-6 h-6 text-slate-400" />
                    <span className="text-[10px] text-slate-400">Téléverser</span>
                  </button>
                  <input
                    ref={logoFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUploadLogo(e.target.files[0])}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Couverture</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PRESET_COVERS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setFormData({ ...formData, coverImage: preset.url })}
                      className={`p-2 rounded-xl border-2 transition-all ${
                        formData.coverImage === preset.url
                          ? 'border-purple-400 bg-purple-500/20'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-12 object-cover rounded-lg" />
                      <p className="text-[10px] text-slate-300 mt-1 truncate">{preset.label}</p>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => coverFileInputRef.current?.click()}
                    className="p-2 rounded-xl border-2 border-dashed border-slate-600 hover:border-purple-400 flex flex-col items-center justify-center gap-1 transition-all"
                  >
                    <ImageIcon className="w-6 h-6 text-slate-400" />
                    <span className="text-[10px] text-slate-400">Téléverser</span>
                  </button>
                  <input
                    ref={coverFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUploadCover(e.target.files[0])}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <p className="text-xs font-bold text-slate-300 mb-2">Aperçu de la carte publique</p>
                <div className="relative h-40 rounded-lg overflow-hidden">
                  <img src={formData.coverImage} alt="Couverture" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <img src={formData.logo} alt="Logo" className="w-10 h-10 rounded-full border-2 border-white/20" />
                    <div>
                      <p className="text-white font-bold text-sm">{formData.orgName || 'Nom de l\'organisation'}</p>
                      <p className="text-slate-300 text-xs">{formData.city}, {formData.country}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white">Parlez-nous de votre engagement</h2>
            <p className="text-sm text-slate-300">Décrivez votre organisation, sa vision et sa mission.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Présentation de l'organisation *
                </label>
                <p className="text-[10px] text-slate-400 mb-2">
                  Présentez l'histoire de votre organisation, son ancrage local et ses actions auprès des communautés.
                </p>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez votre organisation..."
                  className="w-full bg-[#080d16] border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Vision à long terme *
                </label>
                <p className="text-[10px] text-slate-400 mb-2">
                  Quel changement durable souhaitez-vous voir pour les communautés que vous accompagnez ?
                </p>
                <textarea
                  rows={3}
                  value={formData.vision}
                  onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                  placeholder="Votre vision..."
                  className="w-full bg-[#080d16] border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Mission auprès des bénéficiaires *
                </label>
                <p className="text-[10px] text-slate-400 mb-2">
                  Décrivez vos engagements concrets, vos programmes et les formes d'accompagnement proposés.
                </p>
                <textarea
                  rows={3}
                  value={formData.mission}
                  onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                  placeholder="Votre mission..."
                  className="w-full bg-[#080d16] border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden resize-none"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white">Dans quels domaines intervenez-vous ?</h2>
            <p className="text-sm text-slate-300">Sélectionnez les domaines d'intervention de votre organisation.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INTERVENTION_DOMAINS.map((domain) => {
                const isSelected = formData.interventionDomains.includes(domain);
                return (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => handleToggleDomain(domain)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-purple-400 bg-purple-500/20 text-purple-300'
                        : 'border-slate-700 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected && <Check className="w-4 h-4" />}
                      <span className="text-sm font-medium">{domain}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={formData.customDomain}
                onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                placeholder="Autre domaine..."
                className="flex-1 bg-[#080d16] border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddCustomDomain}
                className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-sm transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              {formData.interventionDomains.length} domaine(s) sélectionné(s)
            </p>
          </div>
        );

      case 5:
        return (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white">Justifiez l'existence de votre organisation</h2>
            <p className="text-sm text-slate-300">
              Pour protéger la communauté Tulizaana, chaque structure partenaire doit fournir les documents nécessaires à la vérification de son existence légale.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Type de document
                </label>
                <select
                  value={formData.newDocType}
                  onChange={(e) => setFormData({ ...formData, newDocType: e.target.value as any })}
                  className="w-full bg-[#080d16] border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden"
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => docFileInputRef.current?.click()}
                className="w-full p-4 rounded-xl border-2 border-dashed border-slate-600 hover:border-purple-400 flex flex-col items-center justify-center gap-2 transition-all"
              >
                <Upload className="w-8 h-8 text-slate-400" />
                <span className="text-sm text-slate-300">Cliquez pour téléverser ou glissez-déposez</span>
                <span className="text-[10px] text-slate-500">PDF, DOCX, PNG, JPG (max 10 Mo)</span>
              </button>
              <input
                ref={docFileInputRef}
                type="file"
                accept=".pdf,.docx,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleAddLegalDocument(e.target.files[0])}
              />

              {formData.legalDocuments.length > 0 && (
                <div className="space-y-2">
                  {formData.legalDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="text-sm text-white font-medium">{doc.name}</p>
                          <p className="text-[10px] text-slate-400">{doc.documentTypeLabel} • {doc.fileSize}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            legalDocuments: formData.legalDocuments.filter((d) => d.id !== doc.id),
                          });
                        }}
                        className="p-2 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white">Qui représentera votre organisation ?</h2>
            <p className="text-sm text-slate-300">Renseignez les informations du responsable qui administrera le compte.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Nom complet du responsable *
                </label>
                <input
                  type="text"
                  value={formData.responsibleName}
                  onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
                  placeholder="Ex : Jean-Michel Mutombo"
                  className="w-full bg-[#080d16] border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Fonction
                </label>
                <input
                  type="text"
                  value={formData.responsibleTitle}
                  onChange={(e) => setFormData({ ...formData, responsibleTitle: e.target.value })}
                  placeholder="Ex : Directeur / Coordinateur"
                  className="w-full bg-[#080d16] border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Adresse e-mail *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="votre.email@exemple.com"
                    className="w-full bg-[#080d16] border border-slate-700 focus:border-purple-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Téléphone ou WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="Ex : +243 89 000 0000"
                    className="w-full bg-[#080d16] border border-slate-700 focus:border-purple-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Mot de passe souhaité pour le futur compte *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-[#080d16] border border-slate-700 focus:border-purple-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Ce mot de passe sera utilisé après la finalisation de votre compte.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Confirmation du mot de passe *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-[#080d16] border border-slate-700 focus:border-purple-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white">Vérifiez votre demande</h2>
            <p className="text-sm text-slate-300">Revoyez toutes les informations avant d'envoyer votre demande.</p>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <h3 className="text-sm font-bold text-purple-400 mb-2">Identité et localisation</h3>
                <p className="text-sm text-white">{formData.orgName}</p>
                <p className="text-xs text-slate-400">{formData.acronym} • {formData.orgType}</p>
                <p className="text-xs text-slate-400">{formData.city}, {formData.country}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <h3 className="text-sm font-bold text-purple-400 mb-2">Identité visuelle</h3>
                <div className="flex items-center gap-3">
                  <img src={formData.logo} alt="Logo" className="w-12 h-12 rounded-full" />
                  <img src={formData.coverImage} alt="Couverture" className="w-20 h-12 rounded-lg object-cover" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <h3 className="text-sm font-bold text-purple-400 mb-2">Présentation, vision et mission</h3>
                <p className="text-xs text-slate-300 line-clamp-2">{formData.description}</p>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{formData.vision}</p>
                <p className="text-xs text-slate-400 line-clamp-1">{formData.mission}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <h3 className="text-sm font-bold text-purple-400 mb-2">Domaines d'intervention</h3>
                <div className="flex flex-wrap gap-1">
                  {formData.interventionDomains.map((domain) => (
                    <span key={domain} className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px]">
                      {domain}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <h3 className="text-sm font-bold text-purple-400 mb-2">Documents légaux</h3>
                <p className="text-xs text-slate-300">{formData.legalDocuments.length} document(s)</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <h3 className="text-sm font-bold text-purple-400 mb-2">Référent institutionnel</h3>
                <p className="text-sm text-white">{formData.responsibleName}</p>
                <p className="text-xs text-slate-400">{formData.responsibleTitle}</p>
                <p className="text-xs text-slate-400">{formData.contactEmail}</p>
                <p className="text-xs text-slate-400">{formData.contactPhone}</p>
              </div>

              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30">
                <p className="text-xs text-purple-300 leading-relaxed">
                  Votre demande sera examinée par l'équipe Tulizaana. Si elle est approuvée, vous recevrez un code d'invitation par e-mail pour finaliser la création de votre compte partenaire. La soumission de cette demande ne donne pas immédiatement accès au portail partenaire.
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col">
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-bold text-purple-400">Étape {currentStep} sur 7</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-300"
              style={{ width: `${(currentStep / 7) * 100}%` }}
            />
          </div>
        </div>

        {/* Form content */}
        <div className="rounded-3xl bg-[#111422] border border-purple-500/30 p-6 sm:p-8 shadow-2xl">
          {renderStep()}

          {/* Error message */}
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs mt-4">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success message */}
          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs mt-4">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center gap-3 mt-6">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={goToPrevStep}
                disabled={isSubmitting}
                className="py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-sm transition-all disabled:opacity-50"
              >
                ← Précédent
              </button>
            )}

            {currentStep < 7 ? (
              <button
                type="button"
                onClick={goToNextStep}
                className="flex-1 py-3 px-6 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
              >
                <span>Suivant</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 px-6 rounded-xl bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Envoi en cours...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Envoyer ma demande d'invitation</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
