import { Language, Community, Post, StoryTestimonial, Campaign, Organization } from '../types';
import { MOCK_COMMUNITIES, MOCK_POSTS, MOCK_STORIES, MOCK_CAMPAIGNS, MOCK_ORGANIZATIONS } from './mockData';

export function getLocalizedOrganizations(lang: Language, currentOrgs: Organization[] = MOCK_ORGANIZATIONS): Organization[] {
  if (lang === 'fr') return currentOrgs;

  const orgTranslations: Record<string, Record<Language, Partial<Organization>>> = {
    'org-panzi': {
      en: {
        domain: 'Survivors of Violence & Holistic Trauma Care',
        description: 'Comprehensive medical, psychological care, and social reintegration for survivors of gender-based violence and trauma.',
        vision: 'An Africa where human dignity is inalienable and every wounded person regains vitality, peace, and autonomy.',
        mission: 'Provide holistic care (medical, psychosocial, legal, economic) to survivors and create safe, empathetic community circles.',
        interventionDomains: [
          'Psychosocial support & trauma healing',
          'Support groups & resilience circles',
          'Specialized medical care',
          'Socio-economic reintegration',
          'Human rights advocacy',
        ],
      },
      ar: {
        domain: 'الناجيات من العنف والرعاية الشاملة للصدمات',
        description: 'رعاية طبية ونفسية شاملة وإعادة إدماج اجتماعي للناجيات من العنف القائم على النوع الاجتماعي والصدمات.',
        vision: 'إفريقيا تصان فيها الكرامة الإنسانية ويستعيد كل شخص عانى من الألم قوته وسكينته واستقلاليته الكاملة.',
        mission: 'توفير رعاية متكاملة (طبية، نفسية، قانونية، واقتصادية) وبناء مساحات مجتمعية آمنة ومفعمة بالتعاطف.',
        interventionDomains: [
          'الدعم النفسي والاجتماعي وعلاج الصدمات',
          'مجموعات الدعم ودوائر الصمود',
          'الرعاية الطبية المتخصصة',
          'إعادة الإدماج الاجتماعي والاقتصادي',
          'الدفاع عن حقوق الإنسان',
        ],
      },
      pt: {
        domain: 'Sobreviventes de Violência & Apoio ao Trauma Holístico',
        description: 'Acompanhamento médico, psicológico e reintegração social para sobreviventes de violência de género e traumas.',
        vision: 'Uma África onde a dignidade humana é inviolável e cada pessoa ferida recupera a sua serenidade e autonomia.',
        mission: 'Prestar cuidados holísticos e criar círculos comunitários seguros e solidários.',
        interventionDomains: [
          'Acompanhamento psicossocial & trauma',
          'Grupos de apoio & círculos de resiliência',
          'Cuidados médicos especializados',
          'Reintegração socioeconómica',
          'Defesa dos direitos humanos',
        ],
      },
      sw: {
        domain: 'Waathirika wa Ukatili & Malezi Kamili ya Kiwewe',
        description: 'Msaada wa matibabu, kisaikolojia na urejeshaji wa kijamii kwa waathirika wa ukatili na kiwewe.',
        vision: 'Afrika ambapo utu wa binadamu haupotei na kila mtu aliyepitia maumivu anapata amani na uwezo wake.',
        mission: 'Kutoa huduma kamili na kuunda miduara salama ya kijamii ya kusaidiana.',
        interventionDomains: [
          'Msaada wa kisaikolojia & uponyaji wa kiwewe',
          'Vikundi vya mazungumzo & miduara ya ujasiri',
          'Huduma za matibabu maalum',
          'Ujumuishaji wa kijamii na kiuchumi',
        ],
      },
      fr: {},
    },
    'org-ald': {
      en: {
        domain: 'Sickle Cell Anemia & Chronic Pediatric Conditions',
        description: 'Fighting sickle cell disease through mutual support, home crisis prevention, and medication adherence in Central Africa.',
        vision: 'A world where no child or family faces sickle cell pain alone and without hope.',
        mission: 'Support sickle cell warriors, train peer mentors, and raise public awareness.',
        interventionDomains: [
          'Pain crisis prevention & hydration monitoring',
          'Caregiver peer-support circles',
          'Free access to basic medication & checkups',
        ],
      },
      ar: {
        domain: 'فقر الدم المنجلي والأمراض المزمنة لدى الأطفال',
        description: 'مكافحة فقر الدم المنجلي عبر التضامن، والوقاية من أزمات الألم، والالتزام بالعلاج في وسط إفريقيا.',
        vision: 'عالم لا يعاني فيه أي طفل أو أسرة من ألم فقر الدم المنجلي بمفردهم.',
        mission: 'مساندة محاربي فقر الدم المنجلي، وتدريب المرشدين الأقران، والتوعية المجتمعية.',
        interventionDomains: [
          'الوقاية من نوبات الألم ومتابعة شرب الماء',
          'دوائر دعم الأسر ومقدمي الرعاية',
          'تسهيل الحصول على الأدوية والمتابعة الطبية',
        ],
      },
      pt: {
        domain: 'Anemia Falciforme & Doenças Crónicas Pediátricas',
        description: 'Luta contra a anemia falciforme através do apoio mútuo, prevenção de crises e adesão ao tratamento.',
        vision: 'Um mundo onde nenhuma família enfrente a dor da anemia falciforme no isolamento.',
        mission: 'Apoiar pacientes falciformes, capacitar mentores e sensibilizar as comunidades.',
        interventionDomains: [
          'Prevenção de crises de dor & hidratação',
          'Círculos de apoio para cuidadores',
          'Acesso a medicamentos básicos',
        ],
      },
      sw: {
        domain: 'Ugonjwa wa Seli Mundu & Magonjwa Sugu ya Watoto',
        description: 'Kupambana na ugonjwa wa seli mundu kupitia mshikamano, kuzuia maumivu makali na kufuata matibabu.',
        vision: 'Dunia ambapo hakuna mtoto au familia inayoteseka na maumivu ya seli mundu peke yake.',
        mission: 'Kusaidia wapiganaji wa seli mundu na kuelimisha jamii.',
        interventionDomains: [
          'Kuzuia maumivu & ufuatiliaji wa unywaji maji',
          'Miduara ya usaidizi kwa wazazi na walezi',
        ],
      },
      fr: {},
    },
    'org-sante-mentale': {
      en: {
        domain: 'Mental Health & Emotional Wellbeing',
        description: 'Psychosocial support network promoting mental health awareness, suicide prevention, and destigmatization across Africa.',
        vision: 'An Africa where mental wellbeing is recognized as vital and every person finds empathy without stigma.',
        mission: 'Provide accessible emotional support circles, psychological first aid, and community listening networks.',
        interventionDomains: [
          'Emotional distress & anxiety management',
          'Safe and confidential peer listening',
          'Community-based mental health advocacy',
        ],
      },
      ar: {
        domain: 'الصحة النفسية والرفاه العاطفي',
        description: 'شبكة دعم نفسي واجتماعي لنشر الوعي بالصحة النفسية، والحد من الوصمة المجتمعية في إفريقيا.',
        vision: 'إفريقيا يُعترف فيها بالصحة النفسية كحق أساسي ويجد فيها كل إنسان مساحة للتعاطف دون خوف من الوصمة.',
        mission: 'توفير دوائر استماع آمنة ومجانية، وإسعافات نفسية أولية، وشبكات إرشاد مجتمعية.',
        interventionDomains: [
          'تهدئة القلق والضغوط النفسية',
          'الاستماع السري والآمن بين الأقران',
          'التوعية المجتمعية بالصحة النفسية',
        ],
      },
      pt: {
        domain: 'Saúde Mental & Bem-estar Emocional',
        description: 'Rede de apoio psicossocial para promover a saúde mental, prevenção do sofrimento psíquico e desmistificação.',
        vision: 'Uma África onde o bem-estar mental é valorizado e cada pessoa encontra escuta compassiva.',
        mission: 'Criar círculos de escuta empática acessíveis e primeiros socorros psicológicos.',
        interventionDomains: [
          'Apoio à ansiedade e esgotamento',
          'Escuta mútua confidencial',
          'Sensibilização comunitária',
        ],
      },
      sw: {
        domain: 'Afya ya Akili & Ustawi wa Kihisia',
        description: 'Mtandao wa usaidizi wa kisaikolojia wa kuongeza uelewa wa afya ya akili na kuondoa unyanyapaa.',
        vision: 'Afrika ambapo afya ya akili inaheshimiwa na kila mtu anapata faraja bila kubaguliwa.',
        mission: 'Kutoa miduara ya faragha ya kusikilizana na msaada wa kwanza wa kisaikolojia.',
        interventionDomains: [
          'Kutuliza wasiwasi na msongo wa mawazo',
          'Kusikilizana kwa siri na heshima',
          'Elimu ya afya ya akili katika jamii',
        ],
      },
      fr: {},
    },
    'org-solidarite-vih': {
      en: {
        domain: 'HIV & Positive Living Solidarity',
        description: 'Network dedicated to dignified living, treatment adherence, and holistic solidarity for people living with HIV.',
        vision: 'A world of zero discrimination where people living with HIV thrive with vitality and community support.',
        mission: 'Foster daily peer encouragement, adherence monitoring, and combat social marginalization.',
        interventionDomains: [
          'Daily antiretroviral treatment adherence',
          'Peer counseling & stigma eradication',
          'Nutritional & psychological empowerment',
        ],
      },
      ar: {
        domain: 'التضامن والتعايش الإيجابي مع فيروس نقص المناعة',
        description: 'شبكة مكرسة لكرامة العيش والالتزام بالعلاج والتضامن الإنساني للمتعايشين مع فيروس نقص المناعة.',
        vision: 'عالم خالٍ من التمييز يعيش فيه الجميع بصحة كاملة وأمل متجدد وسط مجتمع محتضن.',
        mission: 'تعزيز التضامن اليومي، ودعم الانتظام في أخذ العلاج، ومحاربة التهميش الاجتماعي.',
        interventionDomains: [
          'الالتزام بالعلاج بمضادات الفيروسات القهقرية',
          'الإرشاد الأخوي ومكافحة الوصمة',
          'التمكين الغذائي والنفسي',
        ],
      },
      pt: {
        domain: 'Solidariedade & Viver Positivo com VIH',
        description: 'Rede dedicada à vida com dignidade, adesão aos antirretrovirais e solidariedade para pessoas com VIH.',
        vision: 'Um mundo sem discriminação onde viver com VIH signifique esperança e vitalidade.',
        mission: 'Promover a adesão ao tratamento diário e combater o estigma social.',
        interventionDomains: [
          'Adesão diária aos ARV',
          'Aconselhamento entre pares',
          'Apoio nutricional e psicossocial',
        ],
      },
      sw: {
        domain: 'Mshikamano & Kuishi kwa Matumaini na VVU',
        description: 'Mtandao wa mshikamano wa kusaidia watu wanaoishi na VVU kufuata dawa na kuishi kwa hadhi.',
        vision: 'Dunia isiyo na ubaguzi ambapo watu wanaoishi na VVU wanastawi kwa furaha na afya njema.',
        mission: 'Kuimarisha mshikamano wa kila siku na kusaidiana kumeza dawa bila kuacha.',
        interventionDomains: [
          'Ufuasi wa kila siku wa dawa za ARV',
          'Ushauri wa kirafiki na kuondoa unyanyapaa',
          'Lishe bora na nguvu ya kisaikolojia',
        ],
      },
      fr: {},
    },
  };

  return currentOrgs.map((org) => {
    const overrides = orgTranslations[org.id]?.[lang];
    if (overrides) {
      return { ...org, ...overrides };
    }
    return org;
  });
}

