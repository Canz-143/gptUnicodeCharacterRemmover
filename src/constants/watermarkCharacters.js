// Enhanced watermark character detection with comprehensive Unicode support
import unicodeTable from './unicodeTable.json';

// Combine all potential watermark characters
export const WATERMARK_CHARACTERS = {
  ...unicodeTable.controlCharacters,
  ...unicodeTable.watermarkCharacters,
  ...unicodeTable.suspiciousCharacters
};

// Additional commonly used watermark characters not in the JSON
const ADDITIONAL_WATERMARKS = {
  '\u2800': 'BRAILLE PATTERN BLANK',
  '\u3164': 'HANGUL FILLER',
  '\u115F': 'HANGUL CHOSEONG FILLER',
  '\u1160': 'HANGUL JUNGSEONG FILLER',
  '\u17B4': 'KHMER VOWEL INHERENT AQ',
  '\u17B5': 'KHMER VOWEL INHERENT AA',
  '\u180E': 'MONGOLIAN VOWEL SEPARATOR',
  '\u200B': 'ZERO WIDTH SPACE',
  '\u200C': 'ZERO WIDTH NON-JOINER',
  '\u200D': 'ZERO WIDTH JOINER',
  '\u200E': 'LEFT-TO-RIGHT MARK',
  '\u200F': 'RIGHT-TO-LEFT MARK',
  '\u202A': 'LEFT-TO-RIGHT EMBEDDING',
  '\u202B': 'RIGHT-TO-LEFT EMBEDDING',
  '\u202C': 'POP DIRECTIONAL FORMATTING',
  '\u202D': 'LEFT-TO-RIGHT OVERRIDE',
  '\u202E': 'RIGHT-TO-LEFT OVERRIDE',
  '\u202F': 'NARROW NO-BREAK SPACE',
  '\u205F': 'MEDIUM MATHEMATICAL SPACE',
  '\u2060': 'WORD JOINER',
  '\u2061': 'FUNCTION APPLICATION',
  '\u2062': 'INVISIBLE TIMES',
  '\u2063': 'INVISIBLE SEPARATOR',
  '\u2064': 'INVISIBLE PLUS',
  '\u206A': 'INHIBIT SYMMETRIC SWAPPING',
  '\u206B': 'ACTIVATE SYMMETRIC SWAPPING',
  '\u206C': 'INHIBIT ARABIC FORM SHAPING',
  '\u206D': 'ACTIVATE ARABIC FORM SHAPING',
  '\u206E': 'NATIONAL DIGIT SHAPES',
  '\u206F': 'NOMINAL DIGIT SHAPES',
  '\u3000': 'IDEOGRAPHIC SPACE',
  '\uFEFF': 'ZERO WIDTH NO-BREAK SPACE',
  '\u061C': 'ARABIC LETTER MARK',
  '\u034F': 'COMBINING GRAPHEME JOINER'
};

// Merge all watermark characters
Object.assign(WATERMARK_CHARACTERS, ADDITIONAL_WATERMARKS);

// Characters that should be preserved (normal spaces and line breaks)
export const PRESERVE_CHARACTERS = new Set([
  '\u0020', // SPACE
  '\u000A', // LINE FEED
  '\u000D', // CARRIAGE RETURN
  '\u0009'  // TAB
]);

// Get all watermark character codes for quick lookup
export const WATERMARK_CHAR_CODES = Object.keys(WATERMARK_CHARACTERS)
  .filter(char => !PRESERVE_CHARACTERS.has(char))
  .map(char => char.charCodeAt(0));

// Function to check if a character is a watermark
export function isWatermarkCharacter(char) {
  return WATERMARK_CHARACTERS.hasOwnProperty(char) && !PRESERVE_CHARACTERS.has(char);
}

// Function to get character name
export function getCharacterName(char) {
  return WATERMARK_CHARACTERS[char] || `UNKNOWN CHARACTER (U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')})`;
}