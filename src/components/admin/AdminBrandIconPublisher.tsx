import React, { useState, useRef } from 'react';
import {
  Upload,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  Sliders,
  Palette,
  Shield,
  Layers,
  Smartphone,
  Monitor,
} from 'lucide-react';
import {
  useBrandIcon,
  publishBrandIcon,
  resetBrandIcon,
  TulizaanaIcon,
  TulizaanaLogo,
} from '../brand/TulizaanaBrand';

interface AdminBrandIconPublisherProps {
  onShowToast: (msg: string) => void;
  onRecordLog?: (action: string, resource: string, details: string) => void;
}

const PRESET_OFFICIAL = `data:image/svg+xml;utf8,<svg viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g1" x1="15%" y1="10%" x2="85%" y2="90%"><stop offset="0%" stop-color="%2300F0D0"/><stop offset="50%" stop-color="%2300D2C4"/><stop offset="100%" stop-color="%2300B4D8"/></linearGradient></defs><circle cx="500" cy="500" r="460" stroke="url(%23g1)" stroke-width="52" fill="none"/><circle cx="160" cy="500" r="64" stroke="url(%23g1)" stroke-width="36" fill="none"/><path d="M 265 110 L 545 55 L 545 680 C 545 700 560 710 580 710 L 900 690 C 840 840 710 935 540 955 C 430 965 330 915 265 830 C 265 780 265 600 265 110 Z" fill="url(%23g1)"/><path d="M 545 55 C 730 65 885 185 940 350 L 850 420 C 800 300 680 200 545 180 Z" fill="url(%23g1)"/><circle cx="710" cy="360" r="142" fill="url(%23g1)"/></svg>`;

const PRESET_EMERALD = `data:image/svg+xml;utf8,<svg viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g2" x1="10%" y1="10%" x2="90%" y2="90%"><stop offset="0%" stop-color="%2310B981"/><stop offset="50%" stop-color="%23059669"/><stop offset="100%" stop-color="%23047857"/></linearGradient></defs><circle cx="500" cy="500" r="460" stroke="url(%23g2)" stroke-width="52" fill="none"/><circle cx="160" cy="500" r="64" stroke="url(%23g2)" stroke-width="36" fill="none"/><path d="M 265 110 L 545 55 L 545 680 C 545 700 560 710 580 710 L 900 690 C 840 840 710 935 540 955 C 430 965 330 915 265 830 C 265 780 265 600 265 110 Z" fill="url(%23g2)"/><path d="M 545 55 C 730 65 885 185 940 350 L 850 420 C 800 300 680 200 545 180 Z" fill="url(%23g2)"/><circle cx="710" cy="360" r="142" fill="url(%23g2)"/></svg>`;

const PRESET_INDIGO = `data:image/svg+xml;utf8,<svg viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g3" x1="10%" y1="10%" x2="90%" y2="90%"><stop offset="0%" stop-color="%23818CF8"/><stop offset="50%" stop-color="%236366F1"/><stop offset="100%" stop-color="%234F46E5"/></linearGradient></defs><circle cx="500" cy="500" r="460" stroke="url(%23g3)" stroke-width="52" fill="none"/><circle cx="160" cy="500" r="64" stroke="url(%23g3)" stroke-width="36" fill="none"/><path d="M 265 110 L 545 55 L 545 680 C 545 700 560 710 580 710 L 900 690 C 840 840 710 935 540 955 C 430 965 330 915 265 830 C 265 780 265 600 265 110 Z" fill="url(%23g3)"/><path d="M 545 55 C 730 65 885 185 940 350 L 850 420 C 800 300 680 200 545 180 Z" fill="url(%23g3)"/><circle cx="710" cy="360" r="142" fill="url(%23g3)"/></svg>`;

const PRESET_GOLD = `data:image/svg+xml;utf8,<svg viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g4" x1="10%" y1="10%" x2="90%" y2="90%"><stop offset="0%" stop-color="%23FBBF24"/><stop offset="50%" stop-color="%23F59E0B"/><stop offset="100%" stop-color="%23D97706"/></linearGradient></defs><circle cx="500" cy="500" r="460" stroke="url(%23g4)" stroke-width="52" fill="none"/><circle cx="160" cy="500" r="64" stroke="url(%23g4)" stroke-width="36" fill="none"/><path d="M 265 110 L 545 55 L 545 680 C 545 700 560 710 580 710 L 900 690 C 840 840 710 935 540 955 C 430 965 330 915 265 830 C 265 780 265 600 265 110 Z" fill="url(%23g4)"/><path d="M 545 55 C 730 65 885 185 940 350 L 850 420 C 800 300 680 200 545 180 Z" fill="url(%23g4)"/><circle cx="710" cy="360" r="142" fill="url(%23g4)"/></svg>`;

