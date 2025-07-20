import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Utility to detect language and translate using Gemini
export async function detectLanguageAndTranslate(text: string): Promise<{ language: string; english: string; keywords: string[] }> {
  try {
    const prompt = `You are a language processing assistant for an Indian handicrafts marketplace. Analyze the following text and respond with ONLY a valid JSON object (no markdown, no code blocks, no extra text).

    Tasks:
    1. Detect the language (use ISO codes: "en" for English, "hi" for Hindi, "bn" for Bengali, "ta" for Tamil, "te" for Telugu, "mr" for Marathi, "gu" for Gujarati, "kn" for Kannada, "ml" for Malayalam, "pa" for Punjabi, "or" for Odia, "as" for Assamese)
    2. Extract the core search terms from the user's intent. Remove filler words like "I want", "show me", "find me", etc. Focus ONLY on the product/craft they're looking for.
    3. Provide clean search keywords optimized for product search (focus on: product types, materials, techniques, regions, colors, styles)

    Examples:
    - "मुझे मधुबनी पेंटिंग चाहिए" → "Madhubani painting"
    - "I want silk sarees from Banarasi" → "Banarasi silk sarees"
    - "Show me pottery from Rajasthan" → "Rajasthan pottery"

    Input text: "${text}"

    Response format (JSON only):
    {"language":"xx","english":"clean search terms","keywords":["word1","word2","word3"]}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    try {
      // Extract JSON from markdown code blocks if present
      let jsonText = responseText.trim();
      
      // Remove markdown code block markers if they exist
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsedResponse = JSON.parse(jsonText);
      return {
        language: parsedResponse.language || 'en',
        english: parsedResponse.english || text,
        keywords: parsedResponse.keywords || extractKeywords(text)
      };
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.log('Raw response text:', responseText);
      
      // Try to extract JSON manually as fallback
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedResponse = JSON.parse(jsonMatch[0]);
          return {
            language: parsedResponse.language || 'en',
            english: parsedResponse.english || text,
            keywords: parsedResponse.keywords || extractKeywords(text)
          };
        }
      } catch (secondParseError) {
        console.error('Second parse attempt failed:', secondParseError);
      }
      
      // Fallback to simple detection and extraction
      return {
        language: detectLanguage(text),
        english: text,
        keywords: extractKeywords(text)
      };
    }
  } catch (error) {
    console.error('Error with Gemini API:', error);
    // Fallback to simple detection and extraction
    return {
      language: detectLanguage(text),
      english: text,
      keywords: extractKeywords(text)
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
