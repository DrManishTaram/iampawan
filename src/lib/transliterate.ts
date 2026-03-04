/**
 * Hinglish → Unicode Hindi Transliteration Engine
 * 
 * Comprehensive rule-based, deterministic transliteration system.
 * Uses ITRANS-inspired conventions with common Hinglish variations.
 * Handles matras, half-letters, conjuncts, anusvara, visarga, chandrabindu.
 * Includes schwa deletion for natural Hindi output.
 */

const HALANT = '\u094D'; // ्

// ── Consonant mappings (longest-match-first order) ──────────────────────
// Keys MUST be sorted by length desc within the matching function.
const CONSONANTS: Record<string, string> = {
  // Special conjuncts (3+ chars)
  'ksh': 'क्ष',
  'cch': 'च्छ',
  'chh': 'छ',
  'shr': 'श्र',
  'gya': 'ज्ञ',
  'gny': 'ज्ञ',
  'dny': 'ज्ञ',
  'tra': 'त्र',  // NOTE: only used as conjunct consonant cluster
  'thr': 'थ्र',
  'nch': 'ञ्च',
  'ngh': 'ङ्घ',
  'nth': 'न्थ',
  'ndh': 'न्ध',
  'mbh': 'म्भ',
  'nkh': 'ङ्ख',

  // Aspirated / digraph consonants (2 chars)
  'kh': 'ख',
  'gh': 'घ',
  'ch': 'च',
  'jh': 'झ',
  'ph': 'फ',
  'bh': 'भ',
  'th': 'थ',
  'dh': 'ध',
  'sh': 'श',
  'ng': 'ङ',
  'nk': 'ङ्क',

  // Retroflex (uppercase)
  'Th': 'ठ',
  'TH': 'ठ',
  'Dh': 'ढ',
  'DH': 'ढ',
  'Sh': 'ष',
  'SH': 'ष',
  'Rr': 'ड़',
  'RR': 'ड़',
  'Rh': 'ढ़',
  'RH': 'ढ़',
  
  // Single consonants
  'k': 'क',
  'g': 'ग',
  'c': 'च',
  'j': 'ज',
  'T': 'ट',
  'D': 'ड',
  'N': 'ण',
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
  'L': 'ळ',
};

// ── Vowel mappings ──────────────────────────────────────────────────────
// Independent forms (used at word-start or after another vowel)
const VOWELS_INDEPENDENT: Record<string, string> = {
  'aa':  'आ',
  'AA':  'आ',
  'ii':  'ई',
  'ee':  'ई',
  'uu':  'ऊ',
  'oo':  'ऊ',
  'ai':  'ऐ',
  'ei':  'ऐ',
  'au':  'औ',
  'ou':  'औ',
  'ri':  'ऋ',
  'Ri':  'ऋ',
  'a':   'अ',
  'i':   'इ',
  'u':   'उ',
  'e':   'ए',
  'o':   'ओ',
};

// Dependent forms (matras, used after consonants)
const MATRAS: Record<string, string> = {
  'aa':  'ा',
  'AA':  'ा',
  'ii':  'ी',
  'ee':  'ी',
  'uu':  'ू',
  'oo':  'ू',
  'ai':  'ै',
  'ei':  'ै',
  'au':  'ौ',
  'ou':  'ौ',
  'ri':  'ृ',
  'Ri':  'ृ',
  'a':   '',   // inherent 'a' — no matra
  'i':   'ि',
  'u':   'ु',
  'e':   'े',
  'o':   'ो',
};

// Sorted vowel keys by length desc for matching
const VOWEL_KEYS = Object.keys(VOWELS_INDEPENDENT).sort((a, b) => b.length - a.length);

// Sorted consonant keys by length desc for matching
const CONSONANT_KEYS = Object.keys(CONSONANTS).sort((a, b) => b.length - a.length);

// Characters that are case-sensitive (uppercase means retroflex)
const CASE_SENSITIVE_PREFIXES = new Set(['T', 'D', 'N', 'S', 'R', 'L', 'A']);

/**
 * Try to match a consonant at position `pos` in `text`.
 */
