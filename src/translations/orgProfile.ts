import { Language } from '../types';

export interface OrgProfileStrings {
  ourVision: string;
  ourMission: string;
  ourValues: string;
  defaultVision: string;
  defaultMission: string;
  defaultValues: string[];
  interventionDomains: string;
  activeDomainsCount: string;
  legalDocumentsTitle: string;
  tulizaanaVerified: string;
  legalDocumentsDesc: string;
  manageDocuments: string;
  noLegalDocuments: string;
  noLegalDocsSub: string;
  uploadLegalDocs: string;
  existenceProofValidated: string;
  downloadCopy: string;
  teamTitle: string;
  teamDesc: string;
  activeReferentsCount: string;
  availableForExchange: string;
  activeOnCommunity: string;
  contactMember: string;
  communitiesRunBy: string;
  communitiesRunDesc: string;
  manageCommunities: string;
  noActiveCommunities: string;
  noActiveCommunitiesDesc: string;
  membersCount: string;
  discover: string;
  editPresentation: string;
  createCommunity: string;
  changeLanguage: string;
  editModalTitle: string;
  editModalDesc: string;
  locationInAfrica: string;
  countryLabel: string;
  cityLabel: string;
  descLabel: string;
  visionLabel: string;
  missionLabel: string;
  domainsLabel: string;
  addOtherDomain: string;
  addBtn: string;
  legalDocsSection: string;
  docTypeSelect: string;
  addScannedDoc: string;
  uploadDocBtn: string;
  dragDropHint: string;
  cancelBtn: string;
  saveAllBtn: string;
  docTypes: {
    agrement_ministeriel: string;
    f92_rccm: string;
    statuts_notaries: string;
    attestation_siege: string;
    autre: string;
  };
  orgTypes: {
    ong: string;
    association: string;
    fondation: string;
    centre_sante: string;
    cooperative: string;
    collectif: string;
    autre: string;
  };
}