export function getLocalizedCommunities(lang: Language, currentComms: Community[] = MOCK_COMMUNITIES): Community[] {
  if (lang === 'fr') return currentComms;

  const commTranslations: Record<string, Record<Language, { name: string; description: string; rules?: string[] }>> = {
    'comm-drepano': {
      en: {
        name: 'Overcoming Sickle Cell',
        description: 'Confidential mutual support space for warriors, caregivers, and families facing sickle cell disease. Daily hydration tips, crisis prevention, and caring listening.',
        rules: [
          'Unconditional benevolence and respect for each member\'s personal journey.',
          'No prescription or promotion of non-validated treatments without medical approval.',
          'Confidentiality: what is shared in the circle stays strictly in the circle.',
          'Active peer listening without judgment or minimizing another person\'s pain.',
        ],
      },
      ar: {
        name: 'قهر فقر الدم المنجلي',
        description: 'مساحة سرية للتضامن والدعم المتبادل بين المحاربين ومقدمي الرعاية والأسر في مواجهة فقر الدم المنجلي. نصائح يومية لشرب الماء، والوقاية من أزمات الألم، واستماع أخوي دافئ.',
        rules: [
          'التعاطف غير المشروط والاحترام المتبادل لكل تجربة شخصية.',
          'يمنع منعاً باتاً وصف الأدوية أو الترويج لعلاجات غير معتمدة طبياً.',
          'السرية التامة: كل ما يُشارك في الدائرة يظل أمانة في الدائرة.',
          'الاستماع الإيجابي دون أحكام مسبقة أو التقليل من ألم الآخرين.',
        ],
      },
      pt: {
        name: 'Vencer a Anemia Falciforme',
        description: 'Espaço confidencial de apoio mútuo para guerreiros, cuidadores e famílias com anemia falciforme. Dicas diárias de hidratação, prevenção de crises e escuta atenta.',
        rules: [
          'Benevolência incondicional e respeito pela jornada de cada guerreiro.',
          'Proibida qualquer prescrição médica ou promoção de remédios sem aval clínico.',
          'Sigilo absoluto: o que é partilhado no círculo permanece no círculo.',
          'Escuta empática sem julgamentos ou minimização da dor alheia.',
        ],
      },
      sw: {
        name: 'Kushinda Seli Mundu',
        description: 'Nafasi ya siri ya mshikamano kwa wapiganaji, walezi na familia wanaoishi na ugonjwa wa seli mundu. Mawaidha ya kila siku ya unywaji maji, kuzuia maumivu na kusikilizana kwa upendo.',
        rules: [
          'Wema na heshima kamili kwa safari na hisia za kila mwanachama.',
          'Ni marufuku kushauri au kuuza dawa ambazo hazijaidhinishwa na daktari.',
          'Usiri mkubwa: kila kinachozungumzwa kwenye duara kinabaki hapa.',
          'Kusikilizana kwa makini bila kuhukumu au kupuuza maumivu ya mwenzako.',
        ],
      },
      fr: { name: '', description: '' },
    },
    'comm-survivantes': {
      en: {
        name: 'Survivors & Resilient Hearts',
        description: 'Protected closed circle for women on the path of psychological reconstruction, holistic resilience, and self-reclamation. Total kindness and absolute confidentiality.',
        rules: [
          'Absolute safety and confidentiality: zero tolerance for breaches of trust.',
          'Respect for personal pacing: nobody is pressured to share before they are ready.',
          'Warm sisterhood and compassionate solidarity without judgment.',
          'Constructive, restorative speech centered on healing and dignity.',
        ],
      },
      ar: {
        name: 'الناجيات والقلوب الصامدة',
        description: 'دائرة مغلقة ومحمية للنساء في مسار التعافي النفسي وإعادة بناء الذات والصمود الشامل. رعاية إنسانية دافئة وسرية مطلقة وموثوقة.',
        rules: [
          'الأمان والسرية المطلقة: لا تهاون مع أي انتهاك للثقة.',
          'احترام إيقاع كل أخت: لا أحد يُلزم بالحديث قبل أن تشعر بالاستعداد التام.',
          'أخوة نسائية دافئة وتضامن صادق دون أي أحكام مسبقة.',
          'كلمات طيبة وبناءة تركز على استعادة الكرامة والشفاء.',
        ],
      },
      pt: {
        name: 'Sobreviventes & Corações Resilientes',
        description: 'Círculo fechado e protegido para mulheres em reconstrução emocional e resiliência holística. Total carinho e absoluto sigilo.',
        rules: [
          'Segurança e sigilo absolutos: tolerância zero para quebra de confiança.',
          'Respeito ao tempo de cada pessoa: ninguém é forçada a partilhar.',
          'Sororidade acolhedora e empatia sem pré-julgamentos.',
          'Palavras construtivas focadas na cura, força e dignidade.',
        ],
      },
      sw: {
        name: 'Waathirika & Mioyo Imara',
        description: 'Mzunguko salama na wa siri kwa wanawake wanaojenga upya amani ya moyo na maisha yao kwa heshima na ujasiri. Usiri wa asilimia mia moja.',
        rules: [
          'Usalama na usiri kamili: hakuna uvumilivu kwa kuvunja siri ya mtu.',
          'Heshima kwa hatua za kila mtu: hakuna anayelazimishwa kuongea kabla hajajiandaa.',
          'Upendo wa kidada na mshikamano wa kweli bila kuhukumu.',
          'Mazungumzo ya kukuza amani, heshima na uponyaji wa moyo.',
        ],
      },
      fr: { name: '', description: '' },
    },
    'comm-mental-health': {
      en: {
        name: 'Mental Health & Peaceful Mind',
        description: 'Caring sanctuary to soothe anxiety, burnout, grief, and emotional exhaustion. Daily breathing exercises, safe sharing, and compassionate peer support.',
        rules: [
          'Safe space: zero judgment regarding mental health challenges or vulnerability.',
          'Tulizaana is a peer-support platform, not an emergency psychiatric ward.',
          'Kind and supportive language that encourages hope and self-compassion.',
          'Respect for personal boundaries: each person shares at their own pace.',
        ],
      },
      ar: {
        name: 'الصحة النفسية والسكينة',
        description: 'ملاذ دافئ لتهدئة القلق، والإنهاك النفسي، والحزن، وتفريغ الضغوط اليومية. تمارين تنفس يومية، مساحة آمنة للفضفضة، ومساندة إنسانية رحيمة.',
        rules: [
          'مساحة آمنة: لا مكان للأحكام المسبقة على المشاعر أو المعاناة النفسية.',
          'توليزانا مساحة دعم أخوي متبادل وليست بديلاً عن طوارئ الطب النفسي.',
          'لغة طيبة تبعث على الأمل وتعزز الرفق بالنفس.',
          'احترام خصوصية وحدود كل عضو في المشاركة والتعبير.',
        ],
      },
      pt: {
        name: 'Saúde Mental & Espírito Sereno',
        description: 'Refúgio acolhedor para acalmar a ansiedade, esgotamento e cansaço emocional. Exercícios de respiração, partilha segura e escuta fraterna.',
        rules: [
          'Espaço seguro: zero julgamento sobre dores emocionais ou fragilidades.',
          'A Tulizaana é apoio entre pares e não substitui emergências psiquiátricas.',
          'Linguagem positiva e acolhedora com respeito à jornada de cada um.',
          'Respeito pelos limites individuais e privacidade.',
        ],
      },
      sw: {
        name: 'Afya ya Akili & Amani ya Moyo',
        description: 'Nafasi ya amani ya kutuliza wasiwasi, msongo wa mawazo na uchovu wa kiakili. Mazoezi ya kuvuta pumzi, kufungua roho kwa usalama na kusaidiana.',
        rules: [
          'Mahali salama: hakuna kuhukumu mtu kwa sababu ya changamoto za kiakili.',
          'Tulizaana ni msaada wa kijamii wa kusaidiana, si hospitali ya dharura.',
          'Maneno ya kutia moyo, upendo na matumaini.',
          'Heshima kwa mipaka na usiri wa kila mwanachama.',
        ],
      },
      fr: { name: '', description: '' },
    },
    'comm-vih': {
      en: {
        name: 'Positive Living & Solidarity',
        description: 'Confidential community of solidarity, adherence encouragement, and hope for people living with HIV. Zero stigma, lifelong mutual companionship.',
        rules: [
          'Confidentiality is sacred: full anonymity and privacy strictly protected.',
          'Encouraging daily adherence: continuous support for taking medications faithfully.',
          'Zero discrimination or stigmatization: all members are equal warriors.',
          'Sharing uplifting experiences and accurate health information.',
        ],
      },
      ar: {
        name: 'العيش الإيجابي والتضامن',
        description: 'مجتمع سري للتضامن، والتشجيع على الانتظام في العلاج، والأمل للمتعايشين مع فيروس نقص المناعة. بدون أي وصمة، ورفقة إنسانية دافئة مدى الحياة.',
        rules: [
          'السرية أمانة مقدسة: حماية الهوية والخصوصية مضمونة تماماً.',
          'التشجيع اليومي على أخذ العلاج دون انقطاع لحياة صحية ومديدة.',
          'لا للتمييز أو الوصمة: جميعنا إخوة وأخوات في مسيرة الأمل.',
          'مشاركة التجارب الإيجابية والمعلومات الصحية الموثوقة.',
        ],
      },
      pt: {
        name: 'Viver Positivo & Solidários',
        description: 'Comunidade confidencial de solidariedade, adesão ao tratamento e esperança para pessoas com VIH. Zero estigma, apoio diário mútuo.',
        rules: [
          'O sigilo é sagrado: proteção rigorosa da identidade e privacidade.',
          'Incentivo à adesão diária aos ARV para uma vida plena e saudável.',
          'Zero estigma ou discriminação: somos todos guerreiros iguais.',
          'Partilha de relatos positivos e dicas saudáveis.',
        ],
      },
      sw: {
        name: 'Kuishi na Matumaini & Mshikamano',
        description: 'Jumuiya ya siri ya mshikamano, kusaidiana kumeza dawa na kujenga matumaini kwa wanaoishi na VVU. Hakuna unyanyapaa, tuko pamoja daima.',
        rules: [
          'Usiri ni jambo takatifu: usalama wa utambulisho wako unalindwa kabisa.',
          'Kuhimizana kumeza dawa kwa wakati kila siku kwa maisha marefu na yenye furaha.',
          'Hakuna unyanyapaa au ubaguzi: wote ni ndugu na mashujaa.',
          'Kushiriki hadithi za kutia moyo na taarifa sahihi za afya.',
        ],
      },
      fr: { name: '', description: '' },
    },
  };

  return currentComms.map((comm) => {
    const override = commTranslations[comm.id]?.[lang];
    if (override && override.name) {
      return {
        ...comm,
        name: override.name,
        description: override.description,
        rules: override.rules || comm.rules,
      };
    }
    return comm;
  });
}

