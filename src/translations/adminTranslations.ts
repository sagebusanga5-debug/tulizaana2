import { Language } from '../types';

export interface AdminStrings {
  consoleTitle: string;
  securityBadge: string;
  viewPlatform: string;
  exitConsole: string;
  overview: string;
  organizations: string;
  communities: string;
  campaigns: string;
  users: string;
  moderation: string;
  logs: string;
  settings: string;
  platformOperational: string;
  members: string;
  totalOrgs: string;
  activeCommunities: string;
  registeredMembers: string;
  pendingReports: string;
  searchPlaceholder: string;
  allFilter: string;
  pendingFilter: string;
  approvedFilter: string;
  suspendedFilter: string;
  addOrgBtn: string;
  validateOrg: string;
  manageDetails: string;
  country: string;
  responsible: string;
  status: string;
  actions: string;
  noResults: string;
  saveChanges: string;
  adminCredentials: string;
  adminEmail: string;
  adminPassword: string;
  auditTitle: string;
  changeLanguage: string;
  attentionBannerTitle: string;
  attentionBannerDesc: (orgs: number, comms: number) => string;
  viewPendingOrgs: string;
  viewPendingComms: string;
  verifiedCount: string;
  activeCount: string;
  monthlyGrowth: string;
  postsCount: string;
  postsDesc: string;
  campaignsDesc: string;
  toHandle: string;
  tabs: {
    overview: string;
    organizations: string;
    communities: string;
    campaigns: string;
    users: string;
    moderation: string;
    logs: string;
    settings: string;
  };
}

