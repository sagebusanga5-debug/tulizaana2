import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { Language } from '../../types';

interface OfflineIndicatorProps {
  language?: Language;
}

const translations = {
  fr: {
    offline: 'Mode hors-ligne • Données en cache disponibles',
    restored: 'Connexion internet rétablie',
  },
  en: {
    offline: 'Offline Mode • Cached data available',
    restored: 'Internet connection restored',
  },
  ar: {
    offline: 'وضع عدم الاتصال • البيانات المخزنة متاحة',
    restored: 'تمت استعادة الاتصال بالإنترنت',
  },
  pt: {
    offline: 'Modo offline • Dados em cache disponíveis',
    restored: 'Conexão com a internet restabelecida',
  },
  sw: {
    offline: 'Hali ya nje ya mtandao • Data iliyohifadhiwa inapatikana',
    restored: 'Muunganisho wa mtandao umerudishwa',
  },
};

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ language = 'fr' }) => {
  const isOnline = useOnlineStatus();
  const [showRestored, setShowRestored] = useState(false);
  const [hasBeenOffline, setHasBeenOffline] = useState(false);

  const t = translations[language] || translations.fr;

  useEffect(() => {
    if (!isOnline) {
      setHasBeenOffline(true);
      setShowRestored(false);
    } else if (hasBeenOffline) {
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
        setHasBeenOffline(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, hasBeenOffline]);

  if (isOnline && !showRestored) {
    return null;
  }

  if (showRestored) {
    return (
      <aside
        aria-label="Statut de connexion"
        className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-500/95 text-slate-950 font-bold text-xs shadow-2xl shadow-emerald-500/30 backdrop-blur-md transition-all duration-300 animate-bounce"
      >
        <Wifi className="w-4 h-4 text-slate-950" />
        <span>{t.restored}</span>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Alerte mode hors-ligne"
      className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900/95 border border-amber-500/60 text-amber-300 font-semibold text-xs shadow-2xl shadow-amber-500/20 backdrop-blur-md transition-all duration-300"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
      </span>
      <WifiOff className="w-4 h-4 text-amber-400" />
      <span>{t.offline}</span>
    </aside>
  );
};