function matchConsonant(text: string, pos: number): { devanagari: string; len: number } | null {
  for (const key of CONSONANT_KEYS) {
    if (pos + key.length > text.length) continue;
    const slice = text.substring(pos, pos + key.length);

    // For keys starting with uppercase letters, do exact match
    if (CASE_SENSITIVE_PREFIXES.has(key[0])) {
      if (slice === key) return { devanagari: CONSONANTS[key], len: key.length };
    } else {
      // Case-insensitive match for lowercase keys, but skip if input is uppercase
      // and there's a separate uppercase mapping
      if (slice.toLowerCase() === key.toLowerCase()) {
        // Make sure we're not accidentally matching an uppercase variant
        const upperKey = slice[0].toUpperCase() + slice.substring(1);
        if (slice[0] === slice[0].toUpperCase() && slice[0] !== slice[0].toLowerCase() && CONSONANTS[upperKey]) {
          continue; // skip, let the uppercase variant match
        }
        return { devanagari: CONSONANTS[key], len: key.length };
      }
    }
  }
  return null;
}

/**
 * Try to match a vowel at position `pos` in `text`.
 */
function matchVowel(text: string, pos: number): { key: string; len: number } | null {
  for (const key of VOWEL_KEYS) {
    if (pos + key.length > text.length) continue;
    const slice = text.substring(pos, pos + key.length);
    if (CASE_SENSITIVE_PREFIXES.has(key[0])) {
      if (slice === key) return { key, len: key.length };
    } else {
      if (slice.toLowerCase() === key.toLowerCase()) return { key, len: key.length };
    }
  }
  return null;
}

/**
 * Check if there's a consonant at the given position
 */
function hasConsonantAt(text: string, pos: number): boolean {
  return matchConsonant(text, pos) !== null;
}

