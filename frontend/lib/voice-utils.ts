import { api, isAbortError } from "@/lib/api-client";

export interface TranslatedSearch {
  language: string;
  english: string;
  keywords: string[];
}

// The server's cap on POST /api/search/translate. Over-long dictation is
// clipped here rather than bounced back as a 422.
const MAX_SEARCH_CHARS = 500;

/**
 * Normalise a (usually voice-dictated) search phrase: detect its language and
 * reduce it to clean English search terms.
 *
 * This used to call Gemini directly from the browser using
 * NEXT_PUBLIC_GEMINI_API_KEY, which Next.js inlines into the public bundle —
 * the key was readable by anyone who opened DevTools. The prompt and the key
 * now live behind POST /api/search/translate.
 *
 * That endpoint never returns 5xx: if Gemini fails it applies the same
 * heuristics server-side and still answers 200. The local fallbacks below
 * therefore only cover the network itself being unavailable — and they are the
 * reason `detectLanguage` and `extractKeywords` stay in this file.
 */
export async function detectLanguageAndTranslate(text: string): Promise<TranslatedSearch> {
  try {
    const result = await api.post<TranslatedSearch>(
      '/api/search/translate',
      { text: text.slice(0, MAX_SEARCH_CHARS) },
      { optionalAuth: true }
    );

    // Trust the shape, but never hand back an empty search: a 429 body or a
    // future contract change must not blank the search box.
    return {
      language: result?.language || detectLanguage(text),
      english: result?.english?.trim() || text,
      keywords: result?.keywords?.length ? result.keywords : extractKeywords(text),
    };
  } catch (error) {
    if (!isAbortError(error)) {
      console.error('Search translation failed; using local keyword extraction:', error);
    }
    return {
      language: detectLanguage(text),
      english: text,
      keywords: extractKeywords(text),
    };
  }
}

// Simple fallback language detection
export function detectLanguage(text: string): "en" | "hi" | string {
  // Basic check for Hindi unicode range
  if (/\p{Script=Devanagari}/u.test(text)) return "hi";
  // Basic check for Bengali
  if (/\p{Script=Bengali}/u.test(text)) return "bn";
  // Basic check for Tamil
  if (/\p{Script=Tamil}/u.test(text)) return "ta";
  // Add more language checks as needed
  return "en";
}

// Extract keywords (simple version)
export function extractKeywords(text: string): string[] {
  // Lowercase and split by space, filter stopwords, lemmatize common product words
  const stopwords = [
    "mein", "ek", "hu", "par", "honi", "chahiye", "us", "dhundo", "dhudro", "ke", "ki", "ka", "ko", "hai", "ho", "par", "aur", "lekin", "to", "the", "a", "an", "with", "for", "on", "in", "of", "and", "or", "but", "want", "make", "see", "show", "find", "search", "need", "would", "like", "i", "me", "my", "you", "your", "today", "yesterday"
  ];
  // Lemmatize common product-related words
  const lemmaMap: Record<string, string> = {
    items: "item",
    products: "product",
    clothes: "cloth",
    sarees: "saree",
    paintings: "painting",
    arts: "art",
    crafts: "craft",
    handmade: "handmade",
    unique: "unique"
  };
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N} ]+/gu, "")
    .split(/\s+/)
    .map(word => lemmaMap[word] || word)
    .filter(word => word && !stopwords.includes(word));
}

// Main function to process voice transcription using Gemini
export async function processVoiceTranscription(transcription: string): Promise<{ searchText: string, keywords: string[], english: string, language: string }> {
  try {
    const result = await detectLanguageAndTranslate(transcription);
    return {
      searchText: result.english,
      keywords: result.keywords,
      english: result.english,
      language: result.language
    };
  } catch (error) {
    console.error('Error processing voice transcription:', error);
    // Fallback to simple processing
    const language = detectLanguage(transcription);
    const keywords = extractKeywords(transcription);
    return {
      searchText: transcription,
      keywords,
      english: transcription,
      language
    };
  }
}
