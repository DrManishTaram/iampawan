/**
 * Hinglish → Unicode Hindi Transliteration Engine v3
 * 
 * Designed for natural Hinglish typing (NOT strict ITRANS).
 * Key design decisions:
 *   - No auto-halant: consecutive consonants = separate syllables with inherent 'a'
 *   - Conjuncts only via explicit multi-char mappings or word overrides
 *   - Single 'a' = inherent schwa (no matra), use 'aa' for ा
 *   - Extensive word overrides for natural Hinglish output
 *   - Use '_' between consonants to force halant/conjunct (e.g., "k_ya" → क्या)
 */

const HALANT = '\u094D'; // ्

// ── Consonant mappings ──────────────────────────────────────────────────
const CONSONANTS: Record<string, string> = {
  // Explicit conjuncts (3+ chars)
  'ksh': 'क्ष',
  'cch': 'च्छ',
  'chh': 'छ',
  'shr': 'श्र',
  'gya': 'ज्ञ',
  'gny': 'ज्ञ',
  'dny': 'ज्ञ',
  'nch': 'ञ्च',
  'ngh': 'ङ्घ',
  'nth': 'न्थ',
  'ndh': 'न्ध',
  'mbh': 'म्भ',
  'nkh': 'ङ्ख',
  'khy': 'ख्य',
  'dry': 'द्र्य',
  'dhy': 'ध्य',
  'bhy': 'भ्य',
  'shy': 'श्य',
  'shw': 'श्व',

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
const VOWELS_INDEPENDENT: Record<string, string> = {
  'aa': 'आ', 'AA': 'आ',
  'ii': 'ई', 'ee': 'ई',
  'uu': 'ऊ', 'oo': 'ऊ',
  'ai': 'ऐ', 'ei': 'ऐ',
  'au': 'औ', 'ou': 'औ',
  'ri': 'ऋ', 'Ri': 'ऋ',
  'a': 'अ',
  'i': 'इ',
  'u': 'उ',
  'e': 'ए',
  'o': 'ओ',
};

const MATRAS: Record<string, string> = {
  'aa': 'ा', 'AA': 'ा',
  'ii': 'ी', 'ee': 'ी',
  'uu': 'ू', 'oo': 'ू',
  'ai': 'ै', 'ei': 'ै',
  'au': 'ौ', 'ou': 'ौ',
  'ri': 'ृ', 'Ri': 'ृ',
  'a': '',   // inherent schwa
  'i': 'ि',
  'u': 'ु',
  'e': 'े',
  'o': 'ो',
};

const VOWEL_KEYS = Object.keys(VOWELS_INDEPENDENT).sort((a, b) => b.length - a.length);
const CONSONANT_KEYS = Object.keys(CONSONANTS).sort((a, b) => b.length - a.length);
const CASE_SENSITIVE_PREFIXES = new Set(['T', 'D', 'N', 'S', 'R', 'L', 'A']);

const DIGIT_MAP: Record<string, string> = {
  '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
  '5': '५', '6': '६', '7': '७', '8': '८', '9': '९',
};

// ── Matching functions ──────────────────────────────────────────────────

function matchConsonant(text: string, pos: number): { devanagari: string; len: number } | null {
  for (const key of CONSONANT_KEYS) {
    if (pos + key.length > text.length) continue;
    const slice = text.substring(pos, pos + key.length);
    if (CASE_SENSITIVE_PREFIXES.has(key[0])) {
      if (slice === key) return { devanagari: CONSONANTS[key], len: key.length };
    } else {
      if (slice.toLowerCase() === key.toLowerCase()) {
        const upperKey = slice[0].toUpperCase() + slice.substring(1);
        if (slice[0] === slice[0].toUpperCase() && slice[0] !== slice[0].toLowerCase() && CONSONANTS[upperKey]) {
          continue;
        }
        return { devanagari: CONSONANTS[key], len: key.length };
      }
    }
  }
  return null;
}

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

// ── Word overrides (comprehensive Hinglish dictionary) ──────────────────

const WORD_OVERRIDES: Record<string, string> = {
  // ── Pronouns & particles ──
  'mai': 'मैं', 'main': 'मैं', 'mein': 'में', 'me': 'में',
  'hum': 'हम', 'humne': 'हमने', 'humko': 'हमको', 'humse': 'हमसे',
  'tum': 'तुम', 'tumne': 'तुमने', 'tumko': 'तुमको', 'tumse': 'तुमसे', 'tumhara': 'तुम्हारा', 'tumhari': 'तुम्हारी', 'tumhare': 'तुम्हारे',
  'aap': 'आप', 'aapka': 'आपका', 'aapki': 'आपकी', 'aapke': 'आपके', 'aapko': 'आपको', 'aapse': 'आपसे', 'aapne': 'आपने',
  'woh': 'वह', 'wo': 'वो', 'wahan': 'वहाँ', 'wahin': 'वहीं',
  'yeh': 'यह', 'ye': 'ये', 'yahan': 'यहाँ', 'yahin': 'यहीं',
  'jo': 'जो',
  'koi': 'कोई', 'kuch': 'कुछ', 'sab': 'सब', 'sabhi': 'सभी',
  'apna': 'अपना', 'apni': 'अपनी', 'apne': 'अपने',
  'is': 'इस', 'iska': 'इसका', 'iski': 'इसकी', 'iske': 'इसके', 'isko': 'इसको', 'isse': 'इससे', 'isne': 'इसने', 'isliye': 'इसलिए',
  'us': 'उस', 'uska': 'उसका', 'uski': 'उसकी', 'uske': 'उसके', 'usko': 'उसको', 'usse': 'उससे', 'usne': 'उसने',
  'mera': 'मेरा', 'meri': 'मेरी', 'mere': 'मेरे',
  'tera': 'तेरा', 'teri': 'तेरी', 'tere': 'तेरे',
  'hamara': 'हमारा', 'hamari': 'हमारी', 'hamare': 'हमारे',
  'unka': 'उनका', 'unki': 'उनकी', 'unke': 'उनके', 'unko': 'उनको',
  'inka': 'इनका', 'inki': 'इनकी', 'inke': 'इनके',
  'ka': 'का', 'ki': 'की', 'ke': 'के', 'ko': 'को', 'se': 'से',
  'par': 'पर', 'per': 'पर', 'pe': 'पे',
  'aur': 'और', 'or': 'और',
  'ya': 'या', 'na': 'ना', 'to': 'तो', 'so': 'सो',
  'bhi': 'भी', 'hi': 'ही', 'he': 'हे',
  'agar': 'अगर', 'lekin': 'लेकिन', 'magar': 'मगर', 'parantu': 'परन्तु', 'kintu': 'किन्तु',
  'jab': 'जब', 'tab': 'तब', 'ab': 'अब', 'kabhi': 'कभी', 'abhi': 'अभी',
  'jaise': 'जैसे', 'waise': 'वैसे', 'kaise': 'कैसे', 'aise': 'ऐसे',
  'jaisa': 'जैसा', 'waisa': 'वैसा', 'kaisa': 'कैसा', 'aisa': 'ऐसा',
  'jaisi': 'जैसी', 'waisi': 'वैसी', 'kaisi': 'कैसी', 'aisi': 'ऐसी',
  'jahan': 'जहाँ', 'kahan': 'कहाँ',
  'idhar': 'इधर', 'udhar': 'उधर', 'kidhar': 'किधर',
  'sirf': 'सिर्फ़', 'bas': 'बस', 'bahut': 'बहुत', 'zyada': 'ज़्यादा', 'kam': 'कम',
  'phir': 'फिर', 'fir': 'फिर',

  // ── Verbs & auxiliaries ──
  'hai': 'है', 'hain': 'हैं', 'ho': 'हो',
  'tha': 'था', 'thi': 'थी', 'the': 'थे', 'thin': 'थीं',
  'hoga': 'होगा', 'hogi': 'होगी', 'honge': 'होंगे', 'hoge': 'होगे',
  'hu': 'हूँ', 'hoo': 'हूँ', 'hun': 'हूँ', 'houn': 'हूँ',
  'karo': 'करो', 'karta': 'करता', 'karti': 'करती', 'karte': 'करते',
  'kiya': 'किया', 'kiye': 'किये', 'karna': 'करना', 'karke': 'करके',
  'karega': 'करेगा', 'karegi': 'करेगी', 'karenge': 'करेंगे',
  'hona': 'होना', 'hota': 'होता', 'hoti': 'होती', 'hote': 'होते',
  'jana': 'जाना', 'jata': 'जाता', 'jati': 'जाती', 'jate': 'जाते',
  'jaata': 'जाता', 'jaati': 'जाती', 'jaate': 'जाते',
  'jao': 'जाओ', 'jaa': 'जा', 'ja': 'जा',
  'aana': 'आना', 'aata': 'आता', 'aati': 'आती', 'aate': 'आते',
  'aao': 'आओ', 'aa': 'आ',
  'dena': 'देना', 'deta': 'देता', 'deti': 'देती', 'dete': 'देते',
  'do': 'दो', 'de': 'दे', 'diya': 'दिया',
  'lena': 'लेना', 'leta': 'लेता', 'leti': 'लेती', 'lete': 'लेते',
  'lo': 'लो', 'le': 'ले', 'liya': 'लिया',
  'bolna': 'बोलना', 'bolo': 'बोलो', 'bola': 'बोला', 'boli': 'बोली',
  'likhna': 'लिखना', 'likho': 'लिखो', 'likha': 'लिखा', 'likhi': 'लिखी',
  'padhna': 'पढ़ना', 'padho': 'पढ़ो', 'padha': 'पढ़ा', 'padhi': 'पढ़ी',
  'dekhna': 'देखना', 'dekho': 'देखो', 'dekha': 'देखा', 'dekhi': 'देखी',
  'sunna': 'सुनना', 'suno': 'सुनो', 'suna': 'सुना', 'suni': 'सुनी',
  'samajhna': 'समझना', 'samjho': 'समझो', 'samjha': 'समझा',
  'rakhna': 'रखना', 'rakho': 'रखो', 'rakha': 'रखा',
  'milna': 'मिलना', 'mila': 'मिला', 'mili': 'मिली', 'mile': 'मिले',
  'chalna': 'चलना', 'chalo': 'चलो', 'chala': 'चला', 'chali': 'चली',
  'khana': 'खाना', 'khao': 'खाओ', 'khaya': 'खाया',
  'peena': 'पीना', 'piyo': 'पियो', 'piya': 'पिया',
  'sochna': 'सोचना', 'socho': 'सोचो', 'socha': 'सोचा',
  'chahna': 'चाहना', 'chahta': 'चाहता', 'chahti': 'चाहती', 'chahte': 'चाहते', 'chahiye': 'चाहिए',
  'sakna': 'सकना', 'sakta': 'सकता', 'sakti': 'सकती', 'sakte': 'सकते', 'saka': 'सका', 'sake': 'सके',
  'pana': 'पाना', 'pata': 'पाता', 'pati': 'पाती', 'paye': 'पाये',
  'rehna': 'रहना', 'rehta': 'रहता', 'rehti': 'रहती', 'rehte': 'रहते', 'raha': 'रहा', 'rahi': 'रही', 'rahe': 'रहे',
  'kar': 'कर', 'sakta': 'सकता',
  'madad': 'मदद',
  'batana': 'बताना', 'batao': 'बताओ', 'bataya': 'बताया',
  'bhejana': 'भेजना', 'bhejo': 'भेजो', 'bheja': 'भेजा',

  // ── Interrogatives ──
  'kya': 'क्या', 'kaun': 'कौन', 'kab': 'कब', 'kyun': 'क्यूँ', 'kyon': 'क्यों', 'kyunki': 'क्योंकि',
  'kitna': 'कितना', 'kitni': 'कितनी', 'kitne': 'कितने',
  'konsa': 'कौनसा', 'konsi': 'कौनसी',

  // ── Negation ──
  'nahi': 'नहीं', 'nahin': 'नहीं', 'nhi': 'नहीं', 'mat': 'मत',

  // ── Greetings ──
  'namaste': 'नमस्ते', 'namaskar': 'नमस्कार',
  'dhanyavad': 'धन्यवाद', 'dhanyavaad': 'धन्यवाद', 'shukriya': 'शुक्रिया',
  'alvida': 'अलविदा', 'swagat': 'स्वागत',

  // ── Common nouns ──
  'paani': 'पानी', 'pani': 'पानी',
  'kaam': 'काम', 'naam': 'नाम', 'ghar': 'घर', 'desh': 'देश',
  'log': 'लोग', 'din': 'दिन', 'raat': 'रात', 'samay': 'समय',
  'jagah': 'जगह', 'tarah': 'तरह', 'baat': 'बात', 'cheez': 'चीज़',
  'kaam': 'काम', 'dost': 'दोस्त', 'zindagi': 'ज़िन्दगी', 'duniya': 'दुनिया',
  'aadmi': 'आदमी', 'aurat': 'औरत', 'baccha': 'बच्चा', 'bachcha': 'बच्चा',
  'ladka': 'लड़का', 'ladki': 'लड़की',
  'shahar': 'शहर', 'gaon': 'गाँव', 'gaav': 'गाँव',
  'school': 'स्कूल', 'college': 'कॉलेज',
  'paisa': 'पैसा', 'paise': 'पैसे', 'rupaye': 'रुपये', 'rupay': 'रुपय',
  'saal': 'साल', 'mahina': 'महीना', 'hafta': 'हफ़्ता',
  'subah': 'सुबह', 'dopahar': 'दोपहर', 'shaam': 'शाम',

  // ── Government / official terms ──
  'sarkaar': 'सरकार', 'sarkar': 'सरकार',
  'mantri': 'मंत्री', 'mantralaya': 'मंत्रालय',
  'vibhag': 'विभाग', 'niyam': 'नियम',
  'aadesh': 'आदेश', 'adesh': 'आदेश',
  'patra': 'पत्र', 'patrachar': 'पत्राचार',
  'prashasan': 'प्रशासन',
  'vishwavidyalaya': 'विश्वविद्यालय', 'vidyalaya': 'विद्यालय',
  'adhyaksh': 'अध्यक्ष', 'sachiv': 'सचिव',
  'karyalay': 'कार्यालय', 'karyalaya': 'कार्यालय',
  'karya': 'कार्य', 'yojana': 'योजना',
  'niti': 'नीति', 'neeti': 'नीति',
  'seva': 'सेवा', 'adhikari': 'अधिकारी', 'adhikaari': 'अधिकारी',
  'sthaan': 'स्थान', 'sthan': 'स्थान',
  'vishesh': 'विशेष', 'sthiti': 'स्थिति',
  'prakriya': 'प्रक्रिया', 'vyavastha': 'व्यवस्था',
  'suraksha': 'सुरक्षा', 'swasthya': 'स्वास्थ्य',
  'shiksha': 'शिक्षा', 'vidya': 'विद्या',
  'gyan': 'ज्ञान', 'gyaan': 'ज्ञान', 'vigyan': 'विज्ञान',
  'kshetra': 'क्षेत्र', 'kshatriya': 'क्षत्रिय',
  'rashtra': 'राष्ट्र', 'raashtra': 'राष्ट्र',
  'bharat': 'भारत', 'bharatiya': 'भारतीय',
  'pradesh': 'प्रदेश', 'madhya': 'मध्य',
  'rajya': 'राज्य', 'shasan': 'शासन', 'shaasan': 'शासन',
  'shasakiy': 'शासकीय', 'shasakiya': 'शासकीय',
  'hindi': 'हिन्दी', 'roopantar': 'रूपांतर', 'roopantarak': 'रूपांतरक',
  'kripaya': 'कृपया', 'kripya': 'कृपया',
  'punah': 'पुनः',
  'anuvaad': 'अनुवाद', 'anuvad': 'अनुवाद',
  'nirdesh': 'निर्देश', 'suchna': 'सूचना', 'soochna': 'सूचना',
  'anumati': 'अनुमति', 'prativedan': 'प्रतिवेदन',
  'sthapana': 'स्थापना', 'niyukti': 'नियुक्ति',
  'prastavna': 'प्रस्तावना', 'nirdeshak': 'निर्देशक',
  'mahasachiv': 'महासचिव', 'upadhyaksh': 'उपाध्यक्ष',
  'kulpati': 'कुलपति', 'kulgeet': 'कुलगीत',
  'pariksha': 'परीक्षा', 'parikshaफल': 'परीक्षाफल',
  'pramanpatra': 'प्रमाणपत्र', 'praman': 'प्रमाण',
  'sanshodhan': 'संशोधन', 'sanshodh': 'संशोध',

  // ── Titles / honorifics ──
  'shri': 'श्री', 'shree': 'श्री', 'smt': 'श्रीमती',
  'ji': 'जी', 'sahab': 'साहब', 'sahib': 'साहिब',
  'mahoday': 'महोदय', 'mahodaya': 'महोदया',
  'maananeeya': 'माननीया', 'maananiy': 'माननीय',

  // ── Common names ──
  'manish': 'मनीष', 'rajesh': 'राजेश', 'suresh': 'सुरेश',
  'ramesh': 'रमेश', 'dinesh': 'दिनेश', 'ganesh': 'गणेश',
  'mahesh': 'महेश', 'mukesh': 'मुकेश', 'rakesh': 'राकेश',
  'naresh': 'नरेश', 'yogesh': 'योगेश', 'lokesh': 'लोकेश',
  'kamlesh': 'कमलेश', 'hitesh': 'हितेश', 'ritesh': 'रितेश',
  'nitesh': 'नितेश', 'rupesh': 'रूपेश',
  'amit': 'अमित', 'sumit': 'सुमित', 'rohit': 'रोहित',
  'mohit': 'मोहित', 'ankit': 'अंकित', 'vinod': 'विनोद',
  'pramod': 'प्रमोद', 'arvind': 'अरविंद',
  'anil': 'अनिल', 'sunil': 'सुनील', 'rahul': 'राहुल',
  'krishna': 'कृष्णा', 'krishn': 'कृष्ण',
  'ram': 'राम', 'shyam': 'श्याम', 'mohan': 'मोहन', 'sohan': 'सोहन',
  'sita': 'सीता', 'geeta': 'गीता', 'sunita': 'सुनीता',
  'anita': 'अनिता', 'priya': 'प्रिया', 'pooja': 'पूजा', 'puja': 'पूजा',

  // ── Numbers ──
  'ek': 'एक', 'do': 'दो', 'teen': 'तीन', 'char': 'चार',
  'paanch': 'पाँच', 'panch': 'पाँच',
  'cheh': 'छह', 'saat': 'सात', 'aath': 'आठ', 'nau': 'नौ', 'das': 'दस',

  // ── Adjectives ──
  'accha': 'अच्छा', 'achcha': 'अच्छा', 'acha': 'अच्छा',
  'bura': 'बुरा', 'bada': 'बड़ा', 'chhota': 'छोटा', 'chota': 'छोटा',
  'naya': 'नया', 'purana': 'पुराना', 'sundar': 'सुंदर', 'sunder': 'सुंदर',
  'mushkil': 'मुश्किल', 'aasan': 'आसान',
  'zaruri': 'ज़रूरी', 'jaruri': 'ज़रूरी', 'zaroori': 'ज़रूरी',

  // ── Misc common ──
  'dhanyawad': 'धन्यवाद',
  'pranam': 'प्रणाम', 'pranaam': 'प्रणाम',
  'sampark': 'संपर्क', 'vishwas': 'विश्वास',
  'samasya': 'समस्या', 'samadhan': 'समाधान',
  'sahayata': 'सहायता', 'sahyog': 'सहयोग',
  'upayog': 'उपयोग', 'prayog': 'प्रयोग',
  'prayaas': 'प्रयास', 'prayas': 'प्रयास',
  'safal': 'सफल', 'vifal': 'विफल', 'safalta': 'सफलता',
  'istemal': 'इस्तेमाल', 'istemaal': 'इस्तेमाल',
};

// ── Main API ────────────────────────────────────────────────────────────

export function transliterateToHindi(input: string): string {
  if (!input) return '';
  const tokens = input.split(/(\s+|[,;:!?\-()'"\.]+)/);
  return tokens.map(token => {
    if (/^\s+$/.test(token)) return token;
    if (/^[,;:!?\-()'"]+$/.test(token)) return token;
    if (token === '.') return '।';
    if (token === '..') return '॥';
    const lower = token.toLowerCase();
    if (WORD_OVERRIDES[lower]) return WORD_OVERRIDES[lower];
    return transliterateWord(token);
  }).join('');
}

/**
 * Transliterate a single word character by character.
 * 
 * KEY RULE: No auto-halant between consonants.
 * In Hinglish, "aapki" means आपकी not आप्की.
 * Conjuncts are ONLY created via explicit multi-char consonant mappings.
 * Use '_' to force halant: "k_ya" → क्या
 */
function transliterateWord(word: string): string {
  let result = '';
  let i = 0;

  while (i < word.length) {
    // ── Force-halant with underscore: C_C → C + halant + C ──
    // (allows explicit conjunct creation)

    // ── Anusvara / Chandrabindu / Visarga markers ──
    if (word[i] === 'M' && !matchConsonant(word, i)) {
      result += 'ं'; i++; continue;
    }
    if (word[i] === '~' && word[i + 1] === 'n') {
      result += 'ँ'; i += 2; continue;
    }
    if (word[i] === 'H' && !matchConsonant(word, i)) {
      result += 'ः'; i++; continue;
    }

    // ── Try consonant ───────────────────────────────────────────────
    const cm = matchConsonant(word, i);
    if (cm) {
      i += cm.len;

      // Check for '_' force-halant marker
      if (i < word.length && word[i] === '_') {
        result += cm.devanagari + HALANT;
        i++; // skip '_'
        continue;
      }

      // Look ahead for a vowel (matra)
      const vm = matchVowel(word, i);
      if (vm) {
        result += cm.devanagari + MATRAS[vm.key];
        i += vm.len;
        continue;
      }

      // No vowel follows → consonant with inherent 'a' (NO halant!)
      // This is the key difference from strict ITRANS:
      // In Hinglish, "sakta" = स + क + ता, not स्क्ता
      result += cm.devanagari;
      continue;
    }

    // ── Try vowel (independent form) ────────────────────────────────
    const vm = matchVowel(word, i);
    if (vm) {
      result += VOWELS_INDEPENDENT[vm.key];
      i += vm.len;
      continue;
    }

    // ── Digits ──────────────────────────────────────────────────────
    if (DIGIT_MAP[word[i]]) {
      result += DIGIT_MAP[word[i]];
      i++; continue;
    }

    // ── Pass through ────────────────────────────────────────────────
    result += word[i];
    i++;
  }

  return result;
}
