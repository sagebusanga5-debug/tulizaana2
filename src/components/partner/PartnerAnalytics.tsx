import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Heart,
  Users,
  Trophy,
  Sparkles,
  Smile,
  Activity,
} from 'lucide-react';
import { PartnerMetrics } from '../../types';

interface PartnerAnalyticsProps {
  metrics: PartnerMetrics;
}

export const PartnerAnalytics: React.FC<PartnerAnalyticsProps> = ({ metrics }) => {
  return (
    <div className="space-y-6">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight">
            Analytique & Impact
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Indicateurs agrégés et anonymisés mesurant la rupture de l'isolement et l'entraide mutuelle.
          </p>
        </div>
      </div>

      {/* 3 HIGHLIGHT METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        
        <div className="p-4 sm:p-5 rounded-2xl bg-[#111827] border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Indice de Résilience
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-display">
            +42.8%
          </div>
          <p className="text-[11px] text-slate-400">
            Augmentation moyenne de la confiance après un parcours de 21 jours.
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#111827] border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Régularité d'Engagement
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-display">
            84.2%
          </div>
          <p className="text-[11px] text-slate-400">
            Des participants reviennent au moins 4 fois par semaine.
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#111827] border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Soutien Réciproque
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-display">
            9.4 / 10
          </div>
          <p className="text-[11px] text-slate-400">
            Score moyen de sécurité émotionnelle et de fraternité ressenti.
          </p>
        </div>
      </div>

      {/* VISUAL CHARTS & BREAKDOWNS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Reaction Breakdown Chart */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#111827] border border-slate-800/80 space-y-5">
          <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Répartition des Réactions Bienveillantes</span>
          </h3>

          <div className="space-y-3.5">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  ❤️ Soutien (42%)
                </span>
                <span className="font-bold text-rose-400 font-mono">1,620</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div style={{ width: '42%' }} className="h-full bg-rose-500 rounded-full" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  🤝 Je comprends (28%)
                </span>
                <span className="font-bold text-cyan-400 font-mono">1,080</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div style={{ width: '28%' }} className="h-full bg-cyan-400 rounded-full" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  🌱 Courage (18%)
                </span>
                <span className="font-bold text-emerald-400 font-mono">694</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div style={{ width: '18%' }} className="h-full bg-emerald-400 rounded-full" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  👏 Bravo (12%)
                </span>
                <span className="font-bold text-amber-400 font-mono">462</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div style={{ width: '12%' }} className="h-full bg-amber-400 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Activity Growth Chart */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#111827] border border-slate-800/80 space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" />
              <span>Activité Hebdomadaire des Cercles</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Nombre d'interactions quotidiennes
            </p>
          </div>

          <div className="flex items-end justify-between gap-2.5 h-36 pt-2">
            {[
              { day: 'Lun', height: '65%', val: '410' },
              { day: 'Mar', height: '80%', val: '520' },
              { day: 'Mer', height: '95%', val: '640' },
              { day: 'Jeu', height: '75%', val: '490' },
              { day: 'Ven', height: '85%', val: '560' },
              { day: 'Sam', height: '90%', val: '590' },
              { day: 'Dim', height: '100%', val: '680' },
            ].map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className="text-[10px] text-cyan-400 font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.val}
                </span>
                <div
                  style={{ height: item.height }}
                  className="w-full rounded-lg bg-linear-to-t from-cyan-500 to-teal-400 group-hover:from-cyan-400 group-hover:to-teal-300 transition-all"
                />
                <span className="text-[11px] font-medium text-slate-400">{item.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
