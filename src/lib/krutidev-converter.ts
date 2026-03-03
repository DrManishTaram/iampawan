/**
 * Unicode Hindi → Kruti Dev 010 Converter
 * 
 * Complete character mapping system with:
 * - Pre-base matra (ि) positioning
 * - Reph (र्) handling
 * - Half characters
 * - Conjunct letters
 * - Deterministic, pure text conversion (no CSS font switching)
 */

// Unicode consonants to Kruti Dev (with inherent 'a' vowel)
const CONSONANT_MAP: Record<string, string> = {
  'क': 'd',
  'ख': '[k',
  'ग': 'x',
  'घ': '?k',
  'ङ': '³',
  'च': 'p',
  'छ': 'N',
  'ज': 't',
  'झ': '÷',
  'ञ': '×',
  'ट': 'V',
  'ठ': 'B',
  'ड': 'M',
  'ढ': '<',
  'ण': '.k',
  'त': 'r',
  'थ': 'Fk',
  'द': 'n',
  'ध': '/k',
  'न': 'u',
  'प': 'i',
  'फ': 'Q',
  'ब': 'c',
  'भ': 'Hk',
  'म': 'e',
  'य': ';',
  'र': 'j',
  'ल': 'y',
  'ळ': 'G',
  'व': 'o',
  'श': "\u2018k",
  'ष': "\u201Ck",
  'स': 'l',
  'ह': 'g',
};

// Half consonants (consonant + halant)
const HALF_CONSONANT_MAP: Record<string, string> = {
  'क': 'D',
  'ख': '[',
  'ग': 'X',
  'घ': '?',
  'च': 'P',
  'छ': 'PN',
  'ज': 'T',
  'झ': '÷~',
  'ट': 'ê',
  'ठ': 'ë',
  'ड': 'ì',
  'ढ': '<~',
  'ण': '.k~',
  'त': 'R',
  'थ': 'F',
  'द': 'í',
  'ध': 'è',
  'न': 'U',
  'प': 'I',
  'फ': '¶',
  'ब': 'C',
  'भ': 'H',
  'म': 'E',
  'य': '¸',
  'र': 'Z',  // This is reph - special handling needed
  'ल': 'Y',
  'ळ': 'G~',
  'व': 'O',
  'श': '\'',
  'ष': '"',
  'स': 'L',
  'ह': 'à',
};

// Vowel matras
const MATRA_MAP: Record<string, string> = {
  'ा': 'k',     // aa matra
  'ि': 'f',     // i matra (pre-base - needs repositioning)
  'ी': 'h',     // ii matra
  'ु': 'q',     // u matra
  'ू': 'w',     // uu matra
  'े': 's',     // e matra
  'ै': 'S',     // ai matra
  'ो': 'ks',    // o matra
  'ौ': 'kS',    // au matra
  'ृ': '`',     // ri matra
};

// Independent vowels
const VOWEL_MAP: Record<string, string> = {
  'अ': 'v',
  'आ': 'vk',
  'इ': 'b',
  'ई': 'bZ',
  'उ': 'm',
  'ऊ': 'Å',
  'ऋ': '_',
  'ए': ',',
  'ऐ': ',S',
  'ओ': 'vks',
  'औ': 'vkS',
};

// Special characters
const SPECIAL_MAP: Record<string, string> = {
  'ं': 'a',     // anusvara
  'ः': '%',     // visarga
  'ँ': 'aW',    // chandrabindu
  '्': '~',     // halant (visible)
  '।': 'A',     // purna viram
  '॥': 'AA',    // double viram
  'ॐ': '¬',     // Om
};

// Number mapping
const NUMBER_MAP: Record<string, string> = {
  '०': '0',
  '१': '1',
  '२': '2',
  '३': '3',
  '४': '4',
  '५': '5',
  '६': '6',
  '७': '7',
  '८': '8',
  '९': '9',
};

// Known conjuncts (special combined forms)
const CONJUNCT_MAP: Record<string, string> = {
  'क्ष': '{k',
  'त्र': '=k',
  'ज्ञ': 'K',
  'श्र': 'Jk',
  'द्ध': 'ì/k',
  'द्व': 'ío',
  'द्य': 'í;',
  'ट्ट': 'ê~V',
  'ट्ठ': 'ê~B',
  'द्द': 'ín',
  'ह्न': 'àu',
  'ह्म': 'àe',
  'ह्य': 'à;',
  'ह्र': 'àz',
  'ह्ल': 'ày',
  'ह्व': 'ào',
};