export function getLocalizedStories(lang: Language, currentStories: StoryTestimonial[] = MOCK_STORIES): StoryTestimonial[] {
  if (lang === 'fr') return currentStories;

  const storyTrans: Record<string, Record<Language, { caption: string; title?: string }>> = {
    'story-johan-1': {
      en: { caption: '100 days without a crisis thanks to daily hydration and our mutual support circle! We are stronger together.' },
      ar: { caption: '١٠٠ يوم دون أي نوبة ألم بفضل شرب الماء بانتظام ودعم دائرتنا الوفية! معاً نحن أقوى دائماً.' },
      pt: { caption: '100 dias sem crises graças à hidratação diária e ao apoio do nosso círculo! Juntos somos mais fortes.' },
      sw: { caption: 'Siku 100 bila maumivu ya seli mundu kwa kunywa maji kila siku na ushirikiano wa duara letu! Pamoja tunaweza.' },
      fr: { caption: '' },
    },
    'story-johan-2': {
      en: { caption: 'Balancing university studies and medical checkups: never give up on your dreams, warrior!' },
      ar: { caption: 'التوفيق بين الدراسة الجامعية والمتابعة الطبية: لا تتخلّ أبداً عن أحلامك يا بطل!' },
      pt: { caption: 'Conciliar a faculdade e os exames: nunca desistas dos teus sonhos, guerreiro!' },
      sw: { caption: 'Kusoma chuo kikuu na kufuatilia matibabu: usikate tamaa kamwe, pambana shujaa!' },
      fr: { caption: '' },
    },
    'story-johan-3': {
      en: { caption: 'Morning tea routine: ginger, honey, and quiet breathing before tackling the day.' },
      ar: { caption: 'طقس الصباح: شاي الزنجبيل مع العسل وتنفس هادئ قبل انطلاق اليوم.' },
      pt: { caption: 'Rotina matinal: chá de gengibre, mel e respiração serena antes de começar o dia.' },
      sw: { caption: 'Chai ya asubuhi: tangawizi, asali na utulivu kabla ya kuanza siku.' },
      fr: { caption: '' },
    },
    'story-amina-1': {
      en: { caption: 'Finding this circle gave me back the freedom to smile and believe in my resilience.' },
      ar: { caption: 'العثور على هذه الدائرة أعاد إليّ القدرة على الابتسام والإيمان بصمودي.' },
      pt: { caption: 'Encontrar este círculo devolveu-me a liberdade de sorrir e acreditar na minha força.' },
      sw: { caption: 'Kupata duara hili kumenirudishia furaha ya kutabasamu na kujiamini tena.' },
      fr: { caption: '' },
    },
    'story-amina-2': {
      en: { caption: 'Every listening session heals a wound. Thank you to all sisters for your radiant warmth.' },
      ar: { caption: 'كل جلسة استماع أخوي تشفي جرحاً. شكراً لكل الأخوات على هذا الدفء الصادق.' },
      pt: { caption: 'Cada sessão de escuta cura uma ferida. Obrigada a todas as irmãs pelo carinho.' },
      sw: { caption: 'Kila wakati wa kusikilizana unaponesha jeraha la moyo. Asanteni dada zangu kwa upendo.' },
      fr: { caption: '' },
    },
    'story-amina-3': {
      en: { caption: 'A fresh beginning: stepping forward with dignity, self-love, and unshakeable peace.' },
      ar: { caption: 'بداية جديدة: السير نحو المستقبل بكرامة وحب للذات وسلام لا ينكسر.' },
      pt: { caption: 'Um novo começo: caminhar em frente com dignidade, amor-próprio e paz profunda.' },
      sw: { caption: 'Mwanzo mpya: kusonga mbele kwa heshima, upendo na amani thabiti ya moyo.' },
      fr: { caption: '' },
    },
    'story-fatou-1': {
      en: { caption: 'Hydration bottle challenge: already 2.5L logged today! Let us keep the momentum going.' },
      ar: { caption: 'تحدي قنينة الماء: لتران ونصف حتى الآن! فلنواصل هذا الحماس الإيجابي سوياً.' },
      pt: { caption: 'Desafio da garrafa d’água: 2.5L hoje! Vamos continuar com este ritmo.' },
      sw: { caption: 'Changamoto ya chupa ya maji: lita 2.5 tayari leo! Tuendelee na moyo huu.' },
      fr: { caption: '' },
    },
    'story-fatou-2': {
      en: { caption: 'Family workshop on sickle cell awareness: knowledge brings safety and prevents crises.' },
      ar: { caption: 'ورشة أسرية للتوعية بفقر الدم المنجلي: المعرفة تحمي وتمنع أزمات الألم.' },
      pt: { caption: 'Oficina familiar sobre anemia falciforme: a informação protege e previne crises.' },
      sw: { caption: 'Semina ya familia kuhusu seli mundu: elimu inaleta usalama na kuzuia maumivu.' },
      fr: { caption: '' },
    },
    'story-koffi-1': {
      en: { caption: 'Breaking the silence around depression: talking openly is our first step toward inner light.' },
      ar: { caption: 'كسر حاجز الصمت حول الاكتئاب: التعبير الصادق هو خطوتنا الأولى نحو النور الداخلي.' },
      pt: { caption: 'Quebrar o silêncio da depressão: falar com o coração é o primeiro passo para a cura.' },
      sw: { caption: 'Kuvunja ukimya kuhusu msongo wa mawazo: kusema ukweli ndiyo hatua ya kwanza ya amani.' },
      fr: { caption: '' },
    },
    'story-koffi-2': {
      en: { caption: 'Living fully despite dark days: self-compassion, restful sleep, and gentle patience.' },
      ar: { caption: 'العيش بكل شغف رغم الأيام الصعبة: الرفق بالنفس، النوم الكافي، والصبر الجميل.' },
      pt: { caption: 'Viver plenamente mesmo em dias difíceis: autocompaixão, sono reparador e paciência.' },
      sw: { caption: 'Kuishi kwa furaha hata wakati wa magumu: upole wa nafsi, usingizi mnono na subira.' },
      fr: { caption: '' },
    },
    'story-dr-joseph-1': {
      en: { caption: 'Medical advice: hydration, keeping warm, and regular checkups prevent 80% of complications.' },
      ar: { caption: 'نصيحة طبية: شرب الماء الكافي، التدفئة الجيدة، والمتابعة الدورية تقي من 80% من المضاعفات.' },
      pt: { caption: 'Conselho médico: hidratação, manter o corpo aquecido e exames regulares previnem 80% dos problemas.' },
      sw: { caption: 'Ushauri wa daktari: maji mengi, mavazi ya joto na vipimo vya mara kwa mara huzuia matatizo mengi.' },
      fr: { caption: '' },
    },
    'story-vih-1': {
      en: { caption: '10 years of undetectable viral load! Undetectable = Untransmittable (U=U). Never lose faith.' },
      ar: { caption: '١٠ سنوات بحمل فيروسي غير قابل للكشف! غير قابل للكشف = غير ناقل للعدوى (U=U). لا تفقد الأمل أبداً.' },
      pt: { caption: '10 anos com carga viral indetetável! Indetetável = Intransmissível (I=I). Nunca percam a fé.' },
      sw: { caption: 'Miaka 10 bila virusi kuonekana kwenye damu! Haionekani = Haiambukizi (U=U). Dumisha matumaini daima.' },
      fr: { caption: '' },
    },
    'story-vih-2': {
      en: { caption: 'Daily medication reminder done: taking care of my health is an act of love for myself and my family.' },
      ar: { caption: 'تناولت جرعتي اليومية في موعدها: الاعتناء بصحتي تعبير عن محبتي لنفسي ولأسرتي.' },
      pt: { caption: 'Toma diária concluída: cuidar da minha saúde é um ato de amor por mim e pela minha família.' },
      sw: { caption: 'Nimekamilisha kumeza dawa leo: kutunza afya yangu ni upendo kwa nafsi yangu na familia yangu.' },
      fr: { caption: '' },
    },
  };

  return currentStories.map((story) => {
    const override = storyTrans[story.id]?.[lang];
    if (override && override.caption) {
      return { ...story, caption: override.caption };
    }
    return story;
  });
}

