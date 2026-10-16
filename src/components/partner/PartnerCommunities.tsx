import React, { useState } from 'react';
import {
  Building2,
  PlusCircle,
  KeyRound,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  X,
  Lock,
  Edit3,
} from 'lucide-react';
import { Community, InvitationCode, Organization } from '../../types';

interface PartnerCommunitiesProps {
  organization: Organization;
  communities?: Community[];
  invitations?: InvitationCode[];
  onCreateCommunity: (newComm: Partial<Community>) => void;
  onUpdateCommunity?: (communityId: string, updatedData: Partial<Community>) => void;
  onGenerateInviteCodes: (data: {
    communityId: string;
    count: number;
    maxUses: number;
  }) => void;
}

export const PartnerCommunities: React.FC<PartnerCommunitiesProps> = ({
  organization,
  communities = [],
  invitations = [],
  onCreateCommunity,
  onUpdateCommunity,
  onGenerateInviteCodes,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Edit Community Modal State
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editRules, setEditRules] = useState('');
  const [editStatus, setEditStatus] = useState<Community['status']>('active');
  const [editCoverImage, setEditCoverImage] = useState('');

  // Form states for creation
  const [newCommName, setNewCommName] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');
  const [newCommRules, setNewCommRules] = useState('');

  const [inviteCommunityId, setInviteCommunityId] = useState(communities?.[0]?.id || '');
  const [inviteCount, setInviteCount] = useState(5);
  const [inviteMaxUses, setInviteMaxUses] = useState(1);

  const orgCommunities = (communities || []).filter((c) => c.organizationId === organization.id);
  const orgInvitations = (invitations || []).filter((inv) =>
    orgCommunities.some((c) => c.id === inv.communityId)
  );

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommName.trim()) return;

    onCreateCommunity({
      name: newCommName.trim(),
      description: newCommDesc.trim(),
      organizationId: organization.id,
      organizationName: organization.name,
      status: 'pending_review',
      membersCount: 1,
      activeCampaignsCount: 0,
      rules: newCommRules.split('\n').filter((r) => r.trim().length > 0),
    });

    setShowCreateModal(false);
    setNewCommName('');
    setNewCommDesc('');
    setNewCommRules('');
  };

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateInviteCodes({
      communityId: inviteCommunityId,
      count: inviteCount,
      maxUses: inviteMaxUses,
    });
    setShowInviteModal(false);
  };

  const handleStartEdit = (comm: Community) => {
    setEditingCommunity(comm);
    setEditName(comm.name);
    setEditDesc(comm.description || '');
    setEditRules(comm.rules ? comm.rules.join('\n') : '');
    setEditStatus(comm.status || 'active');
    setEditCoverImage(comm.coverImage || comm.image || '');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommunity || !editName.trim()) return;

    const updatedData: Partial<Community> = {
      name: editName.trim(),
      description: editDesc.trim(),
      status: editStatus,
      coverImage: editCoverImage.trim() || editingCommunity.coverImage,
      rules: editRules.split('\n').filter((r) => r.trim().length > 0),
    };

    if (onUpdateCommunity) {
      onUpdateCommunity(editingCommunity.id, updatedData);
    }
    setEditingCommunity(null);
  };

  const getStatusBadge = (status: Community['status']) => {
    switch (status) {
      case 'draft':
        return { label: 'Brouillon', color: 'bg-slate-800 text-slate-400 border-slate-700' };
      case 'pending_review':
        return { label: 'En attente de validation', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'approved':
        return { label: 'Approuvée', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      case 'active':
        return { label: 'Active (Cercle Ouvert)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight">
              Communautés & Cercles
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-[11px] font-semibold border border-cyan-500/20">
              {orgCommunities.length} actifs
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Espaces d'entraide étanches, règles de bienveillance et codes d'invitation sécurisés.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            <span>Générer Codes</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Nouvelle Communauté</span>
          </button>
        </div>
      </div>

      {/* COMMUNITIES GRID */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Cercles sous la responsabilité de {organization.name}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orgCommunities.map((comm) => {
            const statusBadge = getStatusBadge(comm.status);

            return (
              <div
                key={comm.id}
                className="p-5 rounded-2xl bg-[#111827] border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-mono text-slate-500">ID: {comm.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white font-display">
                    {comm.name}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {comm.description}
                  </p>

                  {/* Rules summary */}
                  {comm.rules && comm.rules.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-0.5">
                      <span className="font-semibold text-cyan-400 text-[10px] uppercase tracking-wider block">
                        Règles :
                      </span>
                      <p className="line-clamp-1">{comm.rules.join(' • ')}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-semibold text-white">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      {comm.membersCount} membres
                    </span>
                    <span>•</span>
                    <span>{comm.activeCampaignsCount} campagnes</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(comm)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
                      title="Modifier les contenus de la communauté"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Modifier</span>
                    </button>

                    <button
                      onClick={() => {
                        setInviteCommunityId(comm.id);
                        setShowInviteModal(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold flex items-center gap-1 border border-cyan-500/30 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                      <span>+ Codes</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ACTIVE INVITATION CODES TABLE */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#111827] border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white font-display">
              Codes d'Accès Actifs ({orgInvitations.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Transmettez ces codes à vos bénéficiaires
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3 rounded-l-lg">Code d'accès</th>
                <th className="p-3">Communauté</th>
                <th className="p-3">Utilisations</th>
                <th className="p-3">Expiration</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-right rounded-r-lg">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {orgInvitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-900/30">
                  <td className="p-3 font-mono font-bold text-cyan-400">
                    {inv.code}
                  </td>
                  <td className="p-3 font-medium text-white">
                    {inv.communityName}
                  </td>
                  <td className="p-3 text-slate-300">
                    {inv.usedCount} / {inv.maxUses}
                  </td>
                  <td className="p-3 text-slate-400">
                    {inv.expiresAt}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold border border-emerald-500/20">
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleCopyCode(inv.code, inv.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium inline-flex items-center gap-1 border border-slate-700 cursor-pointer"
                    >
                      {copiedCodeId === inv.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-cyan-400" />
                          <span>Copier</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE COMMUNITY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#182231] rounded-3xl border border-slate-700 p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white font-display">
                Créer une nouvelle Communauté Fermée
              </h3>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nom de la communauté :
                </label>
                <input
                  type="text"
                  required
                  value={newCommName}
                  onChange={(e) => setNewCommName(e.target.value)}
                  placeholder="Ex : Vaincre l’Épilepsie Ensemble"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Description & Objectif de la communauté :
                </label>
                <textarea
                  required
                  rows={3}
                  value={newCommDesc}
                  onChange={(e) => setNewCommDesc(e.target.value)}
                  placeholder="Expliquez la mission d'entraide et le public cible..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Règles de bienveillance (une par ligne) :
                </label>
                <textarea
                  rows={3}
                  value={newCommRules}
                  onChange={(e) => setNewCommRules(e.target.value)}
                  placeholder="Pas de jugement&#10;Confidentialité stricte&#10;Écoute bienveillante"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-slate-300 text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold shadow-md shadow-cyan-500/20"
                >
                  Soumettre pour activation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATE INVITE CODES MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#182231] rounded-3xl border border-slate-700 p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white font-display">
                Générer un lot de codes d'invitation
              </h3>
              <button onClick={() => setShowInviteModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleGenerateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Communauté cible :
                </label>
                <select
                  value={inviteCommunityId}
                  onChange={(e) => setInviteCommunityId(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                >
                  {orgCommunities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nombre de codes :
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={inviteCount}
                    onChange={(e) => setInviteCount(parseInt(e.target.value) || 1)}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Max utilisations / code :
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={inviteMaxUses}
                    onChange={(e) => setInviteMaxUses(parseInt(e.target.value) || 1)}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-slate-300 text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold shadow-md shadow-cyan-500/20"
                >
                  Générer les codes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COMMUNITY MODAL */}
      {editingCommunity && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#182231] rounded-3xl border border-slate-700 p-6 sm:p-8 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">
                    Modifier la Communauté
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {editingCommunity.id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCommunity(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nom de la communauté fermée :
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Statut de diffusion :
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Community['status'])}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400 cursor-pointer"
                >
                  <option value="active">Active (Cercle ouvert aux membres avec code)</option>
                  <option value="pending_review">En attente de validation éthique</option>
                  <option value="draft">Brouillon (Non visible)</option>
                  <option value="approved">Approuvée</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Image de couverture (URL) :
                </label>
                <input
                  type="url"
                  value={editCoverImage}
                  onChange={(e) => setEditCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Description détaillée & Mission d'entraide :
                </label>
                <textarea
                  rows={3}
                  required
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Charte et Règles du cercle (une règle par ligne) :
                </label>
                <textarea
                  rows={4}
                  value={editRules}
                  onChange={(e) => setEditRules(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-sans focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCommunity(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
