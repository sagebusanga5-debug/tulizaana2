import { Language } from '../types';

// In-memory client cache to ensure instantaneous responses for already-translated texts
const translationCache = new Map<string, string>();

export interface TranslationResult {
  translatedText: string;
  detectedLanguage?: string;
  targetLanguage: Language;
  cached?: boolean;
}

export interface PostTranslationPayload {
  title?: string;
  content: string;
  tags?: string[];
  objective?: string;
}

export interface PostTranslationResult {
  title?: string;
  content: string;
  tags?: string[];
  objective?: string;
  targetLanguage: Language;
}

export const translationService = {
  /**
   * Get human readable label for a language
   */
  getLanguageLabel(lang: Language): string {
    switch (lang) {
      case 'ar':
        return 'العربية (Arabe)';
      case 'pt':
        return 'Português';
      case 'en':
        return 'English';
      case 'sw':
        return 'Kiswahili';
      case 'fr':
      default:
        return 'Français';
    }
  },

  /**
   * Translate a single text string into the target language in real-time
   */
  async translateText(
    text: string,
    targetLanguage: Language,
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    if (!text || !text.trim()) {
      return { translatedText: text, targetLanguage };
    }

    const cacheKey = `${targetLanguage}:::${text.trim()}`;
    if (translationCache.has(cacheKey)) {
      return {
        translatedText: translationCache.get(cacheKey)!,
        targetLanguage,
        cached: true,
      };
    }

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLanguage,
          sourceLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      const resultText = data.translatedText || text;

      // Save in cache if genuine translation (avoid caching temporary fallback)
      if (!data.fallback && resultText !== text) {
        translationCache.set(cacheKey, resultText);
      }

      return {
        translatedText: resultText,
        detectedLanguage: data.detectedLanguage,
        targetLanguage,
        cached: false,
      };
    } catch (error) {
      return {
        translatedText: text,
        targetLanguage,
        cached: false,
      };
    }
  },

  /**
   * Batch translate multiple texts
   */
  async translateBatch(
    texts: string[],
    targetLanguage: Language
  ): Promise<string[]> {
    if (!texts || texts.length === 0) return [];

    const uncachedIndices: number[] = [];
    const uncachedTexts: string[] = [];
    const results: string[] = new Array(texts.length);

    texts.forEach((txt, idx) => {
      const cacheKey = `${targetLanguage}:::${txt.trim()}`;
      if (translationCache.has(cacheKey)) {
        results[idx] = translationCache.get(cacheKey)!;
      } else {
        uncachedIndices.push(idx);
        uncachedTexts.push(txt);
      }
    });

    if (uncachedTexts.length === 0) {
      return results;
    }

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: uncachedTexts,
          targetLanguage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const translations: string[] = data.translatedTexts || uncachedTexts;
        translations.forEach((t, i) => {
          const originalIdx = uncachedIndices[i];
          const originalText = uncachedTexts[i];
          results[originalIdx] = t;
          if (!data.fallback && t !== originalText) {
            translationCache.set(`${targetLanguage}:::${originalText.trim()}`, t);
          }
        });
        return results;
      }
    } catch {
      // Graceful fallback to originals
    }

    // Fallback: fill uncached with originals
    uncachedIndices.forEach((origIdx, i) => {
      results[origIdx] = uncachedTexts[i];
    });

    return results;
  },

  /**
   * Translate an entire post including title, content, and hashtags together
   */
  async translatePost(
    post: PostTranslationPayload,
    targetLanguage: Language
  ): Promise<PostTranslationResult> {
    const textsToTranslate: string[] = [];
    const mapping: { type: 'title' | 'content' | 'tag' | 'objective'; tagIdx?: number }[] = [];

    if (post.title && post.title.trim()) {
      textsToTranslate.push(post.title);
      mapping.push({ type: 'title' });
    }

    if (post.content && post.content.trim()) {
      textsToTranslate.push(post.content);
      mapping.push({ type: 'content' });
    }

    if (post.objective && post.objective.trim()) {
      textsToTranslate.push(post.objective);
      mapping.push({ type: 'objective' });
    }

    if (post.tags && post.tags.length > 0) {
      post.tags.forEach((tag, idx) => {
        const cleanTag = tag.trim().startsWith('#') ? tag.trim().slice(1) : tag.trim();
        if (cleanTag) {
          textsToTranslate.push(cleanTag);
          mapping.push({ type: 'tag', tagIdx: idx });
        }
      });
    }

    if (textsToTranslate.length === 0) {
      return { ...post, targetLanguage };
    }

    const translatedResults = await this.translateBatch(textsToTranslate, targetLanguage);
    let translatedTitle = post.title;
    let translatedContent = post.content;
    let translatedObjective = post.objective;
    const translatedTags = post.tags ? [...post.tags] : [];

    mapping.forEach((item, i) => {
      const trans = translatedResults[i];
      if (!trans) return;
      if (item.type === 'title') {
        translatedTitle = trans;
      } else if (item.type === 'content') {
        translatedContent = trans;
      } else if (item.type === 'objective') {
        translatedObjective = trans;
      } else if (item.type === 'tag' && item.tagIdx !== undefined) {
        const formatted = trans.trim().startsWith('#')
          ? trans.trim()
          : `#${trans.trim().replace(/\s+/g, '_')}`;
        translatedTags[item.tagIdx] = formatted;
      }
    });

    return {
      title: translatedTitle,
      content: translatedContent,
      objective: translatedObjective,
      tags: translatedTags,
      targetLanguage,
    };
  },
};
