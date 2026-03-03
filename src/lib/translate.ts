/**
 * English → Hindi translation using MyMemory free API
 * No API key required. Rate limited to 5000 chars/day for anonymous usage.
 */

const API_URL = 'https://api.mymemory.translated.net/get';

export async function translateToHindi(englishText: string): Promise<string> {
  if (!englishText.trim()) return '';
  
  try {
    const params = new URLSearchParams({
      q: englishText,
      langpair: 'en|hi',
    });
    
    const response = await fetch(`${API_URL}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    
    throw new Error(data.responseDetails || 'Translation failed');
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('अनुवाद में त्रुटि हुई। कृपया पुनः प्रयास करें।');
  }
}
