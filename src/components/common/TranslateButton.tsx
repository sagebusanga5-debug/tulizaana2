import React, { useState, useEffect } from 'react';
import { Languages, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { Language } from '../../types';
import { translationService, PostTranslationPayload } from '../../services/translationService';
import { t } from '../../translations';

interface TranslateButtonProps {
  originalText?: string;
  originalPost?: PostTranslationPayload;
  targetLanguage: Language;
  onToggleTranslation?: (showingTranslated: boolean, translatedText: string) => void;
  onTogglePostTranslation?: (
    showingTranslated: boolean,
    translatedPost: PostTranslationPayload
  ) => void;
  className?: string;
  compact?: boolean;
}

export const TranslateButton: React.FC<TranslateButtonProps> = ({
  originalText,
  originalPost,
  targetLanguage,
  onToggleTranslation,
  onTogglePostTranslation,
  className = '',
  compact = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [activeTranslatedLang, setActiveTranslatedLang] = useState<Language>(targetLanguage);
  const [textCache, setTextCache] = useState<Record<string, string>>({});
  const [postCache, setPostCache] = useState<Record<string, PostTranslationPayload>>({});

  // When global targetLanguage changes, update default activeTranslatedLang
  useEffect(() => {
    setActiveTranslatedLang(targetLanguage);
  }, [targetLanguage]);

  const hasContent = originalPost
    ? Boolean(originalPost.content?.trim() || originalPost.title?.trim())
    : Boolean(originalText?.trim());

  if (!hasContent) {
    return null;
  }

  const transStrings = t[targetLanguage]?.translation || t.fr.translation;
  const targetLangLabel = translationService.getLanguageLabel(activeTranslatedLang);

  const translateTo = async (lang: Language, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // If already displaying this translation, toggle back to original
    if (isTranslated && activeTranslatedLang === lang) {
      handleResetOriginal(e);
      return;
    }

    if (originalPost && onTogglePostTranslation) {
      if (postCache[lang]) {
        setActiveTranslatedLang(lang);
        setIsTranslated(true);
        onTogglePostTranslation(true, postCache[lang]);
        return;
      }

      setIsLoading(true);
      setActiveTranslatedLang(lang);
      try {
        const res = await translationService.translatePost(originalPost, lang);
        setPostCache((prev) => ({ ...prev, [lang]: res }));
        setIsTranslated(true);
        onTogglePostTranslation(true, res);
      } catch (err) {
        console.error('Post translation error:', err);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (originalText && onToggleTranslation) {
      if (textCache[lang]) {
        setActiveTranslatedLang(lang);
        setIsTranslated(true);
        onToggleTranslation(true, textCache[lang]);
        return;
      }

      setIsLoading(true);
      setActiveTranslatedLang(lang);
      try {
        const res = await translationService.translateText(originalText, lang);
        const translated = res.translatedText;
        setTextCache((prev) => ({ ...prev, [lang]: translated }));
        setIsTranslated(true);
        onToggleTranslation(true, translated);
      } catch (err) {
        console.error('Translation error:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleResetOriginal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsTranslated(false);
    if (originalPost && onTogglePostTranslation) {
      onTogglePostTranslation(false, originalPost);
    } else if (originalText && onToggleTranslation) {
      onToggleTranslation(false, originalText);
    }
  };

  // Available translation target languages with native and short codes
  const availableLangs: { code: Language; label: string; short: string }[] = [
    { code: 'fr', label: 'Français', short: 'FR' },
    { code: 'sw', label: 'Kiswahili', short: 'SW' },
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'ar', label: 'العربية', short: 'AR' },
    { code: 'pt', label: 'Português', short: 'PT' },
  ];

  // Primary translation target is the user's active UI language
  const defaultTarget: Language = targetLanguage;
  const defaultTargetLabel = translationService.getLanguageLabel(defaultTarget);

  return (
    <div className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      {isTranslated ? (
        <div className="inline-flex items-center gap-1.5 bg-cyan-950/40 border border-cyan-500/40 rounded-lg px-2 py-0.5 text-xs">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300">
            <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>
              {activeTranslatedLang === 'en'
                ? 'English'
                : activeTranslatedLang === 'fr'
                ? 'Français'
                : activeTranslatedLang === 'ar'
                ? 'العربية'
                : activeTranslatedLang === 'pt'
                ? 'Português'
                : 'Kiswahili'}
            </span>
          </span>

          <button
            type="button"
            onClick={handleResetOriginal}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white ml-1 border-l border-cyan-500/30 pl-1.5 transition-colors cursor-pointer"
            title={transStrings.viewOriginal}
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>{transStrings.viewOriginal}</span>
          </button>

          {/* Quick toggle to other languages */}
          <div className="inline-flex items-center gap-1 border-l border-cyan-500/30 pl-1.5">
            {availableLangs
              .filter((l) => l.code !== activeTranslatedLang)
              .map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={(e) => translateTo(l.code, e)}
                  disabled={isLoading}
                  className="text-[10px] text-slate-400 hover:text-cyan-300 px-1 py-0.5 rounded hover:bg-slate-800 transition-colors font-semibold cursor-pointer"
                  title={`${transStrings.translateTo} ${l.label}`}
                >
                  {l.short}
                </button>
              ))}
          </div>
        </div>
      ) : (
        <div className="inline-flex items-center gap-1">
          {/* Main Translate Button */}
          <button
            type="button"
            onClick={(e) => translateTo(defaultTarget, e)}
            disabled={isLoading}
            className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-slate-400 hover:text-cyan-300 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 px-2 py-0.5 rounded-lg transition-all cursor-pointer"
            title={`${transStrings.translateTo} ${defaultTargetLabel}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                <span>{transStrings.translating}</span>
              </>
            ) : (
              <>
                <Languages className="w-3 h-3 text-cyan-400" />
                <span>
                  {compact
                    ? defaultTargetLabel
                    : `${transStrings.translateTo} ${defaultTargetLabel}`}
                </span>
              </>
            )}
          </button>

          {/* Language selector chips: FR, SW, EN, AR, PT */}
          {!compact && (
            <div className="inline-flex items-center gap-0.5">
              {availableLangs
                .filter((l) => l.code !== defaultTarget)
                .map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={(e) => translateTo(l.code, e)}
                    disabled={isLoading}
                    className="text-[10px] font-bold text-slate-400 hover:text-cyan-300 px-1 py-0.5 rounded bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 transition-colors cursor-pointer"
                    title={`${transStrings.translateTo} ${l.label}`}
                  >
                    {l.short}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