export function getLocalizedCampaigns(lang: Language, currentCampaigns: Campaign[] = MOCK_CAMPAIGNS): Campaign[] {
  if (lang === 'fr') return currentCampaigns;

  const campTrans: Record<string, Record<Language, { title: string; description: string; tags?: string[] }>> = {
    'camp-21-confiance': {
      en: {
        title: '21 Days to Rebuild Confidence & Inhabit Your Body',
        description: 'A structured journey of sisterhood, therapeutic writing, self-compassion, and voice capsules to restore emotional peace.',
        tags: ['#21daysConfidence', '#sisterhood', '#resilience', '#healing'],
      },
      ar: {
        title: '٢١ يوماً لاستعادة الثقة والسكينة في جسدك',
        description: 'رحلة منظمة من الأخوة والتدوين العلاجي والرفق بالذات والرسائل الصوتية لاستعادة راحة البال والسلام الداخلي.',
        tags: ['#تحدي21يوم', '#أخوة', '#صمود', '#تعافي'],
      },
      pt: {
        title: '21 Dias para Recuperar a Confiança & Habitar o Corpo',
        description: 'Uma jornada estruturada de sororidade, escrita terapêutica e autocompaixão para recuperar a serenidade.',
        tags: ['#21diasConfiança', '#sororidade', '#resiliência', '#cura'],
      },
      sw: {
        title: 'Siku 21 za Kujenga Upya Kujiamini & Amani ya Mwili',
        description: 'Safari ya pamoja ya kidada, uandishi wa kutuliza moyo na upendo wa nafsi kurudisha amani na tabasamu.',
        tags: ['#Siku21Ujasiri', '#unduguWaWanawake', '#uponyaji', '#amani'],
      },
      fr: { title: '', description: '' },
    },
    'camp-30-isolement': {
      en: {
        title: '30 Days to Break Isolation & Reconnect Socially',
        description: 'Daily gentle actions to reconnect with community, express your inner feelings, and cultivate warm, lasting friendships.',
        tags: ['#breakIsolation', '#mentalHealth', '#connection', '#empathy'],
      },
      ar: {
        title: '٣٠ يوماً لكسر العزلة وإعادة بناء الروابط الإنسانية',
        description: 'خطوات يومية بسيطة للتواصل مع المجتمع، والتعبير عن المشاعر بصدق، وبناء صداقات متينة ومفعمة بالدفء.',
        tags: ['#كسر_العزلة', '#صحة_نفسية', '#تواصل', '#تعاطف'],
      },
      pt: {
        title: '30 Dias para Quebrar o Isolamento & Refazer Laços',
        description: 'Ações diárias suaves para restabelecer o contacto comunitário, partilhar sentimentos e cultivar novas amizades.',
        tags: ['#quebrarIsolamento', '#saúdeMental', '#ligação', '#empatia'],
      },
      sw: {
        title: 'Siku 30 za Kuvunja Upweke & Kujenga Uhusiano',
        description: 'Hatua za upole za kila siku za kurudisha uhusiano na jamii, kutoa hisia za moyo na kupata marafiki wa kweli.',
        tags: ['#OndoaUpweke', '#AfyaYaAkili', '#Uhusiano', '#Upendo'],
      },
      fr: { title: '', description: '' },
    },
    'camp-7-drepano': {
      en: {
        title: '7-Day Hydration Rituals & Sickle Cell Crisis Prevention',
        description: 'The Water Bottle Alliance: collective daily tracking of 2.5L hydration, warmth tips, and mutual encouragement to keep crises away.',
        tags: ['#hydrationChallenge', '#sickleCell', '#waterRitual', '#zeroCrisis'],
      },
      ar: {
        title: '٧ أيام لشرب الماء والوقاية التضامنية من أزمات فقر الدم المنجلي',
        description: 'تحالف قوارير الماء: متابعة جماعية لشرب لترين ونصف يومياً، نصائح التدفئة، وتشجيع أخوي لحياة خالية من نوبات الألم.',
        tags: ['#تحدي_الماء', '#فقر_الدم_المنجلي', '#وقاية_الألم', '#صحة'],
      },
      pt: {
        title: '7 Dias de Rituais de Hidratação & Prevenção de Crises',
        description: 'A Aliança das Garrafas: acompanhamento diário coletivo de 2.5L de água, dicas de conforto térmico e apoio mútuo.',
        tags: ['#desafioHidratação', '#anemiaFalciforme', '#prevenção', '#saúde'],
      },
      sw: {
        title: 'Siku 7 za Unywaji Maji & Kuzuia Maumivu ya Seli Mundu',
        description: 'Muungano wa Chupa za Maji: ufuatiliaji wa pamoja wa lita 2.5 za maji kila siku, mavazi ya joto na kutiana moyo.',
        tags: ['#MajiKwaAfya', '#SeliMundu', '#KingaYaMaumivu', '#Umoja'],
      },
      fr: { title: '', description: '' },
    },
    'camp-vih-arv': {
      en: {
        title: '14 Days of Serene Adherence & Positive Destigmatization',
        description: 'Establishing a fixed-schedule medication habit, sharing daily victories, and celebrating undetectable viral load (U=U).',
        tags: ['#sereneAdherence', '#UequalsU', '#positiveLiving', '#solidarity'],
      },
      ar: {
        title: '١٤ يوماً من الالتزام الهادئ بالعلاج ونزع الوصمة الإيجابي',
        description: 'ترسيخ موعد يومي ثابت لتناول العلاج، ومشاركة الانتصارات الصغيرة، والاحتفال بحمل فيروسي غير قابل للكشف (U=U).',
        tags: ['#التزام_العلاج', '#العيش_الإيجابي', '#U_يساوي_U', '#تضامن'],
      },
      pt: {
        title: '14 Dias de Adesão Serena & Desmistificação Positiva',
        description: 'Consolidar um horário fixo de medicação, partilhar sucessos diários e celebrar a carga viral indetetável (I=I).',
        tags: ['#adesãoSerena', '#IigualI', '#viverPositivo', '#solidariedade'],
      },
      sw: {
        title: 'Siku 14 za Kumeza Dawa kwa Amani & Kuondoa Unyanyapaa',
        description: 'Kuweka ratiba maalum ya kumeza dawa kila siku, kushiriki ushindi wa afya na kusherehekea kinga kamili (U=U).',
        tags: ['#KumezaDawaKwaWakati', '#UInalinganaNaU', '#KuishiNaMatumaini', '#AfyaBora'],
      },
      fr: { title: '', description: '' },
    },
  };

  return currentCampaigns.map((camp) => {
    const override = campTrans[camp.id]?.[lang];
    if (override && override.title) {
      return {
        ...camp,
        title: override.title,
        description: override.description,
      };
    }
    return camp;
  });
}

