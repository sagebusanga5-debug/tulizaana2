import React from 'react';
import {
  X,
  Bell,
  Heart,
  MessageSquare,
  Trophy,
  Award,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { AppNotification, Language } from '../../types';
import { t } from '../../translations';

interface NotificationDrawerProps {
  notifications?: AppNotification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
  language?: Language;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  notifications = [],
  isOpen,
  onClose,
  onMarkAllRead,
  language = 'fr',
}) => {
  if (!isOpen) return null;

  const strings = t[language]?.notificationsDrawer || t.fr.notificationsDrawer;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'reaction':
        return <Heart className="w-4 h-4 text-rose-400" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-cyan-400" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case 'campaign_activity':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      case 'badge_earned':
        return <Award className="w-4 h-4 text-emerald-400" />;
      case 'status_upgrade':
        return <Sparkles className="w-4 h-4 text-teal-400" />;
      case 'announcement':
      default:
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-[#182231] h-full border-l border-slate-800 shadow-2xl flex flex-col justify-between">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white font-display">
              {strings.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  notif.isRead
                    ? 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                    : 'bg-slate-900 border-cyan-500/30 text-slate-200 shadow-sm'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      {notif.title}
                    </span>
                    <span className="text-[10px] text-slate-400">{notif.timestamp}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300">
                    {notif.message}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-300">{strings.emptyTitle}</p>
              <p>{strings.emptyDesc}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#111827] flex items-center justify-between">
          <button
            onClick={onMarkAllRead}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
          >
            {strings.markAllRead}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
          >
            {language === 'sw' ? 'Funga' : language === 'en' ? 'Close' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
};
