import React, { useState, useEffect } from 'react';
import {
  X,
  PhoneCall,
  Shield,
} from 'lucide-react';
import { Language } from '../../types';
import { t } from '../../translations';

interface SOSModalProps {
  onClose: () => void;
  language?: Language;
}

interface Helpline {
  country: string;
  code: string;
  services: {
    name: string;
    number: string;
    free: boolean;
    description: string;
  }[];
}

const DEFAULT_HELPLINES: Record<Language, Helpline[]> = {
  fr: [
    {
      country: 'RDC (Congo)',
      code: 'CD',
      services: [
        {
          name: 'Ligne Verte Nationale Assistance Psychologique & VBG',
          number: '122',
          free: true,
          description: 'Écoute confidentielle 24h/24 pour violences basées sur le genre et détresse psychologique.',
        },
        {
          name: 'Assistance Urgence Enfance & Jeunesse',
          number: '116',
          free: true,
          description: 'Soutien direct aux mineurs et familles en situation de crise.',
        },
        {
          name: 'SOS Médecins Kinshasa / Goma',
          number: '+243810000000',
          free: false,
          description: 'Orientation médicale et urgence sanitaire.',
        },
      ],
    },
    {
      country: 'Rwanda',
      code: 'RW',
      services: [
        {
          name: 'Isange One Stop Center',
          number: '3512',
          free: true,
          description: 'Assistance médicale, légale et psychologique immédiate.',
        },
        {
          name: 'Childline Rwanda',
          number: '116',
          free: true,
          description: 'Protection de l’enfance et soutien psychologique d’urgence.',
        },
      ],
    },
    {
      country: 'Burundi',
      code: 'BI',
      services: [
        {
          name: 'Ligne d’Écoute Nationale VBG',
          number: '116',
          free: true,
          description: 'Assistance et orientation pour survivantes de violences.',
        },
        {
          name: 'SOS Détresse Burundi',
          number: '112',
          free: true,
          description: 'Numéro d’urgence et orientation psychologique.',
        },
      ],
    },
    {
      country: 'France / Diaspora',
      code: 'FR',
      services: [
        {
          name: 'Numéro National Prévention Suicide',
          number: '3114',
          free: true,
          description: 'Professionnels de santé formés à la détresse psychologique 24/7.',
        },
        {
          name: 'SOS Violences Femmes',
          number: '3919',
          free: true,
          description: 'Écoute anonyme et gratuite pour toutes femmes victimes de violences.',
        },
      ],
    },
  ],
  sw: [
    {
      country: 'RDC (Kongo)',
      code: 'CD',
      services: [
        {
          name: 'Mstari wa Kitaifa wa Msaada wa Kisaikolojia & GBV',
          number: '122',
          free: true,
          description: 'Kusikilizwa kwa siri saa 24/7 dhidi ya unyanyasaji wa kijinsia na msongo wa mawazo.',
        },
        {
          name: 'Msaada wa Dharura kwa Watoto & Vijana',
          number: '116',
          free: true,
          description: 'Msaada wa moja kwa moja kwa watoto na familia zilizo kwenye shida.',
        },
        {
          name: 'SOS Madaktari Kinshasa / Goma',
          number: '+243810000000',
          free: false,
          description: 'Mwongozo wa matibabu na huduma za dharura za afya.',
        },
      ],
    },
    {
      country: 'Rwanda',
      code: 'RW',
      services: [
        {
          name: 'Isange One Stop Center',
          number: '3512',
          free: true,
          description: 'Msaada wa matibabu, kisheria na kisaikolojia mara moja.',
        },
        {
          name: 'Childline Rwanda',
          number: '116',
          free: true,
          description: 'Ulinzi wa watoto na usaidizi wa kisaikolojia wa dharura.',
        },
      ],
    },
    {
      country: 'Burundi',
      code: 'BI',
      services: [
        {
          name: 'Mstari wa Kitaifa wa Kusikiliza GBV',
          number: '116',
          free: true,
          description: 'Msaada na mwongozo kwa waathirika wa unyanyasaji.',
        },
        {
          name: 'SOS Dharura Burundi',
          number: '112',
          free: true,
          description: 'Nambari ya dharura na ushauri wa kisaikolojia.',
        },
      ],
    },
    {
      country: 'Ughaibuni / Diaspora',
      code: 'FR',
      services: [
        {
          name: 'Kuzuia Kujiua Kitaifa',
          number: '3114',
          free: true,
          description: 'Wataalamu wa afya waliofunzwa kusaidia dhiki ya akili 24/7.',
        },
        {
          name: 'SOS Dhidi ya Unyanyasaji wa Wanawake',
          number: '3919',
          free: true,
          description: 'Kusikilizwa bila malipo kwa wanawake wanaokumbana na unyanyasaji.',
        },
      ],
    },
  ],
  en: [
    {
      country: 'DRC (Congo)',
      code: 'CD',
      services: [
        {
          name: 'National Psychological & GBV Support Helpline',
          number: '122',
          free: true,
          description: '24/7 confidential listening for gender-based violence and psychological distress.',
        },
        {
          name: 'Child & Youth Crisis Helpline',
          number: '116',
          free: true,
          description: 'Direct support for minors and families in crisis situations.',
        },
        {
          name: 'SOS Doctors Kinshasa / Goma',
          number: '+243810000000',
          free: false,
          description: 'Medical orientation and emergency healthcare routing.',
        },
      ],
    },
    {
      country: 'Rwanda',
      code: 'RW',
      services: [
        {
          name: 'Isange One Stop Center',
          number: '3512',
          free: true,
          description: 'Immediate medical, legal, and psychological trauma assistance.',
        },
        {
          name: 'Childline Rwanda',
          number: '116',
          free: true,
          description: 'Child protection and urgent psychological counseling.',
        },
      ],
    },
    {
      country: 'Burundi',
      code: 'BI',
      services: [
        {
          name: 'National GBV Support Helpline',
          number: '116',
          free: true,
          description: 'Guidance and crisis assistance for survivors of violence.',
        },
        {
          name: 'SOS Distress Burundi',
          number: '112',
          free: true,
          description: 'Emergency counseling and psychosocial orientation.',
        },
      ],
    },
    {
      country: 'International / Diaspora',
      code: 'FR',
      services: [
        {
          name: 'National Suicide Prevention Line',
          number: '3114',
          free: true,
          description: 'Healthcare professionals trained in psychological distress 24/7.',
        },
        {
          name: 'SOS Violence Against Women',
          number: '3919',
          free: true,
          description: 'Free, anonymous helpline for all women facing abuse.',
        },
      ],
    },
  ],
  ar: [
    {
      country: 'جمهورية الكونغو الديمقراطية (RDC)',
      code: 'CD',
      services: [
        {
          name: 'الخط الأخضر الوطني للدعم النفسي ومناهضة العنف القائم على النوع الاجتماعي',
          number: '122',
          free: true,
          description: 'استماع سري وسريع على مدار الساعة لضحايا العنف والضيق النفسي الحاد.',
        },
        {
          name: 'نجدة الطفولة والشباب',
          number: '116',
          free: true,
          description: 'دعم نفسي واجتماعي مباشر للقاصرين والأسر في الأزمات.',
        },
        {
          name: 'إسعاف كينشاسا وغوما',
          number: '+243810000000',
          free: false,
          description: 'توجيه طبي طارئ وإسعافات نفسية أولية.',
        },
      ],
    },
    {
      country: 'مصر والشرق الأوسط',
      code: 'EG',
      services: [
        {
          name: 'الخط الساخن للأمانة العامة للصحة النفسية وعلاج الإدمان',
          number: '16328',
          free: true,
          description: 'استشارات نفسية متخصصة ومجانية بإشراف أطباء نفسيين على مدار 24 ساعة.',
        },
        {
          name: 'خط نجدة الطفل وحماية الأسرة',
          number: '16000',
          free: true,
          description: 'مساندة فورية للأطفال المعرضين للخطر ودعم الوالدين.',
        },
      ],
    },
    {
      country: 'المغرب وشمال أفريقيا',
      code: 'MA',
      services: [
        {
          name: 'خلية الاستماع والدعم النفسي ومناهضة العنف ضد النساء',
          number: '8350',
          free: true,
          description: 'استماع وتوجيه قانوني ونفسي للمرأة والضحايا.',
        },
        {
          name: 'الرقم الوطني للطوارئ الصحية والإرشاد',
          number: '141',
          free: true,
          description: 'توجيه صحي ونفسي عاجل في جميع أنحاء المملكة.',
        },
      ],
    },
    {
      country: 'دولي / المهجر',
      code: 'FR',
      services: [
        {
          name: 'الرقم الوطني للوقاية من الانتحار والأزمات النفسية',
          number: '3114',
          free: true,
          description: 'أخصائيون نفسيون متاحون 24/7 للرد على الاستفسارات وتقديم العون.',
        },
        {
          name: 'طوارئ الاستماع والعنف الأسري',
          number: '3919',
          free: true,
          description: 'خط مجاني ومجهول الهوية لدعم ضحايا العنف والاضطهاد.',
        },
      ],
    },
  ],
  pt: [
    {
      country: 'RDC (Congo) / Região',
      code: 'CD',
      services: [
        {
          name: 'Linha Verde Nacional de Assistência Psicológica & VBG',
          number: '122',
          free: true,
          description: 'Apoio e escuta confidencial 24h por dia para violência baseada no género e crise psicológica.',
        },
        {
          name: 'SOS Emergência Infância & Família',
          number: '116',
          free: true,
          description: 'Apoio direto e proteção integral a menores e famílias em situação vulnerável.',
        },
      ],
    },
    {
      country: 'Angola',
      code: 'AO',
      services: [
        {
          name: 'Linha SOS Criança & Família (INAC)',
          number: '15015',
          free: true,
          description: 'Atendimento e proteção prioritária de menores em crise ou perigo.',
        },
        {
          name: 'Emergência Nacional de Apoio e Socorro',
          number: '111',
          free: true,
          description: 'Encaminhamento urgente e intervenção de proteção social imediata.',
        },
      ],
    },
    {
      country: 'Moçambique',
      code: 'MZ',
      services: [
        {
          name: 'Linha Fala Criança',
          number: '116',
          free: true,
          description: 'Apoio gratuito, escuta ativa e denúncia confidencial de situações de risco infantil.',
        },
        {
          name: 'Gabinete de Atendimento à Família e Vítimas de Violência',
          number: '112',
          free: true,
          description: 'Assistência imediata e proteção a vítimas de violência doméstica.',
        },
      ],
    },
    {
      country: 'Portugal / Internacional / Diáspora',
      code: 'PT',
      services: [
        {
          name: 'Linha de Apoio Psicológico SNS 24',
          number: '808242424',
          free: true,
          description: 'Psicólogos clínicos credenciados disponíveis 24 horas por dia com sigilo.',
        },
        {
          name: 'SOS Voz Amiga (Prevenção do Suicídio e Sofrimento)',
          number: '213544545',
          free: false,
          description: 'Escuta solidária e humana para momentos de aflição, solidão e angústia.',
        },
      ],
    },
  ],
};

