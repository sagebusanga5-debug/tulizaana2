import React, { useState, useRef } from 'react';
import { X, Check, Sparkles, Globe, LogOut, Shield, EyeOff, Lock, Camera, Upload, Trash2 } from 'lucide-react';
import { UserProfile, Language } from '../../types';

interface EditProfileModalProps {
  user: UserProfile;
  language?: Language;
  onSelectLanguage?: (lang: Language) => void;
  onLogout?: () => void;
  onClose: () => void;
  onSave: (updatedData: {
    name: string;
    pseudonym: string;
    bio: string;
    avatar: string;
    isAnonymous: boolean;
  }) => void;
  onToggleAnonymousMode?: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
];

const LANGUAGES: { code: Language; label: string; native: string; flag: string }[] = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', native: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'Arabe', native: 'العربية', flag: '🇸🇦' },
  { code: 'pt', label: 'Portugais', native: 'Português', flag: '🇵🇹' },
  { code: 'sw', label: 'Swahili', native: 'Kiswahili', flag: '🇹🇿' },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  user,
  language = 'fr',
  onSelectLanguage,
  onLogout,
  onClose,
  onSave,
  onToggleAnonymousMode,
}) => {
  const [name, setName] = useState(user.name || '');
  const [pseudonym, setPseudonym] = useState(
    user.pseudonym || user.name.toLowerCase().replace(/\s+/g, '_')
  );
  const [bio, setBio] = useState(user.bio || '');
  const [avatar, setAvatar] = useState(user.avatar || AVATAR_PRESETS[0]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(Boolean(user.isAnonymous));
  const [currentLang, setCurrentLang] = useState<Language>(language || user.language || 'fr');

  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setCustomAvatarUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang);
    if (onSelectLanguage) {
      onSelectLanguage(lang);
    }
  };

  const handleLogoutClick = () => {
    onClose();
    if (onLogout) {
      onLogout();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim() || user.name,
      pseudonym: pseudonym.trim().replace(/^@/, '') || 'membre',
      bio: bio.trim(),
      avatar: customAvatarUrl.trim() || avatar,
      isAnonymous,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-lg bg-[#111827] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white font-display">
              Paramètres du profil
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Avatar Preview and Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Photo de profil</label>
              {customAvatarUrl && (
                <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  Photo personnalisée
                </span>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={avatarFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleAvatarFile(e.target.files[0]);
                e.target.value = '';
              }}
            />

            <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-400 shadow-md shrink-0">
                  <img
                    src={customAvatarUrl || avatar}
                    alt="Aperçu"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Device Upload Button */}
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:border-cyan-400"
                >
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>Téléverser de l’appareil</span>
                </button>
              </div>

              {/* Presets Separator & Selector */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0 sm:pl-3 border-t sm:border-t-0 sm:border-l border-slate-800 overflow-x-auto">
                <span className="text-[11px] text-slate-500 shrink-0 hidden sm:inline">Ou :</span>
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    title="Choisir cet avatar par défaut"
                    onClick={() => {
                      setAvatar(preset);
                      setCustomAvatarUrl('');
                    }}
                    className={`relative w-9 h-9 rounded-full overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      avatar === preset && !customAvatarUrl
                        ? 'border-cyan-400 scale-105 ring-2 ring-cyan-500/30'
                        : 'border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={preset} alt="Preset" className="w-full h-full object-cover" />
                    {avatar === preset && !customAvatarUrl && (
                      <div className="absolute inset-0 bg-cyan-500/30 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Nom complet / Affiché</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Busara (Membre Protégé)"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400"
            />
          </div>

          {/* Pseudonym / Handle Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Pseudo (@handle)</label>
            <div className="flex items-center px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-cyan-400 font-mono">
              <span className="text-slate-500 mr-1">@</span>
              <input
                type="text"
                required
                value={pseudonym}
                onChange={(e) => setPseudonym(e.target.value.replace(/^@/, ''))}
                placeholder="busara"
                className="w-full bg-transparent border-none text-cyan-300 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Bio Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Bio (courte citation ou parcours)</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ex: Membre actif de la communauté Tulizaana, engagé(e) pour le soutien mutuel..."
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-400 resize-none leading-relaxed"
            />
          </div>

          {/* MODE ANONYMAT (MASQUE LE NOM ET LA PHOTO SUR TOUTES LES PUBLICATIONS & CONTRIBUTIONS) */}
          <div className="pt-3 border-t border-slate-800">
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isAnonymous
                  ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/5'
                  : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isAnonymous
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {isAnonymous ? <EyeOff className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        Mode Anonymat
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          isAnonymous
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {isAnonymous ? 'Activé' : 'Désactivé'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Masque votre nom et votre photo sur toutes vos publications et contributions sur Tulizaana. Tant qu'il est activé, seul <strong className="text-amber-300">« Anonyme »</strong> est affiché publiquement.
                    </p>
                  </div>
                </div>

                {/* Switch Toggle */}
                <button
                  type="button"
                  id="btn-toggle-anonymat-modal"
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`relative w-12 h-7 rounded-full transition-colors p-1 cursor-pointer shrink-0 focus:outline-hidden ${
                    isAnonymous ? 'bg-amber-400' : 'bg-slate-700'
                  }`}
                  aria-label="Basculer le mode anonymat"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-slate-950 shadow-md transition-transform ${
                      isAnonymous ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {isAnonymous && (
                <div className="mt-3 pt-2.5 border-t border-amber-500/20 flex items-center gap-2 text-[11px] text-amber-300/90">
                  <Shield className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span>Protection active : votre nom et votre photo seront totalement masqués sur toutes vos publications et contributions.</span>
                </div>
              )}
            </div>
          </div>

          {/* CHANGEMENT DE LANGUE (TRADUCTION INSTANTANÉE DE LA PLATEFORME) */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <label className="text-xs font-bold text-white">
                  Langue de la plateforme
                </label>
              </div>
              <span className="text-[11px] text-cyan-400 font-medium">
                Traduction instantanée
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {LANGUAGES.map((lang) => {
                const isSelected = currentLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/40'
                        : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base">{lang.flag}</span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold tracking-tight">{lang.native}</p>
                      <p className="text-[10px] text-slate-400">{lang.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DÉCONNEXION (RENVOIE VERS CONNEXION / INSCRIPTION) */}
          {onLogout && (
            <div className="pt-3 border-t border-slate-800">
              <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-900/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Session active</h4>
                    <p className="text-[11px] text-slate-400">
                      Déconnectez-vous pour changer de compte
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-profile-logout"
                  onClick={handleLogoutClick}
                  className="px-3.5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              id="btn-save-profile-settings"
              className="px-6 py-2.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs transition-all shadow-md shadow-cyan-400/20 active:scale-95 cursor-pointer"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
