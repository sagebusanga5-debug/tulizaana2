import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Heart,
  CheckCircle2,
  Users,
  AlertTriangle,
  Building2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Community, Organization, Language } from '../../types';
import { TranslateButton } from '../common/TranslateButton';

interface CommunityRulesModalProps {
  community: Community;
  organization?: Organization;
  isJoined: boolean;
  language?: Language;
  onClose: () => void;
  onJoin: (communityId: string) => void;
  onOpenProfile: (communityId: string) => void;
}

export const CommunityRulesModal: React.FC<CommunityRulesModalProps> = ({
  community,
  organization,
  isJoined,
  language = 'fr',
  onClose,
  onJoin,
  onOpenProfile,
}) => {
  const orgName = community.organizationName || organization?.name || 'ONG Partenaire';

  const [descTranslation, setDescTranslation] = useState<{ translated: boolean; text: string }>({
    translated: false,
    text: community.description,
  });

  const defaultSanctuaryPrinciples = [
    {
      icon: <Lock className="w-4 h-4 text-cyan-400" />,
      title: 'Confidentialité & Secret de Cercle',
      desc: 'Ce qui est partagé dans cette communauté reste strictement entre membres. Les captures d’écran et divulgations sont formellement proscrites.',
    },
    {
      icon: <Heart className="w-4 h-4 text-rose-400" />,
      title: 'Bienveillance & Zéro Stigmatisation',
      desc: 'Aucun jugement, discrimination ou moquerie. L’écoute active et l’encouragement mutuel sont au cœur de tous nos échanges.',
    },
    {
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
      title: 'Non-Prescription Médicale Sauvage',
      desc: 'Partagez votre vécu personnel et vos ressentis avec humilité, sans substituer vos conseils à l’avis d’un professionnel de santé.',
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      title: 'Modération & Protection Institutionnelle',
      desc: `Cette communauté est encadrée et modérée sous la supervision éthique de ${orgName}.`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0e1626] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Banner with dark gradient */}
        <div className="relative h-40 sm:h-48 w-full shrink-0 overflow-hidden bg-slate-900">
          <img
            src={community.coverImage || community.image}
            alt={community.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#0e1626] via-[#0e1626]/70 to-black/50" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer z-10"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Org & Community Header Overlay */}
          <div className="absolute bottom-4 left-5 right-5 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20 shrink-0 bg-slate-800">
                <img
                  src={community.image || organization?.logo}
                  alt={orgName}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs font-bold text-slate-200 truncate">
                {orgName}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-black uppercase">
                Cercle Protégé
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">
              {community.name}
            </h2>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 text-slate-300 text-sm">
          
          {/* Description */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mission & Présentation</span>
              </h3>
              <TranslateButton
                compact
                originalText={community.description}
                targetLanguage={language}
                onToggleTranslation={(active, text) => {
                  setDescTranslation({ translated: active, text });
                }}
              />
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {descTranslation.translated ? descTranslation.text : community.description}
            </p>
          </div>

          {/* Specific Community Rules */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Règles spécifiques de la communauté ({community.rules.length})</span>
            </h3>

            <div className="space-y-2">
              {community.rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#111927] border border-slate-800/80 flex items-start gap-3 text-xs sm:text-sm text-slate-200"
                >
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 border border-cyan-500/30">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* General Sanctuary Principles */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Charte éthique Tulizaana</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {defaultSanctuaryPrinciples.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-white">
                    {item.icon}
                    <span>{item.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Notice */}
          <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 flex items-center gap-3 text-xs text-teal-200">
            <Building2 className="w-5 h-5 text-teal-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">
                Validation par {orgName}
              </span>
              <span>
                L'inscription est vérifiée par les animateurs institutionnels pour garantir la sécurité et la sérénité du cercle de parole.
              </span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 bg-[#0a0f1a] border-t border-slate-800/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>{community.membersCount} membres actifs</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              Fermer
            </button>

            {isJoined ? (
              <button
                onClick={() => {
                  onClose();
                  onOpenProfile(community.id);
                }}
                className="px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Accéder au profil</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  onJoin(community.id);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-2xl bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-black shadow-lg shadow-teal-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accepter les règles & S'inscrire</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
