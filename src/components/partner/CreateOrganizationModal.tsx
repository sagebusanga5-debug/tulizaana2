import React, { useState, useRef } from 'react';
import {
  Building2,
  MapPin,
  FileText,
  Upload,
  Eye,
  Target,
  Plus,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Globe2,
  FileSpreadsheet,
  Trash2,
  Sparkles,
  Info,
  Camera,
  Image as ImageIcon,
  ImagePlus,
} from 'lucide-react';
import { LegalDocument, Organization } from '../../types';

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOrganization: (newOrg: Organization) => void;
}

const AFRICAN_COUNTRIES = [
  'République Démocratique du Congo (RDC)',
  'Sénégal',
  'Côte d’Ivoire',
  'Cameroun',
  'Rwanda',
  'Burundi',
  'Guinée',
  'Mali',
  'Bénin',
  'Togo',
  'Burkina Faso',
  'Congo-Brazzaville',
  'Gabon',
  'Tchad',
  'Madagascar',
  'Niger',
  'Centrafrique',
  'Autre pays africain',
];

const SUGGESTED_DOMAINS = [
  'Santé mentale & Dépression',
  'Drépanocytose (SS / SC)',
  'Traumatismes & VSBG',
  'Cercles de parole & Écoute active',
  'Maladies chroniques & Diabète',
  'VIH / Sida & Soutien fraternel',
  'Santé maternelle & Enfance',
  'Accompagnants & Aidants familiaux',
  'Réinsertion & Résilience communautaire',
  'Handicap & Inclusion sociale',
];

