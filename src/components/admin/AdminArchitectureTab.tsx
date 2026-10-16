import React, { useState, useEffect } from 'react';
import {
  Server,
  Database,
  Cloud,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  HardDrive,
  FileCode,
  Zap,
  Globe,
  UploadCloud,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { getSupabaseFrontendConfigStatus } from '../../services/supabaseClient';
import { uploadMediaToCloudinary } from '../../services/cloudinaryService';

interface AdminArchitectureTabProps {
  onShowToast: (msg: string) => void;
}

export const AdminArchitectureTab: React.FC<AdminArchitectureTabProps> = ({ onShowToast }) => {
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);
  const [supabaseFrontendStatus, setSupabaseFrontendStatus] = useState<{
    tested: boolean;
    connected: boolean;
    message: string;
  }>({ tested: false, connected: false, message: '' });

  const [cloudinaryTestStatus, setCloudinaryTestStatus] = useState<{
    testing: boolean;
    success?: boolean;
    url?: string;
    message?: string;
  }>({ testing: false });

  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [sqlContent, setSqlContent] = useState<string>('');
  const [loadingSql, setLoadingSql] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.health.check();
      if (res.success && res.data) {
        setHealthData(res.data);
      }
    } catch (err: any) {
      console.warn('Health check error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTestSupabase = async () => {
    setLoading(true);

    try {
      // 1. Tester d'abord le Backend (Node.js/Express + Prisma + Supabase PostgreSQL)
      const backendTest = await api.schema.testSupabase();

      if (backendTest.success && backendTest.data?.connected) {
        const msg = backendTest.data.message;
        setSupabaseFrontendStatus({
          tested: true,
          connected: true,
          message: msg,
        });
        onShowToast(msg);
        fetchStatus();
        return;
      }

      // 2. Si le backend est connecté, on s'arrête là (autorité = Express)
      if (backendTest.success && backendTest.data?.connected) {
        const msg = backendTest.data.message;
        setSupabaseFrontendStatus({
          tested: true,
          connected: true,
          message: msg,
        });
        onShowToast(msg);
        fetchStatus();
        return;
      }

      // 3. Le backend n'est pas connecté : vérifier seulement la configuration
      //    du client Supabase frontend, SANS toucher aux tables métier.
      const frontendConfig = getSupabaseFrontendConfigStatus();
      const fallbackMsg =
        backendTest.data?.message ||
        frontendConfig.message ||
        'Variables Supabase non détectées sur cet environnement.';

      setSupabaseFrontendStatus({
        tested: true,
        connected: false,
        message: fallbackMsg,
      });
      onShowToast(fallbackMsg);
    } catch (err: any) {
      setSupabaseFrontendStatus({
        tested: true,
        connected: false,
        message: err?.message || 'Erreur lors du test de connexion Supabase.',
      });
      onShowToast(err?.message || 'Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSqlScript = async () => {
    setLoadingSql(true);
    try {
      const res = await api.schema.getSupabaseSql();
      if (res.success && res.data?.sql) {
        setSqlContent(res.data.sql);
        setShowSqlModal(true);
      } else {
        onShowToast(res.error || 'Erreur lors de la récupération du script SQL.');
      }
    } catch (err: any) {
      onShowToast(err?.message || 'Erreur réseau script SQL.');
    } finally {
      setLoadingSql(false);
    }
  };

  const handleTestCloudinary = async () => {
    setCloudinaryTestStatus({ testing: true });
    try {
      // 1x1 transparent cyan pixel PNG test
      const samplePixel =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const result = await uploadMediaToCloudinary(samplePixel, 'image', 'system_tests');
      setCloudinaryTestStatus({
        testing: false,
        success: true,
        url: result.url,
        message: `Média téléversé avec succès via ${result.provider} !`,
      });
      onShowToast(`Cloudinary OK: média hébergé sur ${result.provider}`);
    } catch (err: any) {
      setCloudinaryTestStatus({
        testing: false,
        success: false,
        message: err?.message || 'Échec du test de téléversement.',
      });
      onShowToast(`Erreur Cloudinary: ${err?.message}`);
    }
  };

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    onShowToast('Copié dans le presse-papier !');
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const vercelEnvTemplate = `# --- CONFIGURATION VERCEL ⇄ SUPABASE INTEGRATION ---
Les variables serveur doivent etre configurees uniquement dans le secret manager de l'hebergeur.
Le bundle frontend ne doit embarquer aucun nom ni exemple de secret backend.
`;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-cyan-500/30 shadow-xl shadow-cyan-950/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Architecture 100% Fonctionnelle (Vercel • Supabase • Cloudinary)
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  Prêt pour Production
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Frontend déployé sur Vercel avec routage SPA et CDN mondial, Backend PostgreSQL & Auth sur Supabase, et stockage médias haute performance sur Cloudinary.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchStatus}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser diagnostics</span>
          </button>
        </div>
      </div>

      {/* 2. Three Pillars Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* PILLAR 1: VERCEL */}
        <div className="p-5 rounded-3xl bg-[#090E17] border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-white">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                vercel.json Actif
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">1. Frontend sur Vercel</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Vite React SPA, bundle ultra-rapide avec routage PWA et headers de sécurité.
              </p>
            </div>

            <ul className="text-xs space-y-2 text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Règles de réécriture SPA (<code className="text-cyan-300 font-mono text-[10px]">/index.html</code>)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Mise en cache immuable des assets statiques</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Sécurité HTTP : CSP, HSTS, X-Frame DENY</span>
              </li>
            </ul>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Accéder à Vercel Dashboard</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>

        {/* PILLAR 2: SUPABASE */}
        <div className="p-5 rounded-3xl bg-[#090E17] border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                healthData?.services?.database?.connected
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              }`}>
                {healthData?.services?.database?.connected ? 'Supabase Connecté' : 'Configuration Requise'}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">2. Backend avec Supabase</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Base relationnelle PostgreSQL avec Prisma, Transaction Pooler et SDK JS.
              </p>
            </div>

            <ul className="text-xs space-y-2 text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Prisma Client singleton avec reconnexion</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>SDK <code className="text-emerald-300 font-mono text-[10px]">@supabase/supabase-js</code> configuré</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Authentification Bearer JWT native</span>
              </li>
            </ul>

            {supabaseFrontendStatus.tested && (
              <div className={`p-2 rounded-xl text-[11px] flex items-center gap-1.5 ${
                supabaseFrontendStatus.connected
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              }`}>
                {supabaseFrontendStatus.connected ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="truncate">{supabaseFrontendStatus.message}</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTestSupabase}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Zap className="w-3 h-3" />
                <span>Tester Supabase</span>
              </button>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
                title="Ouvrir Supabase Dashboard"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <button
              type="button"
              onClick={handleLoadSqlScript}
              disabled={loadingSql}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{loadingSql ? 'Chargement du SQL...' : 'Créer les tables (Script SQL 1-Clic)'}</span>
            </button>
          </div>
        </div>

        {/* PILLAR 3: CLOUDINARY */}
        <div className="p-5 rounded-3xl bg-[#090E17] border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                <Cloud className="w-5 h-5" />
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                healthData?.services?.cloudinary?.configured
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              }`}>
                {healthData?.services?.cloudinary?.configured
                  ? `Cloudinary : ${healthData?.services?.cloudinary?.cloudName || 'Actif'}`
                  : 'Mode Repli Sécurisé'}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">3. Médias sur Cloudinary</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Hébergement cloud CDN pour photos de profils, pièces jointes et messages vocaux.
              </p>
            </div>

            <ul className="text-xs space-y-2 text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>SDK Node.js Cloudinary v2 intégré au contrôleur</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Optimisation auto (WebP, compression intelligente)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Gestion images et audios vocaux avec CDN HTTPS</span>
              </li>
            </ul>

            {cloudinaryTestStatus.message && (
              <div className={`p-2 rounded-xl text-[11px] flex items-center gap-1.5 ${
                cloudinaryTestStatus.success
                  ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              }`}>
                {cloudinaryTestStatus.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="truncate">{cloudinaryTestStatus.message}</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex gap-2">
            <button
              type="button"
              onClick={handleTestCloudinary}
              disabled={cloudinaryTestStatus.testing}
              className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <UploadCloud className="w-3 h-3" />
              <span>{cloudinaryTestStatus.testing ? 'Téléversement...' : 'Tester un upload'}</span>
            </button>
            <a
              href="https://cloudinary.com/console"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
              title="Ouvrir Cloudinary Console"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* 3. Production Environment Variables Template Generator */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <FileCode className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Variables d’Environnement pour Déploiement Vercel & Supabase
              </h3>
              <p className="text-xs text-slate-400">
                Copiez ces variables dans les paramètres de votre projet Vercel (Settings &gt; Environment Variables).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => copyToClipboard(vercelEnvTemplate, 'env')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md shadow-cyan-500/20"
          >
            {copiedSection === 'env' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copier le modèle .env</span>
          </button>
        </div>

        <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-200/90 overflow-x-auto leading-relaxed">
          {vercelEnvTemplate}
        </pre>
      </div>

      {/* 4. MODAL SCRIPT SQL INITIALISATION SUPABASE */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl max-h-[85vh] bg-[#0c1322] border border-cyan-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Script SQL d'Initialisation des Tables Supabase
                  </h3>
                  <p className="text-xs text-slate-400">
                    Crée automatiquement les 14 tables, relations et index dans votre base PostgreSQL
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction steps */}
            <div className="p-5 bg-slate-900/60 border-b border-slate-800 space-y-2">
              <div className="text-xs font-bold text-cyan-300">Comment appliquer ce script en 1 minute :</div>
              <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside">
                <li>
                  Cliquez sur <strong>« Copier l'intégralité du script SQL »</strong> ci-dessous.
                </li>
                <li>
                  Ouvrez votre tableau de bord Supabase :{' '}
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 underline inline-flex items-center gap-1 font-semibold"
                  >
                    <span>Supabase Dashboard</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  Dans le menu de gauche, cliquez sur <strong>SQL Editor</strong> (icône &lt;&gt; ou terminal).
                </li>
                <li>
                  Cliquez sur <strong>« New Query »</strong>, collez le script, puis cliquez sur <strong>« Run » (Ctrl+Enter)</strong>.
                </li>
              </ol>
            </div>

            {/* SQL Content Viewport */}
            <div className="p-5 overflow-y-auto grow">
              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300/90 leading-relaxed overflow-x-auto whitespace-pre">
                {sqlContent}
              </pre>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-[#090e17] flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Taille : {Math.round(sqlContent.length / 1024)} Ko • 14 tables gérées
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSqlModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(sqlContent, 'sql_all')}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
                >
                  {copiedSection === 'sql_all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>Copier l'intégralité du script SQL</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