export const SOSModal: React.FC<SOSModalProps> = ({ onClose, language = 'fr' }) => {
  const defaultList = DEFAULT_HELPLINES[language] || DEFAULT_HELPLINES.fr;
  const [helplines, setHelplines] = useState<Helpline[]>(defaultList);
  const [selectedCountry, setSelectedCountry] = useState<string>('CD');

  useEffect(() => {
    setHelplines(DEFAULT_HELPLINES[language] || DEFAULT_HELPLINES.fr);
  }, [language]);

  const strings = t[language]?.sos || t.fr.sos;
  const currentCountryHelpline =
    helplines.find((h) => h.code === selectedCountry) || helplines[0] || defaultList[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#182231] rounded-3xl border border-rose-500/40 shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-rose-950 via-[#182231] to-[#182231] border-b border-rose-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center animate-bounce">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white font-display">
                {strings.title}
              </h2>
              <p className="text-xs text-rose-300">
                {strings.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={strings.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Country Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              {strings.selectCountry}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {helplines.map((h) => (
                <button
                  key={h.code}
                  type="button"
                  onClick={() => setSelectedCountry(h.code)}
                  className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all cursor-pointer ${
                    selectedCountry === h.code
                      ? 'bg-rose-500/20 border-rose-400 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="block truncate">{h.country.split('(')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Helpline Cards */}
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {currentCountryHelpline?.services.map((service, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      {service.name}
                    </h3>
                    {service.free && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        {strings.free}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300">
                    {service.description}
                  </p>
                </div>

                <a
                  href={`tel:${service.number}`}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-transform active:scale-95 shrink-0 self-end sm:self-center"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{service.number}</span>
                </a>
              </div>
            ))}
          </div>

          {/* Reassurance text */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 leading-relaxed flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              {language === 'sw'
                ? 'Tulizaana ni jukwaa la kusaidiana kwa mshikamano wa kijamii lakini halibadilishi msaada wa matibabu au huduma za dharura za hospitali.'
                : language === 'en'
                ? 'Tulizaana is a community solidarity space and does not replace professional medical diagnosis or hospital emergency services.'
                : "Tulizaana est un espace de soutien solidaire communautaire mais ne remplace pas une assistance médicale ou un service d'urgence hospitalier."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