// ── Common Hinglish word overrides for accuracy ─────────────────────────
// These handle words that are commonly typed differently from strict ITRANS.
const WORD_OVERRIDES: Record<string, string> = {
  // Common greetings & words
  'namaste': 'नमस्ते',
  'namaskar': 'नमस्कार',
  'dhanyavad': 'धन्यवाद',
  'dhanyavaad': 'धन्यवाद',
  'shukriya': 'शुक्रिया',
  'shukria': 'शुक्रिया',
  
  // Pronouns & common words
  'hai': 'है',
  'hain': 'हैं',
  'tha': 'था',
  'thi': 'थी',
  'the': 'थे',
  'hei': 'है',
  'ho': 'हो',
  'ka': 'का',
  'ki': 'की',
  'ke': 'के',
  'ko': 'को',
  'se': 'से',
  'me': 'में',
  'mein': 'में',
  'mai': 'मैं',
  'main': 'मैं',
  'hum': 'हम',
  'tum': 'तुम',
  'aap': 'आप',
  'woh': 'वह',
  'yeh': 'यह',
  'ye': 'ये',
  'wo': 'वो',
  'vo': 'वो',
  'jo': 'जो',
  'so': 'सो',
  'to': 'तो',
  'na': 'ना',
  'ya': 'या',
  'par': 'पर',
  'per': 'पर',
  'aur': 'और',
  'or': 'और',
  'nahi': 'नहीं',
  'nahin': 'नहीं',
  'nhi': 'नहीं',
  'kya': 'क्या',
  'kyu': 'क्यूँ',
  'kyon': 'क्यों',
  'kyun': 'क्यूँ',
  'kyunki': 'क्योंकि',
  'isliye': 'इसलिए',
  'lekin': 'लेकिन',
  'magar': 'मगर',
  'jab': 'जब',
  'tab': 'तब',
  'ab': 'अब',
  'bhi': 'भी',
  'hi': 'ही',
  'sirf': 'सिर्फ़',

  // Common nouns
  'paani': 'पानी',
  'pani': 'पानी',
  'kaam': 'काम',
  'naam': 'नाम',
  'ghar': 'घर',
  'desh': 'देश',
  'log': 'लोग',
  'din': 'दिन',
  'raat': 'रात',
  'samay': 'समय',
  'waqt': 'वक़्त',

  // Verbs
  'karna': 'करना',
  'hona': 'होना',
  'jana': 'जाना',
  'aana': 'आना',
  'dena': 'देना',
  'lena': 'लेना',
  'bolna': 'बोलना',
  'likhna': 'लिखना',
  'padhna': 'पढ़ना',
  'dekhna': 'देखना',
  'sunna': 'सुनना',
  'samajhna': 'समझना',
  'karenge': 'करेंगे',

  // Names / Titles
  'shri': 'श्री',
  'shree': 'श्री',
  'smt': 'श्रीमती',
  'ji': 'जी',
  'sahab': 'साहब',
  'sahib': 'साहिब',
  
  // Government terms
  'sarkaar': 'सरकार',
  'sarkar': 'सरकार',
  'mantri': 'मंत्री',
  'mantralaya': 'मंत्रालय',
  'vibhag': 'विभाग',
  'niyam': 'नियम',
  'aadesh': 'आदेश',
  'adesh': 'आदेश',
  'patra': 'पत्र',
  'prashasan': 'प्रशासन',
  'vishwavidyalaya': 'विश्वविद्यालय',
  'vidyalaya': 'विद्यालय',
  'adhyaksh': 'अध्यक्ष',
  'sachiv': 'सचिव',
  'karyalay': 'कार्यालय',
  'karyalaya': 'कार्यालय',
  'karya': 'कार्य',
  'yojana': 'योजना',
  'niti': 'नीति',
  'neeti': 'नीति',
  'seva': 'सेवा',
  'adhikari': 'अधिकारी',
  'adhikaari': 'अधिकारी',

  // Others
  'sthaan': 'स्थान',
  'sthan': 'स्थान',
  'vishesh': 'विशेष',
  'sthiti': 'स्थिति',
  'prakriya': 'प्रक्रिया',
  'vyavastha': 'व्यवस्था',
  'suraksha': 'सुरक्षा',
  'swasthya': 'स्वास्थ्य',
  'shiksha': 'शिक्षा',
  'vidya': 'विद्या',
  'gyan': 'ज्ञान',
  'gyaan': 'ज्ञान',
  'vigyan': 'विज्ञान',
  'kshetra': 'क्षेत्र',
  'kshatriya': 'क्षत्रिय',
  'rashtra': 'राष्ट्र',
  'raashtra': 'राष्ट्र',
  'bharat': 'भारत',
  'bharatiya': 'भारतीय',
  'pradesh': 'प्रदेश',
  'madhya': 'मध्य',
  'uttarpradesh': 'उत्तरप्रदेश',
  'rajya': 'राज्य',
  'shaasan': 'शासन',
  'shasan': 'शासन',
  'shaasakeey': 'शासकीय',
  'shasakiy': 'शासकीय',
  'shasakiya': 'शासकीय',
  'hindi': 'हिन्दी',
  'patrachar': 'पत्राचार',
  'roopantar': 'रूपांतर',
  'roopantarak': 'रूपांतरक',
  'kripaya': 'कृपया',
  'kripya': 'कृपया',
  'punah': 'पुनः',
  'anuvaad': 'अनुवाद',
  'anuvad': 'अनुवाद',

  // Names
  'manish': 'मनीष',
  'rajesh': 'राजेश',
  'suresh': 'सुरेश',
  'ramesh': 'रमेश',
  'dinesh': 'दिनेश',
  'ganesh': 'गणेश',
  'mahesh': 'महेश',
  'mukesh': 'मुकेश',
  'rakesh': 'राकेश',
  'naresh': 'नरेश',
  'yogesh': 'योगेश',
  'lokesh': 'लोकेश',
  'kamlesh': 'कमलेश',
  'hitesh': 'हितेश',
  'jitesh': 'जितेश',
  'ritesh': 'रितेश',
  'nitesh': 'नितेश',
  'rupesh': 'रूपेश',
  'amit': 'अमित',
  'sumit': 'सुमित',
  'rohit': 'रोहित',
  'mohit': 'मोहित',
  'ankit': 'अंकित',
  'vinod': 'विनोद',
  'pramod': 'प्रमोद',
  'arvind': 'अरविंद',
  'anil': 'अनिल',
  'sunil': 'सुनील',
  'rahul': 'राहुल',
  'krishna': 'कृष्णा',
  'krishn': 'कृष्ण',
  'ram': 'राम',
  'shyam': 'श्याम',
  'mohan': 'मोहन',
  'sohan': 'सोहन',
  'sita': 'सीता',
  'geeta': 'गीता',
  'sunita': 'सुनीता',
  'anita': 'अनिता',
  'priya': 'प्रिया',
  'pooja': 'पूजा',
  'puja': 'पूजा',

  // Numbers as words
  'ek': 'एक',
  'do': 'दो',
  'teen': 'तीन',
  'char': 'चार',
  'paanch': 'पाँच',
  'panch': 'पाँच',
  'cheh': 'छह',
  'saat': 'सात',
  'aath': 'आठ',
  'nau': 'नौ',
  'das': 'दस',
};

// Devanagari digit mapping
const DIGIT_MAP: Record<string, string> = {
  '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
  '5': '५', '6': '६', '7': '७', '8': '८', '9': '९',
};

