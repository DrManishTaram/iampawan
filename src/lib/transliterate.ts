/**
 * Hinglish (ITRANS-like) → Unicode Hindi Transliteration Engine
 * 
 * Rule-based, deterministic transliteration system.
 * Processes input left-to-right using longest-match-first strategy.
 * Handles matras, half-letters, conjuncts, anusvara, visarga, chandrabindu.
 */

// Consonant mappings (Hinglish → Devanagari)
const CONSONANTS: Record<string, string> = {
  // Conjuncts (must come before individual consonants for longest match)
  'ksh': 'क्ष',
  'gya': 'ज्ञ',
  'gny': 'ज्ञ',
  'shr': 'श्र',
  'tra': 'त्र',
  // Aspirated consonants (longest match first)
  'chh': 'छ',
  'kh': 'ख',
  'gh': 'घ',
  'ch': 'च',
  'jh': 'झ',
  'th': 'थ',
  'dh': 'ध',
  'ph': 'फ',
  'bh': 'भ',
  'sh': 'श',
  'TH': 'ठ',
  'DH': 'ढ',
  'ng': 'ङ',
  'nj': 'ञ',
  // Retroflex consonants
  'T': 'ट',
  'D': 'ड',
  'N': 'ण',
  // Basic consonants
  'k': 'क',
  'g': 'ग',
  'j': 'ज',
  't': 'त',
  'd': 'द',
  'n': 'न',
  'p': 'प',
  'f': 'फ',
  'b': 'ब',
  'm': 'म',
  'y': 'य',
  'r': 'र',
  'l': 'ल',
  'v': 'व',
  'w': 'व',
  's': 'स',
  'h': 'ह',
  'q': 'क़',
  'x': 'क्ष',
  'z': 'ज़',
};

// Independent vowel forms
const VOWELS: Record<string, string> = {
  'aa': 'आ',
  'ee': 'ई',
  'oo': 'ऊ',
  'ai': 'ऐ',
  'au': 'औ',
  'ou': 'औ',
  'ei': 'ऐ',
  'a': 'अ',
  'i': 'इ',
  'u': 'उ',
  'e': 'ए',
  'o': 'ओ',
};

// Matra (dependent vowel) forms - used after consonants
const MATRAS: Record<string, string> = {
  'aa': 'ा',
  'ee': 'ी',
  'oo': 'ू',
  'ai': 'ै',
  'au': 'ौ',
  'ou': 'ौ',
  'ei': 'ै',
  'a': '',  // inherent 'a' - no matra needed
  'i': 'ि',
  'u': 'ु',
  'e': 'े',
  'o': 'ो',
};

// Special characters
const SPECIALS: Record<string, string> = {
  'M': 'ं',   // anusvara
  'H': 'ः',   // visarga
  '.': '।',   // purna viram
  '..': '॥',  // double viram
  'om': 'ॐ',
  'Om': 'ॐ',
};

// Nukta consonants
const NUKTA: Record<string, string> = {
  'क़': 'क़',
  'ज़': 'ज़',
  'फ़': 'फ़',
};

const HALANT = '्';

/**
 * Check if a character is a vowel pattern starting at position
 */
function matchVowel(text: string, pos: number): { vowel: string; match: string } | null {
  // Try longest matches first
  const candidates = ['aa', 'ee', 'oo', 'ai', 'au', 'ou', 'ei', 'a', 'i', 'u', 'e', 'o'];
  for (const v of candidates) {
    if (text.substring(pos, pos + v.length).toLowerCase() === v) {
      return { vowel: v, match: v };
    }
  }
  return null;
}

/**
 * Match consonant at position
 */