export const AdminBrandIconPublisher: React.FC<AdminBrandIconPublisherProps> = ({
  onShowToast,
  onRecordLog,
}) => {
  const { customIcon, isCustom } = useBrandIcon();
  const [selectedPreviewIcon, setSelectedPreviewIcon] = useState<string>(customIcon || PRESET_OFFICIAL);
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [justPublished, setJustPublished] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync selectedPreviewIcon when customIcon updates
  React.useEffect(() => {
    if (customIcon) {
      setSelectedPreviewIcon(customIcon);
    }
  }, [customIcon]);

  const handleFileProcess = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast('Veuillez sélectionner un fichier image valide (PNG, SVG, JPG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onShowToast('L’image est trop volumineuse (max 10 Mo).');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setSelectedPreviewIcon(dataUrl);
        setIsUploading(false);
        onShowToast('Image chargée dans le visualiseur. Cliquez sur « Publier l’icône » pour l’activer.');
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      onShowToast('Erreur lors de la lecture du fichier image.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleUrlApply = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      onShowToast('Veuillez renseigner une URL valide.');
      return;
    }
    setSelectedPreviewIcon(trimmed);
    setUrlInput('');
    onShowToast('URL appliquée à l’aperçu. Cliquez sur « Publier l’icône » pour valider.');
  };

  const handlePublish = () => {
    if (!selectedPreviewIcon) return;
    publishBrandIcon(selectedPreviewIcon);
    setJustPublished(true);
    onShowToast('✨ Icône officielle de Tulizaana publiée avec succès partout sur la plateforme !');
    if (onRecordLog) {
      onRecordLog(
        'Publication Icône de Marque',
        'Identité Visuelle & Logo',
        'Nouvelle icône de marque activée sur toute la plateforme'
      );
    }
    setTimeout(() => setJustPublished(false), 4000);
  };

  const handleReset = () => {
    resetBrandIcon();
    setSelectedPreviewIcon(PRESET_OFFICIAL);
    onShowToast('Icône officielle vectorielle d’origine rétablie avec succès.');
    if (onRecordLog) {
      onRecordLog(
        'Réinitialisation Icône de Marque',
        'Identité Visuelle & Logo',
        'Rétablissement de l’icône vectorielle officielle d’origine'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Live Status Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-cyan-500/30 shadow-xl shadow-cyan-950/20 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shrink-0">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Identité Visuelle & Publication de l’Icône Officielle
                </h2>
                {isCustom ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    Icône Personnalisée Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold">
                    <Sparkles className="w-3 h-3" />
                    Icône Officielle Vectorielle
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Téléversez ou choisissez l’icône de marque Tulizaana. Elle est publiée instantanément et se positionne fidèlement sur la page de chargement (splash), les en-têtes (headers), la navigation mobile et les modales.
              </p>
            </div>
          </div>

          {/* Quick Reset Button if custom */}
          {isCustom && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors cursor-pointer shrink-0"
              title="Rétablir l'icône d'origine"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Rétablir l’origine</span>
            </button>
          )}
        </div>

        {/* 2. Upload and Source Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Upload Box & URL Input (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>1. Importer votre nouvelle icône</span>
            </h3>

            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${
                dragActive
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : 'border-slate-700 hover:border-cyan-500/60 bg-slate-950/60 hover:bg-slate-950'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform mb-3 shadow-lg shadow-cyan-500/10">
                <Upload className="w-6 h-6" />
              </div>

              <p className="text-xs font-bold text-white mb-1">
                Cliquez pour choisir une image ou glissez-déposez ici
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Formats acceptés : <strong>PNG transparent</strong>, <strong>SVG vectoriel</strong>, WebP ou JPG. Carré recommandé (ex : 512×512 px).
              </p>
            </div>

            {/* Direct URL input */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <input
                  type="url"
                  placeholder="Ou collez une URL directe d'image (https://...)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleUrlApply();
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={handleUrlApply}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer shrink-0"
              >
                Tester URL
              </button>
            </div>

            {/* Presets Gallery */}
            <div className="pt-2">
              <p className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Variantes officielles prédéfinies :</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPreviewIcon(PRESET_OFFICIAL);
                    onShowToast('Variante Officielle Cyan sélectionnée pour prévisualisation.');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    selectedPreviewIcon === PRESET_OFFICIAL
                      ? 'border-cyan-400 bg-cyan-500/15 shadow-md shadow-cyan-500/20'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                  }`}
                >
                  <img src={PRESET_OFFICIAL} alt="Cyan" className="w-7 h-7 object-contain shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-white truncate">Cyan & Azur</div>
                    <div className="text-[9px] text-slate-400">Officielle</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPreviewIcon(PRESET_EMERALD);
                    onShowToast('Variante Émeraude Santé sélectionnée pour prévisualisation.');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    selectedPreviewIcon === PRESET_EMERALD
                      ? 'border-emerald-400 bg-emerald-500/15 shadow-md shadow-emerald-500/20'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                  }`}
                >
                  <img src={PRESET_EMERALD} alt="Émeraude" className="w-7 h-7 object-contain shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-white truncate">Émeraude</div>
                    <div className="text-[9px] text-emerald-400">Santé & Vie</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPreviewIcon(PRESET_INDIGO);
                    onShowToast('Variante Indigo Résilience sélectionnée pour prévisualisation.');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    selectedPreviewIcon === PRESET_INDIGO
                      ? 'border-indigo-400 bg-indigo-500/15 shadow-md shadow-indigo-500/20'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                  }`}
                >
                  <img src={PRESET_INDIGO} alt="Indigo" className="w-7 h-7 object-contain shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-white truncate">Indigo</div>
                    <div className="text-[9px] text-indigo-400">Résilience</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPreviewIcon(PRESET_GOLD);
                    onShowToast('Variante Solaire Espoir sélectionnée pour prévisualisation.');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    selectedPreviewIcon === PRESET_GOLD
                      ? 'border-amber-400 bg-amber-500/15 shadow-md shadow-amber-500/20'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                  }`}
                >
                  <img src={PRESET_GOLD} alt="Or" className="w-7 h-7 object-contain shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-white truncate">Solaire</div>
                    <div className="text-[9px] text-amber-400">Espoir</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Live Multi-Scale Preview & Action (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4 p-5 rounded-2xl bg-[#090E17] border border-slate-800/90">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>2. Aperçu en direct dans l’interface</span>
                </h3>
                <span className="text-[10px] text-slate-400">Multi-échelles</span>
              </div>

              {/* Context 1: Splash Screen Loading Preview */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 mb-3 space-y-2">
                <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Monitor className="w-3 h-3 text-cyan-400" />
                  <span>Page de chargement (Splash Screen)</span>
                </div>
                <div className="py-3 flex flex-col items-center justify-center bg-[#080D14] rounded-lg border border-slate-900 relative overflow-hidden">
                  <div className="absolute w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
                  <div className="w-16 h-16 rounded-2xl bg-[#0E1626]/90 border border-cyan-500/30 p-2.5 shadow-xl shadow-cyan-500/20 flex items-center justify-center mb-2 z-10">
                    <img
                      src={selectedPreviewIcon}
                      alt="Aperçu Splash"
                      className="w-full h-full object-contain aspect-square drop-shadow-md"
                    />
                  </div>
                  <div className="inline-flex items-baseline font-poppins font-bold text-sm text-white tracking-tight z-10">
                    <span>Tulizaana</span>
                    <span className="inline-block w-1.5 h-1.5 ml-0.5 rounded-full bg-gradient-to-tr from-cyan-400 to-teal-300 shadow-xs shadow-cyan-400/80 shrink-0" />
                  </div>
                </div>
              </div>

              {/* Context 2: Desktop Header Preview */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 mb-3 space-y-2">
                <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Monitor className="w-3 h-3 text-indigo-400" />
                  <span>En-tête de navigation (Desktop)</span>
                </div>
                <div className="h-12 px-3 bg-[#0B0F14] rounded-lg border border-slate-900 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2">
                    <img
                      src={selectedPreviewIcon}
                      alt="Aperçu Header"
                      className="w-7 h-7 object-contain aspect-square shrink-0"
                    />
                    <div className="inline-flex items-baseline font-poppins font-bold text-sm text-white tracking-tight">
                      <span>Tulizaana</span>
                      <span className="inline-block w-1.5 h-1.5 ml-0.5 rounded-full bg-gradient-to-tr from-cyan-400 to-teal-300 shadow-xs shadow-cyan-400/80 shrink-0" />
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                    Espace Membre
                  </span>
                </div>
              </div>

              {/* Context 3: Mobile Header Compact Preview */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Smartphone className="w-3 h-3 text-emerald-400" />
                  <span>En-tête Mobile & Modales</span>
                </div>
                <div className="h-10 px-3 bg-[#0B0F14] rounded-lg border border-slate-900 flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5">
                    <img
                      src={selectedPreviewIcon}
                      alt="Aperçu Mobile"
                      className="w-5 h-5 object-contain aspect-square shrink-0"
                    />
                    <div className="inline-flex items-baseline font-poppins font-bold text-xs text-white tracking-tight">
                      <span>Tulizaana</span>
                      <span className="inline-block w-1 h-1 ml-0.5 rounded-full bg-gradient-to-tr from-cyan-400 to-teal-300 shadow-xs shadow-cyan-400/80 shrink-0" />
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                    FR
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handlePublish}
                className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/25 active:scale-[0.99]"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Publier cette icône sur toute la plateforme</span>
              </button>

              {justPublished && (
                <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-center gap-1.5 animate-fadeIn">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Icône active et synchronisée sur tous les écrans !</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
