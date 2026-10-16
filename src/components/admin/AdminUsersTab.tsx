import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  HeartHandshake,
  UserCheck,
  UserX,
  AlertTriangle,
  Award,
  ChevronRight,
  X,
  Phone,
  Mail,
  Activity,
  Check,
} from 'lucide-react';
import { UserProfile, UserRole, MemberStatus } from '../../types';

interface AdminUsersTabProps {
  users: UserProfile[];
  onUpdateUser?: (userId: string, updatedFields: Partial<UserProfile>) => void;
  onShowToast: (msg: string) => void;
  onRecordLog: (action: string, resource: string, details: string) => void;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  users,
  onUpdateUser,
  onShowToast,
  onRecordLog,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal for changing user role
  const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState<UserProfile | null>(null);
  const [chosenRole, setChosenRole] = useState<UserRole>('member');
  const [chosenStatus, setChosenStatus] = useState<MemberStatus>('active_participant');

  // Modal for gentle warning
  const [selectedUserForWarning, setSelectedUserForWarning] = useState<UserProfile | null>(null);
  const [warningMessage, setWarningMessage] = useState('');

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter || (roleFilter === 'user' && (u.role === 'member' || !u.role));
    const isSuspended = !!u.isSuspended || (u as any).accountStatus === 'suspended';
    const isWarned = (u as any).accountStatus === 'warned';
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && !isSuspended) ||
      (statusFilter === 'suspended' && isSuspended) ||
      (statusFilter === 'warned' && isWarned);

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      (u.pseudonym && u.pseudonym.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.bio && u.bio.toLowerCase().includes(q));

    return matchesRole && matchesStatus && matchesSearch;
  });

  const totalUsers = users.length;
  const peerHelpersCount = users.filter((u) => u.status === 'mentor' || u.role === 'peer_helper').length;
  const suspendedCount = users.filter((u) => !!u.isSuspended || (u as any).accountStatus === 'suspended').length;

  const handleOpenRoleModal = (user: UserProfile) => {
    setSelectedUserForRoleChange(user);
    setChosenRole(user.role || 'member');
    setChosenStatus(user.status || 'active_participant');
  };

  const handleSaveRole = () => {
    if (!selectedUserForRoleChange) return;
    if (onUpdateUser) {
      onUpdateUser(selectedUserForRoleChange.id, {
        role: chosenRole,
        status: chosenStatus,
      });
    }
    onShowToast(`Rôle de ${selectedUserForRoleChange.name} mis à jour : ${chosenRole}`);
    onRecordLog(
      'Modification Rôle Utilisateur',
      selectedUserForRoleChange.name,
      `Rôle attribué : ${chosenRole} | Statut : ${chosenStatus}`
    );
    setSelectedUserForRoleChange(null);
  };

  const handleSendWarning = () => {
    if (!selectedUserForWarning) return;
    if (onUpdateUser) {
      onUpdateUser(selectedUserForWarning.id, {
        ...(selectedUserForWarning as any),
        accountStatus: 'warned',
      });
    }
    onShowToast(`Avertissement bienveillant envoyé à ${selectedUserForWarning.name}`);
    onRecordLog(
      'Avertissement Modération',
      selectedUserForWarning.name,
      warningMessage || 'Rappel à l’ordre bienveillant concernant la charte de confidentialité'
    );
    setSelectedUserForWarning(null);
    setWarningMessage('');
  };

  const handleToggleSuspend = (user: UserProfile) => {
    const isSuspended = !!user.isSuspended || (user as any).accountStatus === 'suspended';
    const nextSuspended = !isSuspended;

    if (onUpdateUser) {
      onUpdateUser(user.id, {
        isSuspended: nextSuspended,
        ...(user as any),
        accountStatus: nextSuspended ? 'suspended' : 'active',
      });
    }

    const actionText = nextSuspended ? 'Compte suspendu' : 'Compte réactivé';
    onShowToast(`${actionText} pour ${user.name}`);
    onRecordLog(
      nextSuspended ? 'Suspension Compte' : 'Réactivation Compte',
      user.name,
      nextSuspended ? 'Suspension du profil' : 'Levée de la suspension'
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Membres Inscrits</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalUsers}</p>
          <span className="text-[11px] text-cyan-400">Tous cercles confondus</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Pair-Aidants & Mentors</span>
            <HeartHandshake className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{peerHelpersCount}</p>
          <span className="text-[11px] text-slate-400">Formés à l'écoute active</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Comptes Suspendus</span>
            <UserX className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400 mt-2">{suspendedCount}</p>
          <span className="text-[11px] text-slate-400">Mesures de protection</span>
        </div>
      </div>

      {/* Control Bar: Search & Role / Status Filters */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, pseudo, email, téléphone, pathologie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Role selector */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">Tous les rôles</option>
            <option value="user">Membre usager</option>
            <option value="peer_helper">Pair-aidant certifié</option>
            <option value="professional">Professionnel santé</option>
            <option value="moderator">Modérateur</option>
            <option value="admin">Administrateur</option>
          </select>

          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs uniquement</option>
            <option value="warned">Avertis</option>
            <option value="suspended">Suspendus</option>
          </select>
        </div>
      </div>

      {/* Users List Table / Cards */}
      {filteredUsers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-300">Aucun utilisateur trouvé</p>
          <p className="text-xs text-slate-500 mt-1">Ajustez vos filtres ou termes de recherche.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const isSuspended = !!user.isSuspended || (user as any).accountStatus === 'suspended';
            const isWarned = (user as any).accountStatus === 'warned';

            const roleBadge = {
              peer_helper: { label: 'Pair-Aidant', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
              mentor: { label: 'Pair-Aidant', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
              professional: { label: 'Médecin / Psy', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
              moderator: { label: 'Modérateur', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
              admin: { label: 'Admin', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
              superadmin: { label: 'Super Admin', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
              partner_admin: { label: 'Admin Partenaire', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
              member: { label: 'Membre', color: 'bg-slate-800 text-slate-300 border-slate-700' },
            }[user.role || 'member'] || { label: 'Membre', color: 'bg-slate-800 text-slate-300 border-slate-700' };

            return (
              <div
                key={user.id}
                className={`p-4 rounded-2xl bg-slate-900/90 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isSuspended
                    ? 'border-rose-900/40 opacity-75'
                    : isWarned
                    ? 'border-amber-900/40'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white truncate">{user.name}</h4>
                      <span className="text-xs text-slate-400 font-mono">@{user.pseudonym}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${roleBadge.color}`}>
                        {roleBadge.label}
                      </span>
                      {isSuspended && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold">
                          Suspendu
                        </span>
                      )}
                      {isWarned && !isSuspended && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                          Averti
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                      {user.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" />
                          {user.email}
                        </span>
                      )}
                      {user.phoneNumber && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {user.phoneNumber}
                        </span>
                      )}
                      {user.condition && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 text-[10px]">
                          {user.condition}
                        </span>
                      )}
                      <span className="text-cyan-400 text-[11px] font-medium">
                        {user.points || 0} pts
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => handleOpenRoleModal(user)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    Changer Rôle
                  </button>

                  <button
                    onClick={() => {
                      setSelectedUserForWarning(user);
                      setWarningMessage(`Bonjour ${user.name},\nNous vous rappelons que Tulizaana est un espace bienveillant d'entraide. Merci de veiller au respect mutuel des membres.`);
                    }}
                    title="Envoyer un avertissement bienveillant"
                    className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 cursor-pointer transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleToggleSuspend(user)}
                    title={isSuspended ? 'Réactiver le compte' : 'Suspendre le compte'}
                    className={`p-2 rounded-xl border cursor-pointer transition-colors ${
                      isSuspended
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                    }`}
                  >
                    {isSuspended ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Change Role & Status */}
      {selectedUserForRoleChange && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Changer le Rôle d'Accès</h3>
                <p className="text-xs text-slate-400">{selectedUserForRoleChange.name} (@{selectedUserForRoleChange.pseudonym})</p>
              </div>
              <button
                onClick={() => setSelectedUserForRoleChange(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Rôle Plateforme
                </label>
                <select
                  value={chosenRole}
                  onChange={(e) => setChosenRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="member">Membre usager standard</option>
                  <option value="peer_helper">Pair-aidant certifié (Animation et écoute)</option>
                  <option value="professional">Professionnel de santé (Supervision médicale)</option>
                  <option value="moderator">Modérateur d'espace communautaire</option>
                  <option value="partner_admin">Administrateur Partenaire</option>
                  <option value="admin">Administrateur système</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Statut de l'Adhérent
                </label>
                <select
                  value={chosenStatus}
                  onChange={(e) => setChosenStatus(e.target.value as MemberStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="active_participant">Participant Actif</option>
                  <option value="mentor">Mentor / Pair-Aidant</option>
                  <option value="ambassador">Ambassadeur</option>
                  <option value="contributor">Contributeur</option>
                  <option value="new_member">Nouveau membre</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedUserForRoleChange(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveRole}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold cursor-pointer"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Gentle Warning */}
      {selectedUserForWarning && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Avertissement Bienveillant</h3>
                <p className="text-xs text-slate-400">Destinataire : {selectedUserForWarning.name}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Message d'explication / Recadrage
              </label>
              <textarea
                rows={4}
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedUserForWarning(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleSendWarning}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
              >
                Transmettre l'avertissement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