function matchConsonant(text: string, pos: number): { consonant: string; match: string } | null {
  // Try longest matches first (sorted by length desc)
  const keys = Object.keys(CONSONANTS).sort((a, b) => b.length - a.length);
  for (const c of keys) {
    const substr = text.substring(pos, pos + c.length);
    if (substr === c || (c === c.toLowerCase() && substr.toLowerCase() === c)) {
      // Case-sensitive for T, D, N, TH, DH
      if (['T', 'D', 'N', 'TH', 'DH'].includes(c)) {
        if (text.substring(pos, pos + c.length) === c) {
          return { consonant: CONSONANTS[c], match: c };
        }
      } else {
        if (text.substring(pos, pos + c.length).toLowerCase() === c.toLowerCase()) {
          return { consonant: CONSONANTS[c], match: text.substring(pos, pos + c.length) };
        }
      }
    }
  }
  return null;
}

/**
 * Main transliteration function: Hinglish → Unicode Hindi
 */
export function transliterateToHindi(input: string): string {
  if (!input) return '';
  
  const words = input.split(/(\s+|[,;:!?\-()'"।॥])/);
  return words.map(word => {
    if (/^\s+$/.test(word) || /^[,;:!?\-()'"।॥]$/.test(word)) return word;
    return transliterateWord(word);
  }).join('');
}

function transliterateWord(word: string): string {
  let result = '';
  let i = 0;
  let lastWasConsonant = false;
  
  while (i < word.length) {
    // Try special sequences
    if (word.substring(i, i + 2) === '..') {
      result += '॥';
      i += 2;
      lastWasConsonant = false;
      continue;
    }
    
    // Try anusvara 'n' before consonants (nasal)
    if (word[i] === 'n' && i + 1 < word.length) {
      const nextConsonant = matchConsonant(word, i + 1);
      if (nextConsonant && lastWasConsonant) {
        // Check if this 'n' is a nasal before a consonant
        const nasalGroups: Record<string, string> = {
          'क': 'ं', 'ख': 'ं', 'ग': 'ं', 'घ': 'ं',
          'च': 'ं', 'छ': 'ं', 'ज': 'ं', 'झ': 'ं',
          'ट': 'ं', 'ठ': 'ं', 'ड': 'ं', 'ढ': 'ं',
          'त': 'ं', 'थ': 'ं', 'द': 'ं', 'ध': 'ं',
          'प': 'ं', 'फ': 'ं', 'ब': 'ं', 'भ': 'ं',
        };
        if (nasalGroups[nextConsonant.consonant]) {
          result += 'ं';
          i += 1;
          lastWasConsonant = false;
          continue;
        }
      }
    }
    
    // Try consonant match
    const consonantMatch = matchConsonant(word, i);
    if (consonantMatch) {
      i += consonantMatch.match.length;
      
      // Check for following vowel (matra)
      const vowelMatch = matchVowel(word, i);
      if (vowelMatch) {
        result += consonantMatch.consonant + MATRAS[vowelMatch.vowel];
        i += vowelMatch.match.length;
      } else {
        // Check if next character is also a consonant (need halant)
        const nextConsonant = matchConsonant(word, i);
        if (nextConsonant && i < word.length) {
          result += consonantMatch.consonant + HALANT;
        } else {
          // Word-final or before non-Hindi char: add inherent 'a'
          result += consonantMatch.consonant;
        }
      }
      lastWasConsonant = true;
      continue;
    }
    
    // Try vowel match (independent form)
    const vowelMatch = matchVowel(word, i);
    if (vowelMatch) {
      if (lastWasConsonant) {
        result += MATRAS[vowelMatch.vowel];
      } else {
        result += VOWELS[vowelMatch.vowel];
      }
      i += vowelMatch.match.length;
      lastWasConsonant = false;
      continue;
    }
    
    // Handle digits
    const digitMap: Record<string, string> = {
      '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
      '5': '५', '6': '६', '7': '७', '8': '८', '9': '९',
    };
    if (digitMap[word[i]]) {
      result += digitMap[word[i]];
      i++;
      lastWasConsonant = false;
      continue;
    }
    
    // Pass through unrecognized characters
    result += word[i];
    i++;
    lastWasConsonant = false;
  }
  
  return result;
}