const PRESET_LOGOS = [
  { label: 'Croix / Santé', url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=150&auto=format&fit=crop&q=80' },
  { label: 'Entraide / Mains', url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=150&auto=format&fit=crop&q=80' },
  { label: 'Femmes / Maternité', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80' },
  { label: 'Écoute & Partage', url: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=150&auto=format&fit=crop&q=80' },
];

const PRESET_COVERS = [
  { label: 'Solidarité Communautaire', url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Sourires & Espoir', url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Cercle de Résilience', url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Équipe Médicale & Soins', url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1200&auto=format&fit=crop&q=80' },
];

export const CreateOrganizationModal: React.FC<CreateOrganizationModalProps> = ({
  isOpen,
  onClose,
  onCreateOrganization,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState('');
  const [acronym, setAcronym] = useState('');
  const [orgType, setOrgType] = useState<Organization['type']>('ong');
  const [country, setCountry] = useState('République Démocratique du Congo (RDC)');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [vision, setVision] = useState('');
  const [mission, setMission] = useState('');
  const [responsibleName, setResponsibleName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [logo, setLogo] = useState<string>('https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=150&auto=format&fit=crop&q=80');
  const [coverImage, setCoverImage] = useState<string>('https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=1200&auto=format&fit=crop&q=80');
  const [logoInputUrl, setLogoInputUrl] = useState('');
  const [coverInputUrl, setCoverInputUrl] = useState('');
  const [showLogoUrl, setShowLogoUrl] = useState(false);
  const [showCoverUrl, setShowCoverUrl] = useState(false);

  const handleUploadLogo = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image valide pour le logo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setLogo(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadCover = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image valide pour la photo de couverture.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setCoverImage(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };
  
  // Domains
  const [selectedDomains, setSelectedDomains] = useState<string[]>([
    'Santé mentale & Dépression',
    'Cercles de parole & Écoute active',
  ]);
  const [customDomain, setCustomDomain] = useState('');

  // Legal documents
  const [legalDocuments, setLegalDocuments] = useState<LegalDocument[]>([
    {
      id: 'doc-init-1',
      name: 'Arrêté d’Agrément Ministériel ou Autorisation Officielle',
      documentType: 'agrement_ministeriel',
      documentTypeLabel: 'Agrément Ministériel',
      fileName: 'Arrete_Agrement_Officiel.pdf',
      fileSize: '1.8 MB',
      uploadedAt: 'À l’instant',
      status: 'pending_review',
    },
  ]);
  const [selectedDocType, setSelectedDocType] = useState<LegalDocument['documentType']>('agrement_ministeriel');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleToggleDomain = (domain: string) => {
    if (selectedDomains.includes(domain)) {
      setSelectedDomains(selectedDomains.filter((d) => d !== domain));
    } else {
      setSelectedDomains([...selectedDomains, domain]);
    }
  };

  const handleAddCustomDomain = () => {
    const trimmed = customDomain.trim();
    if (trimmed && !selectedDomains.includes(trimmed)) {
      setSelectedDomains([...selectedDomains, trimmed]);
      setCustomDomain('');
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const typeLabels: Record<LegalDocument['documentType'], string> = {
      agrement_ministeriel: 'Agrément Ministériel Officiel',
      statuts_notaries: 'Statuts Notariés Enregistrés',
      f92_rccm: 'Certificat F92 / RCCM / NIF',
      attestation_siege: 'Attestation de Siège & Localisation',
      autre: 'Preuve Légale Complémentaire',
    };

    const newDoc: LegalDocument = {
      id: `doc-${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      documentType: selectedDocType,
      documentTypeLabel: typeLabels[selectedDocType] || 'Document Légal',
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: 'À l’instant',
      status: 'pending_review',
    };

    setLegalDocuments((prev) => [...prev, newDoc]);
  };

  const handleRemoveDoc = (id: string) => {
    setLegalDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Veuillez renseigner le nom officiel de votre organisation.');
      return;
    }
    if (!city.trim()) {
      setError('Veuillez préciser la ville du siège de votre organisation en Afrique.');
      return;
    }
    if (!description.trim()) {
      setError('Veuillez ajouter une description de présentation de votre organisation.');
      return;
    }
    if (selectedDomains.length === 0) {
      setError('Veuillez sélectionner au moins un domaine d’intervention.');
      return;
    }

    setIsSubmitting(true);

    const newOrganization: Organization = {
      id: `org-${Date.now()}`,
      name: name.trim(),
      acronym: acronym.trim() || undefined,
      type: orgType,
      country,
      city: city.trim(),
      domain: selectedDomains[0] || 'Santé Communautaire & Résilience',
      description: description.trim(),
      vision: vision.trim() || 'Construire un espace d’accueil solidaire et digne pour les personnes éprouvées en Afrique.',
      mission: mission.trim() || 'Fournir un accompagnement de proximité et animer des cercles de résilience sécurisés.',
      responsibleName: responsibleName.trim() || 'Coordinateur Général',
      contactEmail: contactEmail.trim() || 'contact@organisation.org',
      contactPhone: contactPhone.trim() || '+243 00 000 0000',
      logo: logo || 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=150&auto=format&fit=crop&q=80',
      coverImage: coverImage || 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=1200&auto=format&fit=crop&q=80',
      interventionDomains: selectedDomains,
      legalDocuments,
      status: 'approved',
      subscriptionPlan: 'starter',
      quotaCommunities: { used: 0, max: 2 },
      quotaMembers: { used: 0, max: 500 },
      quotaCampaignsPerMonth: { used: 0, max: 2 },
      createdAt: new Date().toISOString(),
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onCreateOrganization(newOrganization);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md overflow-y-auto p-3 sm:p-6 flex justify-center items-center">
      <div className="bg-[#111827] border border-slate-800 rounded-3xl max-w-3xl w-full my-auto p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg shadow-cyan-500/10">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">
                Déposer une candidature de partenariat
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Enregistrement officiel des ONG, fondations et associations humanitaires actives en Afrique sur Tulizaana.
                La candidature est examinée par la plateforme : elle n'accorde aucun accès immédiat.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          
          {/* Section 1: Identification */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>1. Identification de l’Organisation</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">
                  Nom officiel complet de l’organisation *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Association Solidarité Espoir RDC"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Sigle / Acronyme
                </label>
                <input
                  type="text"
                  value={acronym}
                  onChange={(e) => setAcronym(e.target.value)}
                  placeholder="Ex : ASOK"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none uppercase font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Type de structure
              </label>
              <select
                value={orgType}
                onChange={(e) => setOrgType(e.target.value as Organization['type'])}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:border-cyan-400 focus:outline-none"
              >
                <option value="ong">Organisation Non Gouvernementale (ONG)</option>
                <option value="association">Association Communautaire</option>
                <option value="fondation">Fondation d’Utilité Publique</option>
                <option value="institution">Institution Sanitaire & Publique</option>
                <option value="hopital">Centre Hospitalier / Clinique</option>
              </select>
            </div>
          </div>

          {/* Section 2: Localisation (Pays et Ville) */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>2. Localisation en Afrique (Pays et Ville)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Pays d’implantation *
                </label>
                <div className="relative">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:border-cyan-400 focus:outline-none"
                  >
                    {AFRICAN_COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Ville du siège / base opérationnelle *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex : Bukavu, Kinshasa, Goma, Dakar, Abidjan..."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Identité Visuelle (Photo de profil & Couverture) */}
          <div className="space-y-4 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>3. Identité Visuelle : Photo de profil (Logo) & Couverture</span>
              </h3>
              <span className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 font-medium">
                Logo & Bannière
              </span>
            </div>

            {/* Live Preview Card */}
            <div className="rounded-2xl border border-slate-700/80 overflow-hidden bg-slate-950 shadow-lg">
              <div className="relative h-28 sm:h-36 w-full bg-slate-900 overflow-hidden">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt="Bannière de couverture"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-r from-purple-950 via-slate-900 to-slate-950 flex items-center justify-center text-slate-500">
                    <ImageIcon className="w-7 h-7 opacity-40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-transparent to-transparent" />
                
                <div className="absolute top-2.5 right-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => coverFileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-xl bg-slate-900/85 hover:bg-slate-900 text-purple-200 text-xs font-bold flex items-center gap-1.5 border border-purple-500/30 backdrop-blur-xs cursor-pointer shadow-sm"
                  >
                    <Camera className="w-3 h-3 text-purple-400" />
                    <span>Modifier</span>
                  </button>
                  {coverImage && (
                    <button
                      type="button"
                      onClick={() => setCoverImage('')}
                      className="p-1 rounded-xl bg-slate-900/85 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 text-xs backdrop-blur-xs cursor-pointer"
                      title="Supprimer la photo de couverture"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Médaillon Logo */}
              <div className="px-4 pb-3 pt-0 relative flex items-end justify-between -mt-8 sm:-mt-10">
                <div className="flex items-end gap-3">
                  <div className="relative">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 border-3 border-[#0f111a] shadow-xl overflow-hidden flex items-center justify-center shrink-0">
                      {logo ? (
                        <img
                          src={logo}
                          alt="Logo"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-purple-400" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      title="Changer le logo"
                      className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-md cursor-pointer border border-purple-400"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="pb-1">
                    <p className="text-sm sm:text-base font-black text-white leading-tight">
                      {name.trim() || 'Nom de l’organisation'}
                      {acronym.trim() && (
                        <span className="text-purple-400 ml-1.5 font-mono text-xs font-semibold">
                          ({acronym.trim()})
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-purple-400" />
                      <span>{city.trim() || 'Ville'} ({country})</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Inputs de fichiers cachés */}
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

            {/* Sélecteurs Logo & Couverture */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Logo Controls */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-purple-400" />
                    Logo officiel (Profil)
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">PNG, JPG, SVG</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Téléverser</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLogoUrl(!showLogoUrl)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer border border-slate-700"
                  >
                    {showLogoUrl ? 'Fermer' : 'Par URL'}
                  </button>
                </div>

                {showLogoUrl && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="url"
                      value={logoInputUrl}
                      onChange={(e) => setLogoInputUrl(e.target.value)}
                      placeholder="https://.../logo.png"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (logoInputUrl.trim()) {
                          setLogo(logoInputUrl.trim());
                          setLogoInputUrl('');
                          setShowLogoUrl(false);
                        }
                      }}
                      className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      OK
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-800/80">
                  {PRESET_LOGOS.map((item, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setLogo(item.url)}
                      className={`flex items-center gap-1 p-1 pr-1.5 rounded-lg border text-[10px] cursor-pointer ${
                        logo === item.url
                          ? 'bg-purple-950 border-purple-400 text-purple-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <img src={item.url} alt={item.label} className="w-4 h-4 rounded-sm object-cover" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cover Controls */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <ImagePlus className="w-3.5 h-3.5 text-purple-400" />
                    Photo de couverture (Bannière)
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">1200 x 400 px</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => coverFileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Téléverser</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCoverUrl(!showCoverUrl)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer border border-slate-700"
                  >
                    {showCoverUrl ? 'Fermer' : 'Par URL'}
                  </button>
                </div>

                {showCoverUrl && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="url"
                      value={coverInputUrl}
                      onChange={(e) => setCoverInputUrl(e.target.value)}
                      placeholder="https://.../cover.jpg"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (coverInputUrl.trim()) {
                          setCoverImage(coverInputUrl.trim());
                          setCoverInputUrl('');
                          setShowCoverUrl(false);
                        }
                      }}
                      className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      OK
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-800/80">
                  {PRESET_COVERS.map((item, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setCoverImage(item.url)}
                      className={`flex items-center gap-1 p-1 pr-1.5 rounded-lg border text-[10px] cursor-pointer ${
                        coverImage === item.url
                          ? 'bg-purple-950 border-purple-400 text-purple-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <img src={item.url} alt={item.label} className="w-5 h-3 rounded-xs object-cover" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Présentation, Vision et Mission */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>4. Présentation, Vision et Mission</span>
            </h3>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Description de l’organisation *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Présentez brièvement votre organisation, son historique, son engagement communautaire et les personnes accompagnées..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:border-cyan-400 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Vision de l’organisation</span>
                </label>
                <textarea
                  rows={2}
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                  placeholder="Ex : Bâtir une Afrique où la santé mentale et les vulnérabilités ne sont plus des tabous..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-teal-400" />
                  <span>Mission</span>
                </label>
                <textarea
                  rows={2}
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  placeholder="Ex : Accueillir, soigner et animer des cercles fermés de soutien fraternel..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Domaines d'intervention */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>5. Domaines d’Intervention</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                {selectedDomains.length} domaine(s) sélectionné(s)
              </span>
            </div>

            <p className="text-slate-400 text-[11px]">
              Sélectionnez les thématiques que votre structure adresse activement auprès des bénéficiaires :
            </p>

            <div className="flex flex-wrap gap-2">
              {SUGGESTED_DOMAINS.map((domain) => {
                const isSelected = selectedDomains.includes(domain);
                return (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => handleToggleDomain(domain)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-300 border border-slate-700 hover:border-slate-600 hover:text-white'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{domain}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom domain input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomDomain();
                  }
                }}
                placeholder="Ajouter un domaine d’intervention spécifique..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:border-cyan-400 focus:outline-none text-xs"
              />
              <button
                type="button"
                onClick={handleAddCustomDomain}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter</span>
              </button>
            </div>
          </div>

          {/* Section 6: Téléversement des documents légaux (Preuves d'existence en Afrique) */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>6. Documents Légaux & Preuves d’Existence en Afrique</span>
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                Exigence de Sécurité
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start gap-2.5 text-slate-300 text-[11px] leading-relaxed">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">
                  Garantie de légalité pour les cercles fermés Tulizaana :
                </p>
                <p className="text-slate-400 mt-0.5">
                  Afin de préserver la sécurité morale et médicale de nos membres, chaque organisation doit fournir une preuve d’existence légale délivrée par les autorités du pays : <strong>Arrêté ministériel d’agrément</strong>, <strong>Enregistrement F92 / RCCM</strong>, <strong>Statuts notariés</strong> ou <strong>Attestation d’implantation géographique de siège</strong>.
                </p>
              </div>
            </div>

            {/* Document type selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Type de document à téléverser
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value as LegalDocument['documentType'])}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:border-cyan-400 focus:outline-none"
                >
                  <option value="agrement_ministeriel">Arrêté Ministériel / Agrément d'Exercice</option>
                  <option value="f92_rccm">Certificat F92 / RCCM / Déclaration Officielle</option>
                  <option value="statuts_notaries">Statuts Notariés Déposés au Tribunal</option>
                  <option value="attestation_siege">Attestation d'Existence & Localisation de Siège</option>
                  <option value="autre">Autre Preuve Légale Officielle</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Sélectionner un fichier (PDF, PNG, JPG, DOCX)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Choisir un document</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFileSelect(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
              }`}
            >
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
              <p className="text-slate-300 font-semibold text-xs">
                Glissez-déposez vos documents légaux scannés ici
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Formats acceptés : PDF, PNG, JPG, DOCX (Max 25 Mo)
              </p>
            </div>

            {/* List of uploaded legal documents */}
            {legalDocuments.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-slate-300 block">
                  Documents légaux joints ({legalDocuments.length}) :
                </span>
                <div className="space-y-1.5">
                  {legalDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                          <FileCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate text-xs">
                            {doc.name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="text-cyan-400">{doc.documentTypeLabel}</span>
                            <span>•</span>
                            <span>{doc.fileSize}</span>
                            <span>•</span>
                            <span className="text-amber-400 font-medium">En attente de vérification</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Supprimer ce document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 7: Contact & Référent */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>7. Coordonnées du Responsable / Référent</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nom du référent
                </label>
                <input
                  type="text"
                  value={responsibleName}
                  onChange={(e) => setResponsibleName(e.target.value)}
                  placeholder="Ex : Dr. Jean Mukendi"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Email officiel
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@organisation.org"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Téléphone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+243 99 000 0000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Création en cours...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Envoyer ma candidature</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