export const adminTranslations: Record<Language, AdminStrings> = {
  fr: {
    consoleTitle: 'Console Centrale SuperAdmin',
    securityBadge: 'Accès Haute Sécurité Tulizaana',
    viewPlatform: 'Voir la Plateforme',
    exitConsole: 'Quitter Console',
    overview: "Vue d'ensemble",
    organizations: 'Organisations',
    communities: 'Communautés & Demandes',
    campaigns: 'Campagnes Studio',
    users: 'Membres & Ambassadeurs',
    moderation: 'Gardiennage & Signalements',
    logs: "Journal d'Audit",
    settings: 'Sécurité & Accès',
    platformOperational: 'Plateforme opérationnelle',
    members: 'membres',
    totalOrgs: 'Organisations Partenaires',
    activeCommunities: 'Communautés Actives',
    registeredMembers: 'Membres & Bénéficiaires',
    pendingReports: 'Alertes à traiter',
    searchPlaceholder: 'Rechercher par nom, pays, responsable...',
    allFilter: 'Tous les statuts',
    pendingFilter: 'En attente de validation',
    approvedFilter: 'Validées & Actives',
    suspendedFilter: 'Suspendues / Rejetées',
    addOrgBtn: 'Ajouter une organisation',
    validateOrg: 'Valider le compte',
    manageDetails: 'Consulter & Auditer',
    country: 'Pays',
    responsible: 'Responsable',
    status: 'Statut',
    actions: 'Actions',
    noResults: 'Aucun enregistrement correspondant trouvé.',
    saveChanges: 'Enregistrer les paramètres',
    adminCredentials: "Identifiants d'accès SuperAdmin",
    adminEmail: 'Adresse email administrateur',
    adminPassword: 'Mot de passe sécurisé',
    auditTitle: 'Traçabilité et journal des opérations sensibles',
    changeLanguage: 'Langue de la console',
    attentionBannerTitle: "Demandes en attente d'approbation par l'équipe Tulizaana",
    attentionBannerDesc: (orgs, comms) => `${orgs} organisation(s) et ${comms} communauté(s) attendent votre validation pour ouvrir leurs accès complets.`,
    viewPendingOrgs: 'Examiner les organisations',
    viewPendingComms: 'Examiner les communautés',
    verifiedCount: 'validées',
    activeCount: 'actives',
    monthlyGrowth: '+18% ce mois',
    postsCount: 'Publications',
    postsDesc: 'Échanges bienveillants',
    campaignsDesc: 'Actions collectives',
    toHandle: 'À traiter',
    tabs: {
      overview: "Vue d'ensemble",
      organizations: 'Organisations',
      communities: 'Communautés',
      campaigns: 'Campagnes',
      users: 'Membres',
      moderation: 'Modération',
      logs: 'Audit',
      settings: 'Paramètres',
    },
  },

  en: {
    consoleTitle: 'Central SuperAdmin Console',
    securityBadge: 'Tulizaana High-Security Access',
    viewPlatform: 'View Platform',
    exitConsole: 'Exit Console',
    overview: 'Overview',
    organizations: 'Organizations',
    communities: 'Communities & Requests',
    campaigns: 'Campaigns Studio',
    users: 'Members & Ambassadors',
    moderation: 'Moderation & Reports',
    logs: 'Audit Log',
    settings: 'Security & Access',
    platformOperational: 'Platform operational',
    members: 'members',
    totalOrgs: 'Partner Organizations',
    activeCommunities: 'Active Communities',
    registeredMembers: 'Members & Beneficiaries',
    pendingReports: 'Pending Alerts',
    searchPlaceholder: 'Search by name, country, leader...',
    allFilter: 'All statuses',
    pendingFilter: 'Pending review',
    approvedFilter: 'Verified & Active',
    suspendedFilter: 'Suspended / Rejected',
    addOrgBtn: 'Add organization',
    validateOrg: 'Verify account',
    manageDetails: 'Review & Audit',
    country: 'Country',
    responsible: 'Responsible Leader',
    status: 'Status',
    actions: 'Actions',
    noResults: 'No matching records found.',
    saveChanges: 'Save settings',
    adminCredentials: 'SuperAdmin Access Credentials',
    adminEmail: 'Admin email address',
    adminPassword: 'Secure password',
    auditTitle: 'Audit trail and logging of sensitive operations',
    changeLanguage: 'Console language',
    attentionBannerTitle: 'Pending approval requests for Tulizaana team',
    attentionBannerDesc: (orgs, comms) => `${orgs} organization(s) and ${comms} community(ies) are waiting for your approval to grant full access.`,
    viewPendingOrgs: 'Review organizations',
    viewPendingComms: 'Review communities',
    verifiedCount: 'verified',
    activeCount: 'active',
    monthlyGrowth: '+18% this month',
    postsCount: 'Publications',
    postsDesc: 'Kind interactions',
    campaignsDesc: 'Collective actions',
    toHandle: 'Pending',
    tabs: {
      overview: 'Overview',
      organizations: 'Organizations',
      communities: 'Communities',
      campaigns: 'Campaigns',
      users: 'Members',
      moderation: 'Moderation',
      logs: 'Audit',
      settings: 'Settings',
    },
  },

  ar: {
    consoleTitle: 'لوحة التحكم المركزية للمشرف العام',
    securityBadge: 'وصول عالي الأمان توليزانا',
    viewPlatform: 'عرض المنصة',
    exitConsole: 'مغادرة اللوحة',
    overview: 'نظرة عامة',
    organizations: 'المنظمات',
    communities: 'المجتمعات والطلبات',
    campaigns: 'استوديو الحملات',
    users: 'الأعضاء والسفراء',
    moderation: 'الإشراف والرقابة',
    logs: 'سجل المراجعة والتدقيق',
    settings: 'الأمان والوصول',
    platformOperational: 'المنصة تعمل بكفاءة',
    members: 'أعضاء',
    totalOrgs: 'المنظمات الشريكة',
    activeCommunities: 'المجتمعات النشطة',
    registeredMembers: 'الأعضاء والمستفيدون',
    pendingReports: 'تنبيهات قيد المعالجة',
    searchPlaceholder: 'البحث بالاسم، البلد، المسؤول...',
    allFilter: 'كافة الحالات',
    pendingFilter: 'قيد الاعتماد والمراجعة',
    approvedFilter: 'معتمدة ونشطة',
    suspendedFilter: 'معلقة / مرفوضة',
    addOrgBtn: 'إضافة منظمة جديدة',
    validateOrg: 'اعتماد الحساب',
    manageDetails: 'معاينة وتدقيق',
    country: 'البلد',
    responsible: 'المسؤول المرجعي',
    status: 'الحالة',
    actions: 'الإجراءات',
    noResults: 'لم يتم العثور على أي نتائج مطابقة.',
    saveChanges: 'حفظ الإعدادات',
    adminCredentials: 'بيانات اعتماد المشرف العام',
    adminEmail: 'البريد الإلكتروني للمسؤول',
    adminPassword: 'كلمة المرور الآمنة',
    auditTitle: 'تتبع العمليات الحساسة وسجل الشفافية',
    changeLanguage: 'لغة لوحة التحكم',
    attentionBannerTitle: 'طلبات تنتظر اعتماد فريق توليزانا',
    attentionBannerDesc: (orgs, comms) => `${orgs} منظمة و ${comms} مجتمع في انتظار تدقيقك لمنح الوصول الكامل.`,
    viewPendingOrgs: 'مراجعة المنظمات',
    viewPendingComms: 'مراجعة المجتمعات',
    verifiedCount: 'معتمدة',
    activeCount: 'نشطة',
    monthlyGrowth: '+18% هذا الشهر',
    postsCount: 'المنشورات',
    postsDesc: 'تفاعلات تضامنية',
    campaignsDesc: 'مبادرات جماعية',
    toHandle: 'قيد المعالجة',
    tabs: {
      overview: 'نظرة عامة',
      organizations: 'المنظمات',
      communities: 'المجتمعات',
      campaigns: 'الحملات',
      users: 'الأعضاء',
      moderation: 'الإشراف',
      logs: 'السجل',
      settings: 'الإعدادات',
    },
  },

  pt: {
    consoleTitle: 'Consola Central SuperAdmin',
    securityBadge: 'Acesso de Alta Segurança Tulizaana',
    viewPlatform: 'Ver Plataforma',
    exitConsole: 'Sair da Consola',
    overview: 'Visão Geral',
    organizations: 'Organizações',
    communities: 'Comunidades & Pedidos',
    campaigns: 'Estúdio de Campanhas',
    users: 'Membros & Embaixadores',
    moderation: 'Moderação & Denúncias',
    logs: 'Registo de Auditoria',
    settings: 'Segurança & Acessos',
    platformOperational: 'Plataforma operacional',
    members: 'membros',
    totalOrgs: 'Organizações Parceiras',
    activeCommunities: 'Comunidades Ativas',
    registeredMembers: 'Membros & Beneficiários',
    pendingReports: 'Alertas Pendentes',
    searchPlaceholder: 'Pesquisar por nome, país, responsável...',
    allFilter: 'Todos os estados',
    pendingFilter: 'Aguardando validação',
    approvedFilter: 'Validadas & Ativas',
    suspendedFilter: 'Suspensas / Rejeitadas',
    addOrgBtn: 'Adicionar organização',
    validateOrg: 'Validar conta',
    manageDetails: 'Consultar & Auditar',
    country: 'País',
    responsible: 'Responsável',
    status: 'Estado',
    actions: 'Ações',
    noResults: 'Nenhum registo correspondente encontrado.',
    saveChanges: 'Guardar definições',
    adminCredentials: 'Credenciais de Acesso SuperAdmin',
    adminEmail: 'Email do administrador',
    adminPassword: 'Palavra-passe segura',
    auditTitle: 'Rastreabilidade e histórico de operações sensíveis',
    changeLanguage: 'Idioma da consola',
    attentionBannerTitle: 'Pedidos a aguardar aprovação pela equipa Tulizaana',
    attentionBannerDesc: (orgs, comms) => `${orgs} organização(ões) e ${comms} comunidade(s) aguardam a sua validação para conceder acesso completo.`,
    viewPendingOrgs: 'Analisar organizações',
    viewPendingComms: 'Analisar comunidades',
    verifiedCount: 'validadas',
    activeCount: 'ativas',
    monthlyGrowth: '+18% este mês',
    postsCount: 'Publicações',
    postsDesc: 'Interações solidárias',
    campaignsDesc: 'Ações coletivas',
    toHandle: 'Pendentes',
    tabs: {
      overview: 'Visão Geral',
      organizations: 'Organizações',
      communities: 'Comunidades',
      campaigns: 'Campanhas',
      users: 'Membros',
      moderation: 'Moderação',
      logs: 'Auditoria',
      settings: 'Definições',
    },
  },

  sw: {
    consoleTitle: 'Dashibodi Kuu ya Utawala Mkuu',
    securityBadge: 'Ufikiaji Salama Zaidi Tulizaana',
    viewPlatform: 'Tazama Jukwaa',
    exitConsole: 'Toka kwenye Dashibodi',
    overview: 'Muhtasari',
    organizations: 'Mashirika',
    communities: 'Jumuiya & Maombi',
    campaigns: 'Studio ya Kampeni',
    users: 'Wanachama & Mabalozi',
    moderation: 'Udhibiti & Ripoti',
    logs: 'Kumbukumbu ya Ukaguzi',
    settings: 'Usalama & Ufikiaji',
    platformOperational: 'Jukwaa linafanya kazi vizuri',
    members: 'wanachama',
    totalOrgs: 'Mashirika Washirika',
    activeCommunities: 'Jumuiya Hai',
    registeredMembers: 'Wanachama & Wanufaika',
    pendingReports: 'Ripoti Zinazosubiri',
    searchPlaceholder: 'Tafuta kwa jina, nchi, kiongozi...',
    allFilter: 'Hali zote',
    pendingFilter: 'Inasubiri uthibitisho',
    approvedFilter: 'Imeidhinishwa & Hai',
    suspendedFilter: 'Imesimamishwa / Imekataliwa',
    addOrgBtn: 'Ongeza shirika jipya',
    validateOrg: 'Thibitisha akaunti',
    manageDetails: 'Kagua & Kagua Kisheria',
    country: 'Nchi',
    responsible: 'Msimamizi Mkuu',
    status: 'Hali',
    actions: 'Vitendo',
    noResults: 'Hakuna rekodi zilizopatikana.',
    saveChanges: 'Hifadhi mipangilio',
    adminCredentials: 'Nambari za Kuingia za Utawala',
    adminEmail: 'Barua pepe ya msimamizi',
    adminPassword: 'Nenosiri salama',
    auditTitle: 'Ufuatiliaji na kumbukumbu ya vitendo nyeti',
    changeLanguage: 'Lugha ya dashibodi',
    attentionBannerTitle: 'Maombi yanayosubiri idhini ya timu ya Tulizaana',
    attentionBannerDesc: (orgs, comms) => `Mashirika ${orgs} na jumuiya ${comms} zinasubiri uthibitisho wako ili kupata ufikiaji kamili.`,
    viewPendingOrgs: 'Kagua mashirika',
    viewPendingComms: 'Kagua jumuiya',
    verifiedCount: 'zimethibitishwa',
    activeCount: 'hai',
    monthlyGrowth: '+18% mwezi huu',
    postsCount: 'Machapisho',
    postsDesc: 'Mawasiliano ya mshikamano',
    campaignsDesc: 'Vitendo vya pamoja',
    toHandle: 'Kushughulikia',
    tabs: {
      overview: 'Muhtasari',
      organizations: 'Mashirika',
      communities: 'Jumuiya',
      campaigns: 'Kampeni',
      users: 'Wanachama',
      moderation: 'Udhibiti',
      logs: 'Ukaguzi',
      settings: 'Mipangilio',
    },
  },
};
