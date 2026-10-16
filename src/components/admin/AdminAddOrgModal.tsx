import React, { useState } from 'react';
import {
  Building2,
  X,
  CheckCircle2,
  Mail,
  Phone,
  Globe,
  User,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Organization } from '../../types';

interface AdminAddOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOrganization: (org: Organization) => void;
  onShowToast: (msg: string) => void;
  onRecordLog: (action: string, resource: string, details: string) => void;
}

export const AdminAddOrgModal: React.FC<AdminAddOrgModalProps> = ({
  isOpen,
  onClose,
  onAddOrganization,
  onShowToast,
  onRecordLog,
}) => {
  const [name, setName] = useState('');
  const [acronym, setAcronym] = useState('');
  const [responsibleName, setResponsibleName] = useState('');
  const [responsibleEmail, setResponsibleEmail] = useState('');
  const [responsiblePhone, setResponsiblePhone] = useState('');
  const [country, setCountry] = useState('RD Congo');
  const [city, setCity] = useState('Kinshasa');
  const [mission, setMission] = useState('');
  const [status, setStatus] = useState<Organization['status']>('approved');
  const [plan, setPlan] = useState<'starter' | 'growth' | 'enterprise'>('starter');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !responsibleName.trim()) {
      onShowToast('Veuillez renseigner au moins le nom et le responsable');
      return;
    }

    const orgId = `org-${Date.now()}`;
    const newOrg: Organization = {
      id: orgId,
      name: name.trim(),
      acronym: acronym.trim() || undefined,
      domain: 'Santé communautaire & Soutien psychosocial',
      description: mission.trim() || 'Organisation partenaire de santé et d’entraide communautaire.',
      mission: mission.trim() || 'Accompagnement, sensibilisation et soutien psychosocial.',
      responsibleName: responsibleName.trim(),
      contactEmail: responsibleEmail.trim() || 'contact@partenaire.org',
      contactPhone: responsiblePhone.trim() || '+243 81 000 0000',
      logo: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=150&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1200&auto=format&fit=crop&q=80',
      type: 'ong',
      country: country.trim(),
      city: city.trim(),
      status,
      subscriptionPlan: plan,
      quotaCommunities: {
        used: 0,
        max: plan === 'enterprise' ? 50 : plan === 'growth' ? 15 : 5,
      },
      quotaMembers: {
        used: 0,
        max: plan === 'enterprise' ? 10000 : plan === 'growth' ? 2500 : 500,
      },
      quotaCampaignsPerMonth: {
        used: 0,
        max: plan === 'enterprise' ? 10 : plan === 'growth' ? 5 : 2,
      },
      createdAt: new Date().toISOString(),
      validatedAt: status === 'approved' ? new Date().toISOString() : undefined,
    };

    onAddOrganization(newOrg);
    onShowToast(`Organisation « ${newOrg.name} » créée avec succès`);
    onRecordLog(
      'Création Directe Organisation',
      newOrg.name,
      `Créée avec le plan ${plan} et statut ${status}`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 animate-scale-up my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Ajouter une Organisation Partenaire</h2>
            <p className="text-xs text-slate-400">
              Enregistrement direct au registre central des ONG et associations Tulizaana.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nom officiel de l'organisation *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Ligue Nationale contre le Diabète"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Sigle / Acronyme</label>
              <input
                type="text"
                placeholder="Ex: LNCD"
                value={acronym}
                onChange={(e) => setAcronym(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Responsable légal ou Coordinateur *
              </label>
              <input
                type="text"
                required
                placeholder="Dr. Jean Paul Tshilombo"
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email officiel</label>
              <input
                type="email"
                placeholder="direction@organisation.org"
                value={responsibleEmail}
                onChange={(e) => setResponsibleEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Téléphone officiel</label>
              <input
                type="text"
                placeholder="+243 81 234 5678"
                value={responsiblePhone}
                onChange={(e) => setResponsiblePhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Pays</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ville</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Mission & Domaines d'intervention
            </label>
            <textarea
              rows={2}
              placeholder="Accompagnement des personnes vivant avec une maladie chronique, éducation thérapeutique..."
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Statut Initial</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="approved">Approuvée & Validée Immédiatement</option>
                <option value="pending">En attente de vérification légale</option>
                <option value="under_review">Dossier sous examen</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Formule / Plan</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="starter">Starter (500 membres, 2 campagnes)</option>
                <option value="growth">Croissance (2 500 membres, 5 campagnes)</option>
                <option value="enterprise">Entreprise / ONG Internationale (10 000+)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              Enregistrer l'Organisation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