export function localizeTimestamp(ts: string, lang: Language): string {
  if (!ts) return "";
  if (lang === "fr") return ts;

  const clean = ts.trim().replace(/[’‘`´]/g, "'");

  const map: Record<string, Record<Language, string>> = {
    "À l'instant": { en: "Just now", sw: "Sasa hivi", ar: "الآن", pt: "Agora mesmo", fr: "À l'instant" },
    "Just now": { en: "Just now", sw: "Sasa hivi", ar: "الآن", pt: "Agora mesmo", fr: "À l'instant" },
    "Sasa hivi": { en: "Just now", sw: "Sasa hivi", ar: "الآن", pt: "Agora mesmo", fr: "À l'instant" },
    "Il y a 1 min": { en: "1 min ago", sw: "Dakika 1 iliyopita", ar: "منذ دقيقة", pt: "Há 1 min", fr: "Il y a 1 min" },
    "Il y a 5 min": { en: "5 min ago", sw: "Dakika 5 zilizopita", ar: "منذ 5 دقائق", pt: "Há 5 min", fr: "Il y a 5 min" },
    "Il y a 10 min": { en: "10 min ago", sw: "Dakika 10 zilizopita", ar: "منذ 10 دقائق", pt: "Há 10 min", fr: "Il y a 10 min" },
    "Il y a 15 min": { en: "15 min ago", sw: "Dakika 15 zilizopita", ar: "منذ 15 دقيقة", pt: "Há 15 min", fr: "Il y a 15 min" },
    "Il y a 30 min": { en: "30 min ago", sw: "Dakika 30 zilizopita", ar: "منذ 30 دقيقة", pt: "Há 30 min", fr: "Il y a 30 min" },
    "Il y a 1h": { en: "1h ago", sw: "Saa 1 lililopita", ar: "منذ ساعة", pt: "Há 1h", fr: "Il y a 1h" },
    "Il y a 2h": { en: "2h ago", sw: "Masaa 2 yaliyopita", ar: "منذ ساعتين", pt: "Há 2h", fr: "Il y a 2h" },
    "Il y a 3h": { en: "3h ago", sw: "Masaa 3 yaliyopita", ar: "منذ 3 ساعات", pt: "Há 3h", fr: "Il y a 3h" },
    "Il y a 4h": { en: "4h ago", sw: "Masaa 4 yaliyopita", ar: "منذ 4 ساعات", pt: "Há 4h", fr: "Il y a 4h" },
    "Il y a 5h": { en: "5h ago", sw: "Masaa 5 yaliyopita", ar: "منذ 5 ساعات", pt: "Há 5h", fr: "Il y a 5h" },
    "Il y a 6h": { en: "6h ago", sw: "Masaa 6 yaliyopita", ar: "منذ 6 ساعات", pt: "Há 6h", fr: "Il y a 6h" },
    "Il y a 8h": { en: "8h ago", sw: "Masaa 8 yaliyopita", ar: "منذ 8 ساعات", pt: "Há 8h", fr: "Il y a 8h" },
    "Hier": { en: "Yesterday", sw: "Jana", ar: "أمس", pt: "Ontem", fr: "Hier" },
    "Yesterday": { en: "Yesterday", sw: "Jana", ar: "أمس", pt: "Ontem", fr: "Hier" },
    "Il y a 1 jour": { en: "1 day ago", sw: "Siku 1 iliyopita", ar: "منذ يوم", pt: "Há 1 dia", fr: "Il y a 1 jour" },
    "Il y a 2 jours": { en: "2 days ago", sw: "Siku 2 zilizopita", ar: "منذ يومين", pt: "Há 2 dias", fr: "Il y a 2 jours" },
    "Il y a 3 jours": { en: "3 days ago", sw: "Siku 3 zilizopita", ar: "منذ 3 أيام", pt: "Há 3 dias", fr: "Il y a 3 jours" },
    "Il y a 4 jours": { en: "4 days ago", sw: "Siku 4 zilizopita", ar: "منذ 4 أيام", pt: "Há 4 dias", fr: "Il y a 4 jours" },
    "Il y a 5 jours": { en: "5 days ago", sw: "Siku 5 zilizopita", ar: "منذ 5 أيام", pt: "Há 5 dias", fr: "Il y a 5 jours" },
    "Il y a 1 semaine": { en: "1 week ago", sw: "Wiki 1 iliyopita", ar: "منذ أسبوع", pt: "Há 1 semana", fr: "Il y a 1 semaine" },
    "Il y a 10 jours": { en: "10 days ago", sw: "Siku 10 zilizopita", ar: "منذ 10 أيام", pt: "Há 10 dias", fr: "Il y a 10 jours" },
    "Il y a 2 semaines": { en: "2 weeks ago", sw: "Wiki 2 zilizopita", ar: "منذ أسبوعين", pt: "Há 2 semaines", fr: "Il y a 2 semaines" },
    "Il y a 3 semaines": { en: "3 weeks ago", sw: "Wiki 3 zilizopita", ar: "منذ 3 أسابيع", pt: "Há 3 semaines", fr: "Il y a 3 semaines" },
    "Il y a 1 mois": { en: "1 month ago", sw: "Mwezi 1 uliopita", ar: "منذ شهر", pt: "Há 1 mês", fr: "Il y a 1 mois" },
  };

  if (map[clean]?.[lang]) return map[clean][lang];

  const minMatch = clean.match(/il y a (\d+)\s*(min|minute|minutes)/i);
  if (minMatch) {
    const n = minMatch[1];
    if (lang === "en") return `${n} min ago`;
    if (lang === "sw") return `Dakika ${n} zilizopita`;
    if (lang === "ar") return `منذ ${n} دقائق`;
    if (lang === "pt") return `Há ${n} min`;
  }
  const hourMatch = clean.match(/il y a (\d+)\s*(h|heure|heures)/i);
  if (hourMatch) {
    const n = hourMatch[1];
    if (lang === "en") return `${n}h ago`;
    if (lang === "sw") return `Masaa ${n} yaliyopita`;
    if (lang === "ar") return `منذ ${n} ساعات`;
    if (lang === "pt") return `Há ${n}h`;
  }
  const dayMatch = clean.match(/il y a (\d+)\s*(j|jour|jours)/i);
  if (dayMatch) {
    const n = dayMatch[1];
    if (lang === "en") return `${n} days ago`;
    if (lang === "sw") return `Siku ${n} zilizopita`;
    if (lang === "ar") return `منذ ${n} أيام`;
    if (lang === "pt") return `Há ${n} dias`;
  }
  const weekMatch = clean.match(/il y a (\d+)\s*(semaine|semaines)/i);
  if (weekMatch) {
    const n = weekMatch[1];
    if (lang === "en") return `${n} weeks ago`;
    if (lang === "sw") return `Wiki ${n} zilizopita`;
    if (lang === "ar") return `منذ ${n} أسابيع`;
    if (lang === "pt") return `Há ${n} semanas`;
  }

  return ts;
}

export function getLocalizedCommunityName(
  communityId: string,
  defaultName: string = "",
  lang: Language = "fr"
): string {
  if (lang === "fr") return defaultName || "Communauté";
  const normId = communityId === "comm-drepano-rdc" ? "comm-drepano" : communityId;
  const commTranslations: Record<string, Record<Language, string>> = {
    "comm-drepano": {
      en: "Overcoming Sickle Cell",
      ar: "قهر فقر الدم المنجلي",
      pt: "Vencer a Anemia Falciforme",
      sw: "Kushinda Seli Mundu",
      fr: "Vaincre la Drépanocytose",
    },
    "comm-survivantes": {
      en: "Survivors & Resilient Hearts",
      ar: "الناجيات والقلوب الصامدة",
      pt: "Sobreviventes & Corações Resilientes",
      sw: "Waathirika & Mioyo Imara",
      fr: "Survivantes & Cœurs Résilients",
    },
    "comm-mental-health": {
      en: "Mental Health & Peaceful Mind",
      ar: "الصحة النفسية والسكينة",
      pt: "Saúde Mental & Espírito Sereno",
      sw: "Afya ya Akili & Amani ya Moyo",
      fr: "Santé Mentale & Esprit Serein",
    },
    "comm-vih": {
      en: "Positive Living & Solidarity",
      ar: "العيش الإيجابي والتضامن",
      pt: "Viver Positivo & Solidários",
      sw: "Kuishi na Matumaini & Mshikamano",
      fr: "Vivre Positif & Solidaires",
    },
    "comm-diabete": {
      en: "Diabetes & Nutrition Well-being",
      ar: "السكري والتغذية السليمة",
      pt: "Diabetes & Nutrição Saudável",
      sw: "Kisukari & Lishe Bora",
      fr: "Diabète & Bien-être Nutritionnel",
    },
    "comm-cancer": {
      en: "Hope & Cancer Support",
      ar: "الأمل ودعم مرضى السرطان",
      pt: "Esperança & Apoio no Cancro",
      sw: "Matumaini & Mapambano dhidi ya Saratani",
      fr: "Espoir & Lutte contre le Cancer",
    },
  };

  if (commTranslations[normId]?.[lang]) {
    return commTranslations[normId][lang];
  }

  const matchByFrenchName: Record<string, string> = {
    "vaincre la drépanocytose": "comm-drepano",
    "survivantes & cœurs résilients": "comm-survivantes",
    "survivantes et coeurs résilients": "comm-survivantes",
    "santé mentale & esprit serein": "comm-mental-health",
    "santé mentale et esprit serein": "comm-mental-health",
    "vivre positif & solidaires": "comm-vih",
    "vivre positif et solidaires": "comm-vih",
    "diabète & bien-être nutritionnel": "comm-diabete",
    "diabète et bien-être nutritionnel": "comm-diabete",
    "espoir & lutte contre le cancer": "comm-cancer",
    "espoir et lutte contre le cancer": "comm-cancer",
  };

  const matchedId = matchByFrenchName[defaultName.toLowerCase().trim()];
  if (matchedId && commTranslations[matchedId]?.[lang]) {
    return commTranslations[matchedId][lang];
  }

  return defaultName || "Communauté";
}

export type DynamicPostTranslation = {
  title?: string;
  content: string;
  tags?: string[];
};

let userPostCacheMemory: Record<string, Record<string, DynamicPostTranslation>> | null = null;

function loadUserPostCache(): Record<string, Record<string, DynamicPostTranslation>> {
  if (userPostCacheMemory) return userPostCacheMemory;
  userPostCacheMemory = {};
  return userPostCacheMemory || {};
}

function persistUserPostCache(cache: Record<string, Record<string, DynamicPostTranslation>>) {
  userPostCacheMemory = cache;
}

export function getUserPostTranslation(postId: string, lang: Language): DynamicPostTranslation | null {
  const cache = loadUserPostCache();
  return cache[postId]?.[lang] || null;
}

export function saveUserPostTranslation(
  postId: string,
  lang: Language,
  translation: DynamicPostTranslation
) {
  const cache = loadUserPostCache();
  if (!cache[postId]) {
    cache[postId] = {};
  }
  cache[postId][lang] = translation;
  persistUserPostCache(cache);
}

export function clearUserPostTranslations(postId: string) {
  const cache = loadUserPostCache();
  if (cache[postId]) {
    delete cache[postId];
    persistUserPostCache(cache);
  }
}

export const STATIC_MOCK_POST_IDS = new Set([
  'post-1',
  'post-johan-2',
  'post-johan-3',
  'post-johan-4',
  'post-johan-5',
  'post-johan-6',
  'post-johan-7',
  'post-johan-8',
  'post-johan-9',
  'post-2',
  'post-amina-2',
  'post-amina-3',
  'post-3',
  'post-4',
  'post-vih-1',
  'post-vih-2',
  'post-vih-3',
]);

const inFlightTranslations = new Set<string>();
const failedCooldowns = new Map<string, number>();

export async function autoTranslateUserPost(post: Post, targetLang: Language): Promise<void> {
  if (!post || !post.content) return;
  if (STATIC_MOCK_POST_IDS.has(post.id)) return;
  const key = `${post.id}:::${targetLang}`;

  // Cooldown check to avoid hammering the translation endpoint when quota is waiting
  const cooldownUntil = failedCooldowns.get(key);
  if (cooldownUntil && Date.now() < cooldownUntil) {
    return;
  }

  if (inFlightTranslations.has(key)) return;

  const existing = getUserPostTranslation(post.id, targetLang);
  if (existing && existing.content) return;

  inFlightTranslations.add(key);

  try {
    const textsToTranslate: string[] = [];
    let hasTitle = false;
    if (post.title && post.title.trim()) {
      textsToTranslate.push(post.title.trim());
      hasTitle = true;
    }
    textsToTranslate.push(post.content.trim());
    const tags = post.tags || [];
    tags.forEach((tag) => textsToTranslate.push(tag));

    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texts: textsToTranslate,
        targetLanguage: targetLang,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.fallback) {
        // Translation service is currently busy or rate-limited; back off for 45 seconds
        failedCooldowns.set(key, Date.now() + 45000);
        return;
      }

      const translatedTexts: string[] = data.translatedTexts || [];
      if (translatedTexts.length > 0) {
        let cursor = 0;
        let transTitle: string | undefined = undefined;
        if (hasTitle) {
          transTitle = translatedTexts[cursor++];
        }
        const transContent = translatedTexts[cursor++] || post.content;
        const transTags: string[] = [];
        for (let i = 0; i < tags.length; i++) {
          if (cursor < translatedTexts.length) {
            transTags.push(translatedTexts[cursor++]);
          } else {
            transTags.push(tags[i]);
          }
        }

        failedCooldowns.delete(key);
        saveUserPostTranslation(post.id, targetLang, {
          title: transTitle,
          content: transContent,
          tags: transTags,
        });

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("tlz_post_translated", {
              detail: { postId: post.id, lang: targetLang },
            })
          );
        }
      }
    } else {
      failedCooldowns.set(key, Date.now() + 45000);
    }
  } catch {
    failedCooldowns.set(key, Date.now() + 45000);
  } finally {
    inFlightTranslations.delete(key);
  }
}

export async function prefetchPostTranslations(post: Post, activeLang?: Language): Promise<void> {
  if (!post || !post.content) return;
  if (STATIC_MOCK_POST_IDS.has(post.id)) return;
  // Translate on-demand at most to active language to avoid quota exhaustion (5 RPM limit)
  if (activeLang) {
    autoTranslateUserPost(post, activeLang).catch(() => {});
  }
}

export function getLocalizedPosts(lang: Language, currentPosts: Post[] = MOCK_POSTS): Post[] {

  const postTrans: Record<
    string,
    Record<
      Language,
      {
        title?: string;
        content: string;
        tags: string[];
        communityName?: string;
      }
    >
  > = {
    'post-1': {
      en: {
        title: 'How do you manage anxiety before flights or sudden climate shifts?',
        content: 'Good morning dear circle! Remember to drink your 2 liters of water today. When the cold weather arrives, keep your extremities warm to prevent joint crises. Much love to all warriors!',
        tags: ['#sickleCell', '#travel', '#courage', '#hydration'],
        communityName: 'Overcoming Sickle Cell',
      },
      ar: {
        title: 'كيف تتعاملون مع القلق قبل السفر بالطائرة أو التغيرات المناخية المفاجئة؟',
        content: 'صباح الخير والبركة لعائلتنا في الدائرة! تذكروا شرب لترين من الماء اليوم. ومع تقلبات الطقس، حافظوا على تدفئة أطرافكم لتجنب آلام المفاصل. خالص المحبة والدعاء لكل المحاربين!',
        tags: ['#فقر_الدم_المنجلي', '#سفر', '#صمود', '#شرب_الماء'],
        communityName: 'قهر فقر الدم المنجلي',
      },
      pt: {
        title: 'Como gerem a ansiedade antes de voos ou mudanças bruscas de clima?',
        content: 'Bom dia querido círculo! Lembrem-se de beber os 2 litros de água hoje. Com as mudanças de temperatura, mantenham os pés e mãos bem aquecidos para prevenir crises. Muita força a todos!',
        tags: ['#anemiaFalciforme', '#viagem', '#coragem', '#hidratação'],
        communityName: 'Vencer a Anemia Falciforme',
      },
      sw: {
        title: 'Mnadhibiti vipi wasiwasi kabla ya safari ya ndege au mabadiliko ya hewa?',
        content: 'Habari za asubuhi wanafamilia! Kumbukeni kunywa lita 2 za maji leo. Hali ya hewa inapobadilika, vaeni mavazi ya joto kuzuia maumivu. Upendo tele kwenu nyote!',
        tags: ['#seliMundu', '#safari', '#ujasiri', '#maji'],
        communityName: 'Kushinda Seli Mundu',
      },
      fr: { content: '', tags: [] },
    },
    'post-johan-2': {
      en: {
        title: 'Which herbal teas do you drink to boost circulation naturally?',
        content: 'People often recommend ginger and hibiscus (Bissap) to me. What are your experiences without risking any interference with folic acid?',
        tags: ['#hydration', '#nature', '#wellnessTips'],
        communityName: 'Overcoming Sickle Cell',
      },
      ar: {
        title: 'ما هي الأعشاب الطبيعية التي تشربونها لتحسين الدورة الدموية؟',
        content: 'ينصحني الكثيرون بتناول الزنجبيل والكركديه (البيساب). ما هي تجاربكم دون التسبب في أي تعارض مع حمض الفوليك؟',
        tags: ['#شرب_الماء', '#طبيعة', '#نصائح_صحية'],
        communityName: 'قهر فقر الدم المنجلي',
      },
      pt: {
        title: 'Que chás naturais tomam para favorecer a circulação?',
        content: 'Falam-me frequentemente do gengibre e hibisco (Bissap). Quais são as vossas experiências sem riscos de interação com o ácido fólico?',
        tags: ['#hidratação', '#natureza', '#dicas'],
        communityName: 'Vencer a Anemia Falciforme',
      },
      sw: {
        title: 'Ni chai gani za asili mnazokunywa kusaidia mzunguko wa damu?',
        content: 'Watu wengi wamenishauri tangawizi na karkadeh (Bissap). Uzoefu wenu ukoje bila kuingiliana na asidi ya foliki?',
        tags: ['#maji', '#asili', '#ushauri'],
        communityName: 'Kushinda Seli Mundu',
      },
      fr: { content: '', tags: [] },
    },
    'post-johan-3': {
      en: {
        title: 'How to stay motivated at university despite frequent absences?',
        content: 'When hospitalization hits right in the middle of exams, disappointment is heavy. How do you negotiate catch-up sessions with your professors?',
        tags: ['#studies', '#courage', '#resilience'],
        communityName: 'Mental Health & Peaceful Mind',
      },
      ar: {
        title: 'كيف تحافظون على الحافز الجامعي رغم الغياب المتكرر بسبب المرض؟',
        content: 'عندما تأتي الإقامة في المستشفى في منتصف فترة الامتحانات، يكون الإحباط كبيراً. كيف تتفاوضون على مواعيد تعويضية مع أساتذتكم؟',
        tags: ['#دراسة', '#صمود', '#عزيمة'],
        communityName: 'الصحة النفسية والسكينة',
      },
      pt: {
        title: 'Como manter a motivação nos estudos apesar das ausências frequentes?',
        content: 'Quando o internamento hospitalar acontece em plena época de exames, o desânimo é grande. Como combinam os exames de recurso com os professores?',
        tags: ['#estudos', '#coragem', '#resiliência'],
        communityName: 'Saúde Mental & Espírito Sereno',
      },
      sw: {
        title: 'Mnawezaje kudumisha motisha ya chuo kikuu licha ya kukosa vipindi mara kwa mara?',
        content: 'Wakati kulazwa hospitalini kunapotokea katikati ya mitihani, kuvunjika moyo ni rahisi. Mnafanyaje mazungumzo na walimu kurudia mitihani?',
        tags: ['#masomo', '#ujasiri', '#ustahimilivu'],
        communityName: 'Afya ya Akili & Amani ya Moyo',
      },
      fr: { content: '', tags: [] },
    },
    'post-johan-4': {
      en: {
        title: 'Gentle sports recommended to maintain muscle mass without exhaustion?',
        content: 'My hematologist cleared me for stationary cycling and brisk walking. Are there warriors who practice yoga or pilates here?',
        tags: ['#sports', '#health', '#endurance'],
        communityName: 'Overcoming Sickle Cell',
      },
      ar: {
        title: 'ما هي الرياضات الخفيفة الموصى بها للحفاظ على الكتلة العضلية دون إجهاد؟',
        content: 'سمح لي طبيب أمراض الدم بركوب الدراجة الثابتة والمشي السريع. هل يمارس أي منكم اليوغا أو البيلاتس هنا؟',
        tags: ['#رياضة', '#صحة', '#لياقة'],
        communityName: 'قهر فقر الدم المنجلي',
      },
      pt: {
        title: 'Exercícios suaves recomendados para manter a massa muscular sem exaustão?',
        content: 'O meu hematologista autorizou a bicicleta ergométrica e caminhadas rápidas. Há guerreiros aqui que pratiquem yoga ou pilates?',
        tags: ['#desporto', '#saúde', '#resistência'],
        communityName: 'Vencer a Anemia Falciforme',
      },
      sw: {
        title: 'Mazoezi gani mepesi yanapendekezwa kulinda misuli bila kuchoka sana?',
        content: 'Daktari wangu wa damu ameniruhusu baiskeli ya ndani na kutembea kwa haraka. Kuna mashujaa wanaofanya yoga au pilates hapa?',
        tags: ['#michezo', '#afya', '#nguvu'],
        communityName: 'Kushinda Seli Mundu',
      },
      fr: { content: '', tags: [] },
    },
    'post-johan-5': {
      en: {
        title: 'Best apps to track daily water intake in real time?',
        content: 'I often struggle to hit my 3.5L goal during class days. Which app or marked water bottle do you use daily?',
        tags: ['#hydration', '#routine', '#lifeHacks'],
        communityName: 'Overcoming Sickle Cell',
      },
      ar: {
        title: 'ما هو أفضل تطبيق لتتبع شرب الماء في الوقت الفعلي؟',
        content: 'غالباً ما أنسى بلوغ هدفي اليومي المحدد بـ 3.5 لترات أثناء الدراسة. ما التطبيق أو القنينة المدرجة التي تستخدمونها؟',
        tags: ['#شرب_الماء', '#روتين_يومي', '#نصائح'],
        communityName: 'قهر فقر الدم المنجلي',
      },
      pt: {
        title: 'Aplicações para controlar o consumo de água em tempo real?',
        content: 'Costumo esquecer-me de atingir os 3.5L diários quando estou nas aulas. Que aplicação ou garrafa graduada usam no dia a dia?',
        tags: ['#hidratação', '#rotina', '#dicas'],
        communityName: 'Vencer a Anemia Falciforme',
      },
      sw: {
        title: 'App ipi bora ya kufuatilia unywaji wa maji kila siku?',
        content: 'Mimi husahau kufikisha lita 3.5 nikiwa darasani. Ni app gani au chupa yenye alama mnayotumia kila siku?',
        tags: ['#maji', '#ratiba', '#mbinu'],
        communityName: 'Kushinda Seli Mundu',
      },
      fr: { content: '', tags: [] },
    },
    'post-johan-6': {
      en: {
        title: 'How do you learn to say NO without feeling guilty or overexplaining?',
        content: 'Declining evening outings when you feel fatigue creeping in, without seeming like a party-pooper... Share your best polite yet firm phrases.',
        tags: ['#boundaries', '#wellbeing', '#psychology'],
        communityName: 'Mental Health & Peaceful Mind',
      },
      ar: {
        title: 'كيف تتعلمون قول "لا" بثقة ودون الحاجة لتبرير أنفسكم؟',
        content: 'رفض السهرات الليلية عند الشعور ببوادر الإرهاق دون أن تبدو غير اجتماعي... شاركونا عباراتكم المفضلة اللطيفة والحازمة.',
        tags: ['#حدود_صحية', '#رفاه_نفسي', '#علم_النفس'],
        communityName: 'الصحة النفسية والسكينة',
      },
      pt: {
        title: 'Como aprendem a dizer NÃO sem necessidade de justificação?',
        content: 'Recusar saídas à noite quando sentimos o cansaço a chegar sem parecer o desmancha-prazeres... Partilhem as vossas melhores respostas gentis mas firmes.',
        tags: ['#limites', '#bemEstar', '#psicologia'],
        communityName: 'Saúde Mental & Espírito Sereno',
      },
      sw: {
        title: 'Mnajifunza vipi kusema HAPANA bila kujihami au kujisikia hatia?',
        content: 'Kukataa mtoko wa usiku unapohisi uchovu unaanza bila kuonekana msumbufu... Tupeeni sentensi zenu nzuri na zenye heshima.',
        tags: ['#mipaka', '#ustawi', '#saikolojia'],
        communityName: 'Afya ya Akili & Amani ya Moyo',
      },
      fr: { content: '', tags: [] },
    },
    'post-johan-7': {
      en: {
        title: 'Crisis emergency kit: what essential items do you keep ready?',
        content: 'Warm thermos, prescribed pain medication, hot water bottle, and my hydration logbook. What is in your emergency kit bag?',
        tags: ['#emergency', '#preparedness', '#solidarity'],
        communityName: 'Overcoming Sickle Cell',
      },
      ar: {
        title: 'حقيبة الطوارئ عند بداية نوبة الألم: ماذا تضعون فيها؟',
        content: 'ترمس ماء دافئ، المسكنات الموصوفة من الطبيب، قربة ماء ساخن، ودفتر شرب الماء. ما هي محتويات حقيبتكم؟',
        tags: ['#طوارئ', '#وقاية', '#تضامن'],
        communityName: 'قهر فقر الدم المنجلي',
      },
      pt: {
        title: 'Kit de emergência para o início de crises: o que guardam?',
        content: 'Garrafa térmica, medicação receitada, botija de água quente e o meu caderno de hidratação. O que têm no vosso kit?',
        tags: ['#emergência', '#prevenção', '#solidariedade'],
        communityName: 'Vencer a Anemia Falciforme',
      },
      sw: {
        title: 'Mkoba wa dharura wa maumivu: mnaweka vitu gani ndani yake?',
        content: 'Chupa ya chai ya joto, dawa zilizoandikwa na daktari, chupa ya maji moto na daftari langu. Vitu gani viko kwenye mkoba wako?',
        tags: ['#dharura', '#maandalizi', '#mshikamano'],
        communityName: 'Kushinda Seli Mundu',
      },
      fr: { content: '', tags: [] },
    },
    'post-johan-8': {
      en: {
        title: 'Deep breathing techniques to soothe vascular spasms?',
        content: 'Practicing 4-7-8 breathing when tension begins has cut my stress levels in half. What exercises bring you relief?',
        tags: ['#breathing', '#relaxation', '#painRelief'],
        communityName: 'Overcoming Sickle Cell',
      },
      ar: {
        title: 'تمارين التنفس العميق لتخفيف تقلصات الأوعية الدموية؟',
        content: 'ممارسة تقنية التنفس 4-7-8 عند بداية التوتر خفضت مستوى الألم والضغط إلى النصف. ما هي التمارين التي تريحكم؟',
        tags: ['#تنفس', '#استرخاء', '#تسكين_الألم'],
        communityName: 'قهر فقر الدم المنجلي',
      },
      pt: {
        title: 'Técnicas de respiração profunda para acalmar o espasmo vascular?',
        content: 'Praticar a respiração 4-7-8 quando sinto tensão reduziu o meu stress para metade. Que exercícios vos dão alívio?',
        tags: ['#respiração', '#relaxamento', '#alívioDaDor'],
        communityName: 'Vencer a Anemia Falciforme',
      },
      sw: {
        title: 'Mbinu za kupumua kwa kina za kutuliza mishipa ya damu?',
        content: 'Kufanya zoezi la pumzi 4-7-8 wakati wa msongo kumenisaidia kupunguza maumivu mara mbili. Mazoezi gani yanakusaidia wewe?',
        tags: ['#pumzi', '#utulivu', '#kingaYaMaumivu'],
        communityName: 'Kushinda Seli Mundu',
      },
      fr: { content: '', tags: [] },
    },
    'post-johan-9': {
      en: {
        title: 'Sharing a wonderful victory: first semester completed with honors!',
        content: 'Despite three hospital visits and long infusion nights, the exam results arrived today: accepted with honors. Never lose hope!',
        tags: ['#victory', '#graduation', '#pride'],
        communityName: 'Mental Health & Peaceful Mind',
      },
      ar: {
        title: 'مشاركة نصر جميل وفرحة غامرة: اجتياز الفصل الأول الجامعي بتقدير ممتاز!',
        content: 'رغم ثلاث إقامات في المستشفى وليالٍ طويلة مع المحاليل، وصلت النتائج اليوم: نجاح بامتياز مع مرتبة الشرف. لا تفقدوا الأمل أبداً!',
        tags: ['#انتصار', '#نجاح', '#فخر'],
        communityName: 'الصحة النفسية والسكينة',
      },
      pt: {
        title: 'Partilha de uma vitória: primeiro semestre concluído com distinção!',
        content: 'Apesar de três internamentos e noites compridas, os resultados saíram hoje: aprovado com distinção. Nunca percam a esperança!',
        tags: ['#vitória', '#diploma', '#orgulho'],
        communityName: 'Saúde Mental & Espírito Sereno',
      },
      sw: {
        title: 'Ushindi mkubwa: nimemaliza muhula wa kwanza wa chuo kikuu kwa alama za juu!',
        content: 'Licha ya kulazwa hospitalini mara tatu, matokeo yametoka leo: nimefaulu vizuri sana. Msikate tamaa kamwe!',
        tags: ['#ushindi', '#masomo', '#fahari'],
        communityName: 'Afya ya Akili & Amani ya Moyo',
      },
      fr: { content: '', tags: [] },
    },
    'post-2': {
      en: {
        title: 'Weekly check-in with our support circle: 14 days without hospital visits',
        content: 'A gentle thought for anyone feeling overwhelmed this week. Remember that your worth is not measured by your productivity. Taking time to breathe and rest is a brave act of healing.',
        tags: ['#solidarity', '#victory', '#collectiveStrength', '#family'],
        communityName: 'Survivors & Resilient Hearts',
      },
      ar: {
        title: 'حصيلة أسبوع من الدعم المتبادل: ١٤ يوماً دون أي إقامة في المستشفى',
        content: 'تحية دافئة وهمسة محبة لكل من يشعر بالإرهاق هذا الأسبوع. تذكر أن قيمتك لا تقاس بمقدار ما تنجزه. أخذ قسط من الراحة والتنفس بهدوء هو خطوة شجاعة نحو الشفاء.',
        tags: ['#تضامن', '#انتصار', '#قوة_جماعية', '#عائلة'],
        communityName: 'الناجيات والقلوب الصامدة',
      },
      pt: {
        title: 'Balanço da nossa semana de apoio mútuo: 14 dias sem internamentos',
        content: 'Uma palavra de carinho para quem se sente sobrecarregado esta semana. O seu valor não se mede pelo cansaço. Tirar um momento para respirar e descansar é um ato de coragem.',
        tags: ['#solidariedade', '#vitória', '#forçaColetiva', '#família'],
        communityName: 'Sobreviventes & Corações Resilientes',
      },
      sw: {
        title: 'Tathmini ya wiki yetu ya mshikamano: siku 14 bila kulazwa hospitalini',
        content: 'Fikra ya upendo kwa yeyote anayehisi kulemewa wiki hii. Utu wako haupimwi kwa kazi nyingi. Kupumzika na kuvuta pumzi ni ujasiri mkubwa wa kupona.',
        tags: ['#mshikamano', '#ushindi', '#nguvuYaPamoja', '#familia'],
        communityName: 'Waathirika & Mioyo Imara',
      },
      fr: { content: '', tags: [] },
    },
    'post-amina-2': {
      en: {
        title: 'How do you prepare meals rich in iron and vitamin B9?',
        content: 'Spinach, amaranth leaves (lenga lenga), lentils, and fresh citrus fruits. What are your favorite affordable family recipes to boost energy?',
        tags: ['#nutrition', '#recipes', '#energy'],
        communityName: 'Overcoming Sickle Cell',
      },
      ar: {
        title: 'كيف تعدون وجبات غنية بالحديد وفيتامين B9؟',
        content: 'السبانخ، أوراق القطيفة، العدس، والحمضيات الطازجة. ما هي وصفاتكم العائلية اللذيذة والاقتصادية لزيادة الحيوية والنشاط؟',
        tags: ['#تغذية', '#وصفات', '#طاقة'],
        communityName: 'قهر فقر الدم المنجلي',
      },
      pt: {
        title: 'Como preparam refeições ricas em ferro e ácido fólico?',
        content: 'Espinafres, folhas de amaranto (lenga lenga), lentilhas e citrinos frescos. Quais são as vossas receitas favoritas para dar energia?',
        tags: ['#nutrição', '#receitas', '#energia'],
        communityName: 'Vencer a Anemia Falciforme',
      },
      sw: {
        title: 'Mnaandaaje vyakula vyenye madini ya chuma na vitamini B9?',
        content: 'Mchicha, mrenda (lenga lenga), dengu na matunda yenye maji. Mapishi gani unayoyapenda ya kuongeza damu na nguvu?',
        tags: ['#lishe', '#mapishi', '#nguvu'],
        communityName: 'Kushinda Seli Mundu',
      },
      fr: { content: '', tags: [] },
    },
    'post-amina-3': {
      en: {
        title: 'Annual gathering of sickle cell families in Gombe: who will join us?',
        content: 'The association is organizing a day of solidarity, free medical checkups, and games for children. We look forward to meeting you all!',
        tags: ['#gathering', '#kinshasa', '#community'],
        communityName: 'Overcoming Sickle Cell',
      },
      ar: {
        title: 'اللقاء السنوي لأسر فقر الدم المنجلي في غومبي: من سينضم إلينا؟',
        content: 'تنظم الجمعية يوماً للتضامن والفحوصات الطبية المجانية والأنشطة الترفيهية للأطفال. نتطلع لرؤيتكم جميعاً!',
        tags: ['#لقاء', '#كينشاسا', '#مجتمع'],
        communityName: 'قهر فقر الدم المنجلي',
      },
      pt: {
        title: 'Encontro anual das famílias com anemia falciforme em Gombe: quem vai estar presente?',
        content: 'A associação está a organizar um dia de solidariedade, exames médicos gratuitos e jogos infantis. Esperamos por todos vós!',
        tags: ['#encontro', '#kinshasa', '#comunidade'],
        communityName: 'Vencer a Anemia Falciforme',
      },
      sw: {
        title: 'Mkutano wa kila mwaka wa familia za seli mundu huko Gombe: nani atakuwepo?',
        content: 'Chama chetu kinaandaa siku ya mshikamano, vipimo vya bure vya daktari na michezo ya watoto. Tunafurahi kukutana nanyi nyote!',
        tags: ['#mkutano', '#kinshasa', '#jamii'],
        communityName: 'Kushinda Seli Mundu',
      },
      fr: { content: '', tags: [] },
    },
    'post-3': {
      en: {
        title: 'Campaign "21 Days to Rebuild Confidence": Day 12 Activity',
        content: 'Quick question for fellow members: what is your best natural soothing routine when night anxiety begins to show up? Looking forward to reading your advice.',
        tags: ['#21daysCampaign', '#resilience', '#therapeuticWriting', '#sisterhood'],
        communityName: 'Survivors & Resilient Hearts',
      },
      ar: {
        title: 'حملة "٢١ يوماً لاستعادة الثقة": نشاط اليوم الثاني عشر',
        content: 'سؤال بسيط ومفتوح لأخوتي وأخواتي في الدائرة: ما هي أفضل عاداتكم الطبيعية للتهدئة والسكينة عندما يبدأ القلق الليلي بالظهور؟ أتطلع لقراءة نصائحكم وتجاربكم.',
        tags: ['#حملة21يوم', '#صمود', '#كتابة_علاجية', '#أخوة'],
        communityName: 'الناجيات والقلوب الصامدة',
      },
      pt: {
        title: 'Campanha "21 Dias para Recuperar a Confiança": Atividade do Dia 12',
        content: 'Pergunta rápida para os colegas do círculo: qual é a vossa melhor rotina para acalmar a mente quando a ansiedade noturna aparece? Ansioso por ler as vossas dicas.',
        tags: ['#campanha21dias', '#resiliência', '#escritaTerapêutica', '#sororidade'],
        communityName: 'Sobreviventes & Corações Resilientes',
      },
      sw: {
        title: 'Kampeni ya "Siku 21 za Kujiamini": Zoezi la Siku ya 12',
        content: 'Swali la upendo kwa wanachama wenzangu: ni njia gani ya asili inayowasaidia zaidi kutuliza moyo wakati wasiwasi wa usiku unapoanza? Ningependa kusoma uzoefu wenu.',
        tags: ['#kampeniSiku21', '#ujasiri', '#uandishiWaKuponya', '#undugu'],
        communityName: 'Waathirika & Mioyo Imara',
      },
      fr: { content: '', tags: [] },
    },
    'post-4': {
      en: {
        title: 'How to explain mental exhaustion to relatives who think it is just laziness?',
        content: 'Mental fatigue is invisible, which makes it harder for families to understand. How do you set boundaries and explain that your brain needs real rest?',
        tags: ['#mentalHealth', '#taboo', '#family', '#listening'],
        communityName: 'Mental Health & Peaceful Mind',
      },
      ar: {
        title: 'كيف تشرحون الإنهاك النفسي لأقارب يعتقدون أنه مجرد كسل؟',
        content: 'التعب النفسي خفي وغير مرئي، مما يجعل فهم الأسرة له صعباً أحياناً. كيف تضعون حدوداً وتوضحون أن العقل يحتاج إلى راحة حقيقية؟',
        tags: ['#صحة_نفسية', '#كسر_التابو', '#أسرة', '#استماع'],
        communityName: 'الصحة النفسية والسكينة',
      },
      pt: {
        title: 'Como explicar a exaustão mental a familiares que acham que é preguiça?',
        content: 'O cansaço mental é invisível, o que dificulta a compreensão da família. Como estabelecem limites e explicam que a mente precisa de descanso real?',
        tags: ['#saúdeMental', '#tabu', '#família', '#escuta'],
        communityName: 'Saúde Mental & Espírito Sereno',
      },
      sw: {
        title: 'Mnaelezaje uchovu wa akili kwa ndugu wanaofikiri ni uvivu?',
        content: 'Uchovu wa akili hauonekani kwa macho, na hivyo hufanya wengine washindwe kuelewa. Mnaweka vipi mipaka kuwaeleza kuwa akili inahitaji mapumziko?',
        tags: ['#afyaYaAkili', '#uvumilivu', '#familia', '#kusikilizana'],
        communityName: 'Afya ya Akili & Amani ya Moyo',
      },
      fr: { content: '', tags: [] },
    },
    'post-vih-1': {
      en: {
        title: 'What are your practical tips to never miss taking your ARV meds while traveling?',
        content: 'Discrete pill containers, dual alarms on my phone, and keeping a 3-day reserve in my backpack. What system works best for you?',
        tags: ['#adherence', '#ARV', '#routine', '#health'],
        communityName: 'Positive Living & Solidarity',
      },
      ar: {
        title: 'ما هي حيلكم العملية لعدم نسيان تناول أدوية ARV أثناء السفر والتنقل؟',
        content: 'علبة أدوية صغيرة وسرية، منبهان على الهاتف، واحتفاظ باحتياطي لـ 3 أيام في حقيبة الظهر. ما هو نظامكم الأكثر راحة؟',
        tags: ['#انتظام_العلاج', '#مضادات_الفيروسات', '#روتين', '#صحة'],
        communityName: 'العيش الإيجابي والتضامن',
      },
      pt: {
        title: 'Quais são as vossas dicas para nunca esquecer a toma de ARV em viagens?',
        content: 'Caixa de comprimidos discreta, dois alarmes no telemóvel e reserva de 3 dias na mochila. Que sistema resulta melhor convosco?',
        tags: ['#adesão', '#ARV', '#rotina', '#saúde'],
        communityName: 'Viver Positivo & Solidários',
      },
      sw: {
        title: 'Mbinu gani zinazowasaidia kutosahau kumeza dawa za ARV mnapokuwa safarini?',
        content: 'Kikasha kidogo cha siri, kengele mbili kwenye simu, na kuweka akiba ya siku 3 kwenye mkoba. Mfumo gani unakusaidia zaidi?',
        tags: ['#kumezaDawa', '#ARV', '#ratiba', '#afya'],
        communityName: 'Kuishi na Matumaini & Mshikamano',
      },
      fr: { content: '', tags: [] },
    },
    'post-vih-2': {
      en: {
        title: 'How do you serenely address serostatus with a new partner?',
        content: 'Choosing a calm setting, explaining scientific facts (U=U), and observing their openness. Courage to anyone preparing for this conversation.',
        tags: ['#relationships', '#trust', '#dialogue', '#love'],
        communityName: 'Positive Living & Solidarity',
      },
      ar: {
        title: 'كيف تطرحون موضوع الحالة الصحية مع شريك جديد بكل هدوء وثقة؟',
        content: 'اختيار توقيت هادئ، شرح الحقائق العلمية المؤكدة (غير قابل للكشف = غير ناقل)، وملاحظة تفهم الطرف الآخر. كل الدعم لمن يستعد لهذا الحوار الصادق.',
        tags: ['#علاقات', '#ثقة', '#حوار', '#محبة'],
        communityName: 'العيش الإيجابي والتضامن',
      },
      pt: {
        title: 'Como abordar com serenidade a serologia com um novo parceiro?',
        content: 'Escolher um momento calmo, explicar os factos médicos (I=I) e observar a compreensão da outra pessoa. Muita força a quem prepara esta conversa.',
        tags: ['#relacionamento', '#confiança', '#diálogo', '#amor'],
        communityName: 'Viver Positivo & Solidários',
      },
      sw: {
        title: 'Mnaanzaje mazungumzo ya utulivu kuhusu hali ya afya na mpenzi mpya?',
        content: 'Kuchagua wakati wa utulivu, kueleza ukweli wa sayansi (U=U), na kuangalia uelewa wake. Ujasiri kwa yeyote anayejiandaa na mazungumzo haya.',
        tags: ['#mahusiano', '#uaminifu', '#mazungumzo', '#upendo'],
        communityName: 'Kuishi na Matumaini & Mshikamano',
      },
      fr: { content: '', tags: [] },
    },
    'post-vih-3': {
      en: {
        title: 'Nutrition & immunity: which local fruits and vegetables do you prioritize?',
        content: 'Papaya, moringa, sweet potato leaves (matembele), and baobab powder. Nature provides great nutrients to support our vitality.',
        tags: ['#nutrition', '#vitality', '#wellbeing'],
        communityName: 'Positive Living & Solidarity',
      },
      ar: {
        title: 'التغذية والمناعة: ما هي الفواكه والخضروات المحلية المفضلة لديكم؟',
        content: 'البابايا، المورينجا، أوراق البطاطا الحلوة (ماتيمبيلي)، ومسحوق الباوباب. الطبيعة غنية بكل ما يدعم المناعة والحيوية.',
        tags: ['#تغذية', '#مناعة', '#حيوية'],
        communityName: 'العيش الإيجابي والتضامن',
      },
      pt: {
        title: 'Alimentação & imunidade: que frutas e vegetais locais recomendam?',
        content: 'Papaia, moringa, folhas de batata-doce (matembele) e pó de embondeiro. A nossa terra tem nutrientes excelentes para a vitalidade.',
        tags: ['#nutrição', '#vitalidade', '#bemEstar'],
        communityName: 'Viver Positivo & Solidários',
      },
      sw: {
        title: 'Lishe na kinga ya mwili: matunda na mboga zipi za kienyeji mnazozipenda zaidi?',
        content: 'Papai, moringa, majani ya viazi vitamu (matembele) na unga wa ubuyu. Asili yetu ina virutubisho bora sana vya kuimarisha afya.',
        tags: ['#lishe', '#kingaYaMwili', '#afyaBora'],
        communityName: 'Kuishi na Matumaini & Mshikamano',
      },
      fr: { content: '', tags: [] },
    },
  };

  return currentPosts.map((post) => {
    const override = postTrans[post.id]?.[lang];
    const localizedTime = localizeTimestamp(post.timestamp, lang);
    const localizedCommName =
      override?.communityName ||
      getLocalizedCommunityName(post.communityId, post.communityName, lang);

    const localizedComments = (post.comments || []).map((comm) => ({
      ...comm,
      timestamp: localizeTimestamp(comm.timestamp, lang),
      authorName: comm.isAnonymous
        ? (lang === "en" ? "Anonymous" : lang === "sw" ? "Bila jina" : lang === "ar" ? "مجهول" : lang === "pt" ? "Anónimo" : "Anonyme")
        : comm.authorName,
    }));

    // 1. Static mock post: return static translation or original French mock post
    const isMock = STATIC_MOCK_POST_IDS.has(post.id);
    if (isMock) {
      if (lang !== 'fr' && override && override.content) {
        return {
          ...post,
          title: override.title !== undefined ? override.title : post.title,
          content: override.content,
          tags: override.tags || post.tags,
          communityName: localizedCommName,
          timestamp: localizedTime,
          comments: localizedComments,
        };
      }
      return {
        ...post,
        communityName: localizedCommName,
        timestamp: localizedTime,
        comments: localizedComments,
      };
    }

    // 2. User post dynamic translation from cache
    const userTrans = getUserPostTranslation(post.id, lang);
    if (userTrans && userTrans.content) {
      return {
        ...post,
        title: userTrans.title !== undefined ? userTrans.title : post.title,
        content: userTrans.content,
        tags: userTrans.tags || post.tags,
        communityName: localizedCommName,
        timestamp: localizedTime,
        comments: localizedComments,
      };
    }

    // 3. User post without cached translation: return original post
    return {
      ...post,
      communityName: localizedCommName,
      timestamp: localizedTime,
      comments: localizedComments,
    };
  });
}