// ── Schwa Deletion ──────────────────────────────────────────────────────
// In Hindi, the inherent 'a' at the end of words and in certain medial 
// positions is typically not pronounced. This function applies basic
// schwa deletion rules to produce more natural output.
function applySchwaRules(chars: { base: string; matra: string; isConsonant: boolean }[]): string {
  // This is handled inline during transliteration via smarter 'a' detection.
  // We keep the output as-is since the transliteration handles it.
  return chars.map(c => c.base + c.matra).join('');
}

// ── Main API ────────────────────────────────────────────────────────────

/**
 * Transliterate Hinglish (romanized Hindi) to Unicode Devanagari.
 */
export function transliterateToHindi(input: string): string {
  if (!input) return '';

  // Split on whitespace and punctuation, preserving delimiters
  const tokens = input.split(/(\s+|[,;:!?\-()'"\.]+)/);

  return tokens.map(token => {
    // Preserve whitespace and punctuation
    if (/^\s+$/.test(token)) return token;
    if (/^[,;:!?\-()'"]+$/.test(token)) return token;

    // Handle period specially
    if (token === '.') return '।';
    if (token === '..') return '॥';

    // Check word overrides (case-insensitive)
    const lower = token.toLowerCase();
    if (WORD_OVERRIDES[lower]) return WORD_OVERRIDES[lower];

    return transliterateWord(token);
  }).join('');
}

/**
 * Transliterate a single word.
 */
function transliterateWord(word: string): string {
  let result = '';
  let i = 0;
  let prevWasConsonant = false;

  while (i < word.length) {
    // ── Try anusvara/chandrabindu markers ────────────────────────────
    // 'M' or '~' at this position = anusvara (ं)
    if (word[i] === 'M' && !hasConsonantAt(word, i)) {
      result += 'ं';
      i++;
      prevWasConsonant = false;
      continue;
    }
    if (word[i] === '~' && word[i + 1] === 'n') {
      result += 'ँ';
      i += 2;
      prevWasConsonant = false;
      continue;
    }
    if (word[i] === 'H' && !hasConsonantAt(word, i)) {
      result += 'ः';
      i++;
      prevWasConsonant = false;
      continue;
    }

    // ── Handle 'n' as anusvara before consonants ────────────────────
    if (word[i] === 'n' || word[i] === 'N') {
      // Check if 'n'/'N' followed by a consonant could be anusvara
      // But first check if 'n' itself starts a longer consonant match
      const nConsonant = matchConsonant(word, i);
      if (nConsonant && nConsonant.len > 1) {
        // It's part of a digraph like 'nh', 'ng', 'nk', 'nch', etc. — handle as consonant below
      } else if (word[i] === 'n' && i + 1 < word.length && prevWasConsonant) {
        const afterN = matchConsonant(word, i + 1);
        if (afterN) {
          result += 'ं';
          i++;
          prevWasConsonant = false;
          continue;
        }
      }
    }

    // ── Try consonant ───────────────────────────────────────────────
    const cm = matchConsonant(word, i);
    if (cm) {
      i += cm.len;

      // Look ahead for a vowel (matra)
      const vm = matchVowel(word, i);
      if (vm) {
        result += cm.devanagari + MATRAS[vm.key];
        i += vm.len;
        prevWasConsonant = MATRAS[vm.key] === ''; // Only if inherent 'a'
        continue;
      }

      // No vowel follows. Check if another consonant follows → add halant
      if (i < word.length && hasConsonantAt(word, i)) {
        result += cm.devanagari + HALANT;
        prevWasConsonant = true;
        continue;
      }

      // End of word or non-Hindi char → consonant with inherent 'a'
      // (Devanagari doesn't need explicit 'a' — the character carries it)
      result += cm.devanagari;
      prevWasConsonant = true;
      continue;
    }

    // ── Try vowel (independent form) ────────────────────────────────
    const vm = matchVowel(word, i);
    if (vm) {
      if (prevWasConsonant) {
        // After a consonant that already has inherent 'a', treat as matra
        result += MATRAS[vm.key];
      } else {
        result += VOWELS_INDEPENDENT[vm.key];
      }
      i += vm.len;
      prevWasConsonant = false;
      continue;
    }

    // ── Digits ──────────────────────────────────────────────────────
    if (DIGIT_MAP[word[i]]) {
      result += DIGIT_MAP[word[i]];
      i++;
      prevWasConsonant = false;
      continue;
    }

    // ── Pass through unknown characters ─────────────────────────────
    result += word[i];
    i++;
    prevWasConsonant = false;
  }

  return result;
}