/**
 * Check if character is a Devanagari consonant
 */
function isConsonant(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return code >= 0x0915 && code <= 0x0939; // क to ह
}

/**
 * Check if character is a Devanagari vowel sign (matra)
 */
function isMatra(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return code >= 0x093E && code <= 0x094C; // ा to ौ
}

/**
 * Check if character is halant (virama)
 */
function isHalant(ch: string): boolean {
  return ch === '्'; // U+094D
}

/**
 * Check if character is a Devanagari independent vowel
 */
function isVowel(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return code >= 0x0905 && code <= 0x0914; // अ to औ
}

/**
 * Convert Unicode Hindi text to Kruti Dev 010 encoded text
 */
export function unicodeToKrutiDev(input: string): string {
  if (!input) return '';
  
  let result = '';
  const chars = Array.from(input);
  let i = 0;
  
  while (i < chars.length) {
    const ch = chars[i];
    
    // Check for conjuncts (consonant + halant + consonant sequences)
    if (isConsonant(ch) && i + 2 < chars.length && isHalant(chars[i + 1]) && isConsonant(chars[i + 2])) {
      const conjunct = ch + chars[i + 2];
      
      // Check for known conjuncts
      if (CONJUNCT_MAP[conjunct]) {
        // Check if there's a matra after the conjunct
        if (i + 3 < chars.length && isMatra(chars[i + 3])) {
          const matra = chars[i + 3];
          const krutiConj = CONJUNCT_MAP[conjunct];
          
          if (matra === 'ि') {
            // Pre-base matra: place 'f' before the conjunct
            result += 'f' + krutiConj;
          } else {
            // Remove trailing 'k' if matra adds its own
            const base = krutiConj.endsWith('k') ? krutiConj.slice(0, -1) : krutiConj;
            result += base + (MATRA_MAP[matra] || '');
          }
          i += 4;
        } else {
          result += CONJUNCT_MAP[conjunct];
          i += 3;
        }
        continue;
      }
      
      // Check for reph (र् + consonant)
      if (ch === 'र') {
        // Reph: process the base consonant first, then add reph marker
        // In Kruti Dev, reph (Z) goes after the base consonant and its matra
        const baseConsonant = chars[i + 2];
        let baseKruti = '';
        let advance = 3;
        
        // Check if base consonant also has halant + consonant
        if (i + 4 < chars.length && isHalant(chars[i + 3]) && isConsonant(chars[i + 4])) {
          const innerConj = baseConsonant + chars[i + 4];
          if (CONJUNCT_MAP[innerConj]) {
            baseKruti = CONJUNCT_MAP[innerConj];
            advance = 5;
          } else {
            baseKruti = (HALF_CONSONANT_MAP[baseConsonant] || '') + (CONSONANT_MAP[chars[i + 4]] || '');
            advance = 5;
          }
        } else {
          baseKruti = CONSONANT_MAP[baseConsonant] || baseConsonant;
          advance = 3;
        }
        
        // Check for matra after the cluster
        if (i + advance < chars.length && isMatra(chars[i + advance])) {
          const matra = chars[i + advance];
          if (matra === 'ि') {
            result += 'f' + baseKruti + 'Z';
          } else {
            const base = baseKruti.endsWith('k') ? baseKruti.slice(0, -1) : baseKruti;
            result += base + (MATRA_MAP[matra] || '') + 'Z';
          }
          advance++;
        } else {
          result += baseKruti + 'Z';
        }
        
        // Check for anusvara/visarga after
        if (i + advance < chars.length && (chars[i + advance] === 'ं' || chars[i + advance] === 'ः' || chars[i + advance] === 'ँ')) {
          result += SPECIAL_MAP[chars[i + advance]] || '';
          advance++;
        }
        
        i += advance;
        continue;
      }
      
      // Generic half consonant + consonant
      const halfForm = HALF_CONSONANT_MAP[ch] || (CONSONANT_MAP[ch] || ch) + '~';
      const nextCh = chars[i + 2];
      
      // Check for further conjuncts
      if (i + 3 < chars.length && isHalant(chars[i + 3]) && i + 4 < chars.length && isConsonant(chars[i + 4])) {
        // Triple consonant cluster
        const half2 = HALF_CONSONANT_MAP[nextCh] || (CONSONANT_MAP[nextCh] || nextCh) + '~';
        const finalCh = chars[i + 4];
        let finalKruti = CONSONANT_MAP[finalCh] || finalCh;
        let advance = 5;
        
        if (i + advance < chars.length && isMatra(chars[i + advance])) {
          const matra = chars[i + advance];
          if (matra === 'ि') {
            result += 'f' + halfForm + half2 + finalKruti;
          } else {
            const base = finalKruti.endsWith('k') ? finalKruti.slice(0, -1) : finalKruti;
            result += halfForm + half2 + base + (MATRA_MAP[matra] || '');
          }
          advance++;
        } else {
          result += halfForm + half2 + finalKruti;
        }
        i += advance;
        continue;
      }
      
      let nextKruti = CONSONANT_MAP[nextCh] || nextCh;
      let advance = 3;
      
      // Check for matra on the final consonant
      if (i + 3 < chars.length && isMatra(chars[i + 3])) {
        const matra = chars[i + 3];
        if (matra === 'ि') {
          result += 'f' + halfForm + nextKruti;
        } else {
          const base = nextKruti.endsWith('k') ? nextKruti.slice(0, -1) : nextKruti;
          result += halfForm + base + (MATRA_MAP[matra] || '');
        }
        advance = 4;
      } else {
        result += halfForm + nextKruti;
      }
      
      // Check for anusvara/visarga
      if (i + advance < chars.length && (chars[i + advance] === 'ं' || chars[i + advance] === 'ः' || chars[i + advance] === 'ँ')) {
        result += SPECIAL_MAP[chars[i + advance]] || '';
        advance++;
      }
      
      i += advance;
      continue;
    }
    
    // Single consonant
    if (isConsonant(ch)) {
      let krutiCh = CONSONANT_MAP[ch] || ch;
      let advance = 1;
      
      // Check for matra
      if (i + 1 < chars.length && isMatra(chars[i + 1])) {
        const matra = chars[i + 1];
        if (matra === 'ि') {
          // Pre-base matra: 'f' goes before consonant
          result += 'f' + krutiCh;
        } else {
          // Other matras: remove trailing 'k' from consonant if matra provides it
          const base = krutiCh.endsWith('k') ? krutiCh.slice(0, -1) : krutiCh;
          result += base + (MATRA_MAP[matra] || '');
        }
        advance = 2;
      } else if (i + 1 < chars.length && isHalant(chars[i + 1]) && (i + 2 >= chars.length || !isConsonant(chars[i + 2]))) {
        // Visible halant (no following consonant)
        result += krutiCh + '~';
        advance = 2;
      } else {
        result += krutiCh;
      }
      
      // Check for anusvara/visarga/chandrabindu
      if (i + advance < chars.length && (chars[i + advance] === 'ं' || chars[i + advance] === 'ः' || chars[i + advance] === 'ँ')) {
        result += SPECIAL_MAP[chars[i + advance]] || '';
        advance++;
      }
      
      i += advance;
      continue;
    }
    
    // Independent vowels
    if (isVowel(ch)) {
      result += VOWEL_MAP[ch] || ch;
      
      // Check for anusvara/visarga after vowel
      if (i + 1 < chars.length && (chars[i + 1] === 'ं' || chars[i + 1] === 'ः' || chars[i + 1] === 'ँ')) {
        result += SPECIAL_MAP[chars[i + 1]] || '';
        i += 2;
      } else {
        i++;
      }
      continue;
    }
    
    // Special characters
    if (SPECIAL_MAP[ch]) {
      result += SPECIAL_MAP[ch];
      i++;
      continue;
    }
    
    // Numbers
    if (NUMBER_MAP[ch]) {
      result += NUMBER_MAP[ch];
      i++;
      continue;
    }
    
    // Pass through everything else (spaces, punctuation, Latin chars)
    result += ch;
    i++;
  }
  
  return result;
}