export const orgProfileTranslations: Record<Language, OrgProfileStrings> = {
  fr: {
    ourVision: 'Notre Vision',
    ourMission: 'Notre Mission',
    ourValues: 'Nos Valeurs',
    defaultVision: 'Bâtir une communauté d’entraide fraternelle où la vulnérabilité médicale ou émotionnelle est transformée en puissance collective.',
    defaultMission: 'Offrir des espaces d’écoute confidentiels, animer des parcours d’action mesurables et déstigmatiser les épreuves humaines.',
    defaultValues: ['Bienveillance', 'Confidentialité', 'Dignité', 'Résilience'],
    interventionDomains: "Domaines d'Intervention",
    activeDomainsCount: 'domaine(s) actif(s)',
    legalDocumentsTitle: 'Documents Légaux & Preuves d’Existence en Afrique',
    tulizaanaVerified: 'Vérifié Tulizaana',
    legalDocumentsDesc: 'Preuves de légalité, agréments ministériels et statuts officiels certifiant l’existence juridique en Afrique.',
    manageDocuments: 'Gérer les documents',
    noLegalDocuments: 'Aucun document légal déposé pour le moment',
    noLegalDocsSub: 'Les pièces officielles (Arrêté ministériel, Statuts notariés, RCCM/F92) permettent de certifier l’organisation auprès des bénéficiaires.',
    uploadLegalDocs: 'Téléverser les documents légaux',
    existenceProofValidated: 'Preuve d’existence validée',
    downloadCopy: 'Télécharger la pièce légale',
    teamTitle: 'Équipe disponible sur Tulizaana',
    teamDesc: "Référents médicaux, psychologues et coordinateurs dédiés à l'animation et au gardiennage des cercles.",
    activeReferentsCount: 'référents actifs',
    availableForExchange: '🟢 Disponible pour échange',
    activeOnCommunity: '🔵 Actif sur la communauté',
    contactMember: 'Contacter',
    communitiesRunBy: 'Communautés animées par',
    communitiesRunDesc: 'Espaces fermés, anonymisés et sécurisés animés sous la responsabilité de cette organisation.',
    manageCommunities: 'Gérer les communautés',
    noActiveCommunities: 'Aucune communauté active pour le moment',
    noActiveCommunitiesDesc: "L'organisation prépare l'ouverture de ses prochains cercles d'entraide.",
    membersCount: 'membres',
    discover: 'Découvrir',
    editPresentation: 'Modifier la présentation',
    createCommunity: 'Créer une communauté',
    changeLanguage: 'Changer de langue',
    editModalTitle: 'Modifier le profil et la présentation',
    editModalDesc: "Mettez à jour la localisation, les axes stratégiques et les preuves d'existence légale.",
    locationInAfrica: 'Localisation en Afrique',
    countryLabel: "Pays d'implantation",
    cityLabel: 'Ville du siège / base',
    descLabel: 'Présentation & Description',
    visionLabel: 'Vision',
    missionLabel: 'Mission',
    domainsLabel: "Domaines d'intervention",
    addOtherDomain: 'Ajouter un autre domaine...',
    addBtn: 'Ajouter',
    legalDocsSection: "Documents Légaux (Preuves d'existence en Afrique)",
    docTypeSelect: 'Type de document',
    addScannedDoc: 'Ajouter un document scanné',
    uploadDocBtn: 'Téléverser un document',
    dragDropHint: 'Glissez-déposez ici les arrêtés, statuts ou récépissés scannés (PDF, PNG, JPG)',
    cancelBtn: 'Annuler',
    saveAllBtn: 'Enregistrer toutes les modifications',
    docTypes: {
      agrement_ministeriel: 'Agrément Ministériel Officiel',
      f92_rccm: 'Certificat F92 / RCCM / Déclaration',
      statuts_notaries: 'Statuts Notariés Enregistrés',
      attestation_siege: 'Attestation de Siège & Localisation',
      autre: 'Preuve Légale Complémentaire',
    },
    orgTypes: {
      ong: 'ONG Humanitaire',
      association: 'Association Communautaire',
      fondation: 'Fondation Reconnue',
      centre_sante: 'Centre de Santé & Écoute',
      cooperative: 'Coopérative de Résilience',
      collectif: 'Collectif de Pairs-Aidants',
      autre: 'Organisation Partenaire',
    },
  },

  en: {
    ourVision: 'Our Vision',
    ourMission: 'Our Mission',
    ourValues: 'Our Values',
    defaultVision: 'Building a compassionate mutual-aid community where medical or emotional vulnerability is transformed into collective strength.',
    defaultMission: 'Provide confidential listening spaces, lead measurable action pathways, and destigmatize human struggles.',
    defaultValues: ['Compassion', 'Confidentiality', 'Dignity', 'Resilience'],
    interventionDomains: 'Intervention Domains',
    activeDomainsCount: 'active domain(s)',
    legalDocumentsTitle: 'Legal Documents & Proof of Existence in Africa',
    tulizaanaVerified: 'Tulizaana Verified',
    legalDocumentsDesc: 'Proof of legality, ministerial accreditations, and official bylaws certifying legal existence in Africa.',
    manageDocuments: 'Manage documents',
    noLegalDocuments: 'No legal documents uploaded yet',
    noLegalDocsSub: 'Official documents (Ministerial decree, Notarized bylaws, RCCM/F92) authenticate the organization to beneficiaries.',
    uploadLegalDocs: 'Upload legal documents',
    existenceProofValidated: 'Proof of existence validated',
    downloadCopy: 'Download legal document',
    teamTitle: 'Team available on Tulizaana',
    teamDesc: 'Medical referents, psychologists, and coordinators dedicated to facilitating and safeguarding circles.',
    activeReferentsCount: 'active referents',
    availableForExchange: '🟢 Available for support',
    activeOnCommunity: '🔵 Active in community',
    contactMember: 'Contact',
    communitiesRunBy: 'Communities hosted by',
    communitiesRunDesc: 'Closed, anonymized, and safe spaces hosted under the responsibility of this organization.',
    manageCommunities: 'Manage communities',
    noActiveCommunities: 'No active communities at the moment',
    noActiveCommunitiesDesc: 'The organization is preparing to launch its next solidarity circles.',
    membersCount: 'members',
    discover: 'Explore',
    editPresentation: 'Edit presentation',
    createCommunity: 'Create a community',
    changeLanguage: 'Change language',
    editModalTitle: 'Edit profile and presentation',
    editModalDesc: 'Update location, strategic focus, and proof of legal existence.',
    locationInAfrica: 'Location in Africa',
    countryLabel: 'Country of operation',
    cityLabel: 'Headquarters / base city',
    descLabel: 'Overview & Description',
    visionLabel: 'Vision',
    missionLabel: 'Mission',
    domainsLabel: 'Intervention domains',
    addOtherDomain: 'Add another domain...',
    addBtn: 'Add',
    legalDocsSection: 'Legal Documents (Proof of existence in Africa)',
    docTypeSelect: 'Document type',
    addScannedDoc: 'Add a scanned document',
    uploadDocBtn: 'Upload document',
    dragDropHint: 'Drag and drop scanned decrees, bylaws or certificates here (PDF, PNG, JPG)',
    cancelBtn: 'Cancel',
    saveAllBtn: 'Save all changes',
    docTypes: {
      agrement_ministeriel: 'Official Ministerial Accreditation',
      f92_rccm: 'F92 / RCCM / Legal Declaration',
      statuts_notaries: 'Registered Notarized Bylaws',
      attestation_siege: 'Headquarters & Location Certificate',
      autre: 'Additional Legal Proof',
    },
    orgTypes: {
      ong: 'Humanitarian NGO',
      association: 'Community Association',
      fondation: 'Recognized Foundation',
      centre_sante: 'Health & Listening Center',
      cooperative: 'Resilience Cooperative',
      collectif: 'Peer-Support Collective',
      autre: 'Partner Organization',
    },
  },

  ar: {
    ourVision: 'رؤيتنا',
    ourMission: 'رسالتنا',
    ourValues: 'قيمنا',
    defaultVision: 'بناء مجتمع تضامني وأخوي تتحول فيه الهشاشة الصحية والنفسية إلى قوة جماعية ملهمة.',
    defaultMission: 'توفير مساحات استماع سرية، وقيادة مسارات عمل قابلة للقياس، وإزالة الوصمة عن الابتلاءات الإنسانية.',
    defaultValues: ['التعاطف والإحسان', 'السرية التامة', 'الكرامة الإنسانية', 'الصمود المجتمعي'],
    interventionDomains: 'مجالات التدخل والعمل',
    activeDomainsCount: 'مجال(ات) نشط(ة)',
    legalDocumentsTitle: 'الوثائق القانونية وإثباتات الوجود في إفريقيا',
    tulizaanaVerified: 'موثق من توليزانا',
    legalDocumentsDesc: 'إثباتات المشروعية القانونية، التراخيص الوزارية والنظم الأساسية الرسمية المعتمدة في إفريقيا.',
    manageDocuments: 'إدارة الوثائق',
    noLegalDocuments: 'لم يتم إيداع أي وثيقة قانونية حتى الآن',
    noLegalDocsSub: 'تساعد الوثائق الرسمية (المرسوم الوزاري، النظم الأساسية الموثقة، السجل التجاري) في توثيق المنظمة للمستفيدين.',
    uploadLegalDocs: 'رفع الوثائق القانونية',
    existenceProofValidated: 'تم التحقق من الوجود القانوني',
    downloadCopy: 'تحميل الوثيقة الرسمية',
    teamTitle: 'الفريق المتاح على توليزانا',
    teamDesc: 'أطباء مرجعيون، أخصائيون نفسيون ومنسقون مكرسون لتسيير وحماية الدوائر.',
    activeReferentsCount: 'مشرفين نشطين',
    availableForExchange: '🟢 متاح للمساندة والتواصل',
    activeOnCommunity: '🔵 متفاعل في المجتمع',
    contactMember: 'مراسلة',
    communitiesRunBy: 'مجتمعات تديرها',
    communitiesRunDesc: 'مساحات مغلقة وآمنة ومجهولة الهوية تخضع لمسؤولية وإشراف هذه المنظمة.',
    manageCommunities: 'إدارة المجتمعات',
    noActiveCommunities: 'لا توجد مجتمعات نشطة حالياً',
    noActiveCommunitiesDesc: 'تستعد المنظمة لإطلاق دوائر الدعم والتضامن القادمة.',
    membersCount: 'عضو',
    discover: 'استكشاف',
    editPresentation: 'تعديل النبذة والتعريف',
    createCommunity: 'إنشاء مجتمع جديد',
    changeLanguage: 'تغيير اللغة',
    editModalTitle: 'تعديل الملف والتعريف بالمنظمة',
    editModalDesc: 'تحديث بيانات الموقع الجغرافي، الأولويات الاستراتيجية وإثباتات الوجود القانوني.',
    locationInAfrica: 'الموقع في إفريقيا',
    countryLabel: 'بلد النشاط والعمل',
    cityLabel: 'مدينة المقر الرئيسي / المركز',
    descLabel: 'النبذة والتعريف بالمنظمة',
    visionLabel: 'الرؤية',
    missionLabel: 'الرسالة',
    domainsLabel: 'مجالات التدخل',
    addOtherDomain: 'إضافة مجال آخر...',
    addBtn: 'إضافة',
    legalDocsSection: 'الوثائق القانونية (إثبات الوجود في إفريقيا)',
    docTypeSelect: 'نوع الوثيقة',
    addScannedDoc: 'إرفاق وثيقة ممسوحة ضوئياً',
    uploadDocBtn: 'رفع الوثيقة',
    dragDropHint: 'اسحب وأفلت هنا المراسيم أو النظم الممسوحة ضوئياً (PDF, PNG, JPG)',
    cancelBtn: 'إلغاء',
    saveAllBtn: 'حفظ كافة التعديلات',
    docTypes: {
      agrement_ministeriel: 'اعتماد وترخيص وزاري رسمي',
      f92_rccm: 'شهادة تسجيل F92 / السجل التجاري / إشهار',
      statuts_notaries: 'نظام أساسي موثق ومسجل',
      attestation_siege: 'شهادة المقر وتحديد الموقع',
      autre: 'إثبات قانوني تكميلي',
    },
    orgTypes: {
      ong: 'منظمة غير حكومية إنسانية',
      association: 'جمعية مجتمعية',
      fondation: 'مؤسسة خيرية معتمدة',
      centre_sante: 'مركز صحي ودعم نفسي',
      cooperative: 'تعاونية صمود اجتماعي',
      collectif: 'تجمع الأقران والمرشدين',
      autre: 'منظمة شريكة',
    },
  },

  pt: {
    ourVision: 'Nossa Visão',
    ourMission: 'Nossa Missão',
    ourValues: 'Nossos Valores',
    defaultVision: 'Construir uma comunidade de entreajuda fraterna onde a vulnerabilidade médica ou emocional é transformada em força coletiva.',
    defaultMission: 'Oferecer espaços de escuta confidenciais, liderar percursos de ação mensuráveis e combater o estigma das provações humanas.',
    defaultValues: ['Benevolência', 'Confidencialidade', 'Dignidade', 'Resiliência'],
    interventionDomains: 'Áreas de Atuação',
    activeDomainsCount: 'área(s) ativa(s)',
    legalDocumentsTitle: 'Documentos Legais & Comprovações de Existência em África',
    tulizaanaVerified: 'Verificado Tulizaana',
    legalDocumentsDesc: 'Comprovações de legalidade, autorizações ministeriais e estatutos oficiais que certificam a existência jurídica em África.',
    manageDocuments: 'Gerir documentos',
    noLegalDocuments: 'Nenhum documento legal submetido no momento',
    noLegalDocsSub: 'Os documentos oficiais (Decreto ministerial, Estatutos notariais, RCCM/F92) permitem certificar a organização perante os beneficiários.',
    uploadLegalDocs: 'Carregar documentos legais',
    existenceProofValidated: 'Comprovação de existência validada',
    downloadCopy: 'Descarregar documento legal',
    teamTitle: 'Equipa disponível na Tulizaana',
    teamDesc: 'Referentes médicos, psicólogos e coordenadores dedicados à dinamização e proteção dos círculos.',
    activeReferentsCount: 'referentes ativos',
    availableForExchange: '🟢 Disponível para contacto',
    activeOnCommunity: '🔵 Ativo na comunidade',
    contactMember: 'Contactar',
    communitiesRunBy: 'Comunidades dinamizadas por',
    communitiesRunDesc: 'Espaços fechados, anónimos e seguros sob a responsabilidade desta organização.',
    manageCommunities: 'Gerir comunidades',
    noActiveCommunities: 'Nenhuma comunidade ativa no momento',
    noActiveCommunitiesDesc: 'A organização prepara a abertura dos seus próximos círculos de apoio.',
    membersCount: 'membros',
    discover: 'Descobrir',
    editPresentation: 'Editar apresentação',
    createCommunity: 'Criar uma comunidade',
    changeLanguage: 'Mudar idioma',
    editModalTitle: 'Editar perfil e apresentação',
    editModalDesc: 'Atualize a localização, os eixos estratégicos e as comprovações de existência jurídica.',
    locationInAfrica: 'Localização em África',
    countryLabel: 'País de atuação',
    cityLabel: 'Cidade da sede / base',
    descLabel: 'Apresentação & Descrição',
    visionLabel: 'Visão',
    missionLabel: 'Missão',
    domainsLabel: 'Áreas de intervenção',
    addOtherDomain: 'Adicionar outra área...',
    addBtn: 'Adicionar',
    legalDocsSection: 'Documentos Legais (Comprovações em África)',
    docTypeSelect: 'Tipo de documento',
    addScannedDoc: 'Adicionar documento digitalizado',
    uploadDocBtn: 'Carregar documento',
    dragDropHint: 'Arraste e solte aqui decretos, estatutos ou certidões (PDF, PNG, JPG)',
    cancelBtn: 'Cancelar',
    saveAllBtn: 'Guardar todas as alterações',
    docTypes: {
      agrement_ministeriel: 'Autorização Ministerial Oficial',
      f92_rccm: 'Certidão F92 / Registo Comercial / NIF',
      statuts_notaries: 'Estatutos Notariais Registados',
      attestation_siege: 'Atestado de Sede & Localização',
      autre: 'Comprovação Legal Complementar',
    },
    orgTypes: {
      ong: 'ONG Humanitária',
      association: 'Associação Comunitária',
      fondation: 'Fundação Reconhecida',
      centre_sante: 'Centro de Saúde & Apoio',
      cooperative: 'Cooperativa de Resiliência',
      collectif: 'Coletivo de Pares',
      autre: 'Organização Parceira',
    },
  },

  sw: {
    ourVision: 'Maono Yetu',
    ourMission: 'Dhamira Yetu',
    ourValues: 'Maadili Yetu',
    defaultVision: 'Kujenga jumuiya ya kusaidiana kwa udugu ambapo udhaifu wa kiafya au kihisia unabadilishwa kuwa nguvu ya pamoja.',
    defaultMission: 'Kutoa nafasi za siri za kusikilizana, kuongoza njia za vitendo zinazopimika, na kuondoa unyanyapaa kwa majaribu ya kibinadamu.',
    defaultValues: ['Wema & Huruma', 'Usiri Kamili', 'Heshima', 'Ujasiri'],
    interventionDomains: 'Nyanja za Kazi',
    activeDomainsCount: 'nyanja hai',
    legalDocumentsTitle: 'Nyaraka za Kisheria & Uthibitisho wa Uwepo Afrika',
    tulizaanaVerified: 'Imethibitishwa na Tulizaana',
    legalDocumentsDesc: 'Ushahidi wa kisheria, vibali vya wizara na kanuni rasmi zinazothibitisha uwepo halali barani Afrika.',
    manageDocuments: 'Simamia nyaraka',
    noLegalDocuments: 'Hakuna nyaraka za kisheria zilizowekwa bado',
    noLegalDocsSub: 'Nyaraka rasmi zinasaidia kuthibitisha shirika kwa wanachama na wafadhili.',
    uploadLegalDocs: 'Pakia nyaraka za kisheria',
    existenceProofValidated: 'Uthibitisho wa kisheria umeidhinishwa',
    downloadCopy: 'Pakua hati ya kisheria',
    teamTitle: 'Timu inayopatikana Tulizaana',
    teamDesc: 'Madaktari, wanasaikolojia na waratibu waliojitolea kuongoza na kulinda miduara.',
    activeReferentsCount: 'waratibu walio hai',
    availableForExchange: '🟢 Anapatikana kwa mazungumzo',
    activeOnCommunity: '🔵 Anashiriki kwenye jumuiya',
    contactMember: 'Wasiliana',
    communitiesRunBy: 'Jumuiya zinazoongozwa na',
    communitiesRunDesc: 'Nafasi za faragha, salama na zilizolindwa chini ya usimamizi wa shirika hili.',
    manageCommunities: 'Simamia jumuiya',
    noActiveCommunities: 'Hakuna jumuiya inayofanya kazi kwa sasa',
    noActiveCommunitiesDesc: 'Shirika linajiandaa kufungua miduara mipya ya msaada.',
    membersCount: 'wanachama',
    discover: 'Gundua',
    editPresentation: 'Badilisha wasifu',
    createCommunity: 'Tengeneza jamii',
    changeLanguage: 'Badilisha lugha',
    editModalTitle: 'Hariri wasifu na maelezo',
    editModalDesc: 'Sasisha eneo, malengo makuu na ushahidi wa uwepo wa kisheria.',
    locationInAfrica: 'Eneo barani Afrika',
    countryLabel: 'Nchi ya uendeshaji',
    cityLabel: 'Jiji la makao makuu',
    descLabel: 'Maelezo ya Shirika',
    visionLabel: 'Maono',
    missionLabel: 'Dhamira',
    domainsLabel: 'Nyanja za kazi',
    addOtherDomain: 'Ongeza uwanja mwingine...',
    addBtn: 'Ongeza',
    legalDocsSection: 'Nyaraka za Kisheria (Uthibitisho Afrika)',
    docTypeSelect: 'Aina ya hati',
    addScannedDoc: 'Weka hati iliyochanganuliwa',
    uploadDocBtn: 'Pakia hati',
    dragDropHint: 'Buruta na udondoshe hapa nyaraka zilizochanganuliwa (PDF, PNG, JPG)',
    cancelBtn: 'Ghairi',
    saveAllBtn: 'Hifadhi mabadiliko yote',
    docTypes: {
      agrement_ministeriel: 'Kibali Rasmi cha Wizara',
      f92_rccm: 'Cheti cha Usajili F92 / RCCM',
      statuts_notaries: 'Kanuni Rasmi za Kisheria',
      attestation_siege: 'Cheti cha Makao Makuu',
      autre: 'Uthibitisho Mwingine wa Kisheria',
    },
    orgTypes: {
      ong: 'Shirika Lisilo la Kiserikali (NGO)',
      association: 'Chama cha Kijamii',
      fondation: 'Wakfu Rasmi',
      centre_sante: 'Kituo cha Afya na Ushauri',
      cooperative: 'Ushirika wa Ujasiri',
      collectif: 'Kikundi cha Wasaidizi rika',
      autre: 'Shirika Mshirika',
    },
  },
};
