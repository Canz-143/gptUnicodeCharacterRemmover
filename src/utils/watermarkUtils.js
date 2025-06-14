// Enhanced utilities for detecting and removing watermarks with comprehensive Unicode support
import { WATERMARK_CHARACTERS, PRESERVE_CHARACTERS, isWatermarkCharacter, getCharacterName } from '../constants/watermarkCharacters';

/**
 * Removes ChatGPT watermark characters from text with enhanced detection
 * @param {string} text - Text to clean
 * @returns {Object} Object containing original text, cleaned text, and detailed statistics
 */
export function removeWatermarks(text) {
  if (!text || typeof text !== 'string') {
    return {
      original: text || '',
      cleaned: text || '',
      stats: {
        originalLength: 0,
        cleanedLength: 0,
        charactersRemoved: 0,
        watermarksDetected: false,
        controlCharactersFound: 0,
        invisibleCharactersFound: 0,
        suspiciousCharactersFound: 0
      },
      detectedWatermarks: [],
      analysis: {
        hasControlCharacters: false,
        hasInvisibleCharacters: false,
        hasSuspiciousSpacing: false,
        suspiciousPatterns: []
      }
    };
  }

  const original = text;
  const originalLength = text.length;
  
  // Detailed character analysis
  const charCounts = {};
  const characterTypes = {
    control: 0,
    invisible: 0,
    suspicious: 0,
    spacing: 0
  };
  
  let totalRemoved = 0;
  let cleanedText = '';
  
  // Process each character
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charCode = char.charCodeAt(0);
    
    if (isWatermarkCharacter(char)) {
      // Count the watermark character
      if (!charCounts[char]) {
        charCounts[char] = 0;
      }
      charCounts[char]++;
      totalRemoved++;
      
      // Categorize the character type
      if (charCode <= 0x001F || (charCode >= 0x007F && charCode <= 0x009F)) {
        characterTypes.control++;
      } else if (isInvisibleCharacter(char)) {
        characterTypes.invisible++;
      } else if (isSuspiciousSpacing(char)) {
        characterTypes.spacing++;
      } else {
        characterTypes.suspicious++;
      }
      
      // Replace with regular space for most cases, remove completely for zero-width
      if (isZeroWidthCharacter(char)) {
        // Don't add anything for zero-width characters
        continue;
      } else {
        cleanedText += ' ';
      }
    } else {
      cleanedText += char;
    }
  }
  
  // Normalize spaces (collapse multiple spaces into one, preserve line breaks)
  cleanedText = cleanedText
    .replace(/[ \t]+/g, ' ') // Collapse horizontal spaces
    .replace(/\n\s+/g, '\n') // Remove spaces after line breaks
    .replace(/\s+\n/g, '\n') // Remove spaces before line breaks
    .trim();
  
  // Format detected watermarks for response
  const detectedWatermarks = Object.entries(charCounts).map(([char, count]) => ({
    character: getVisibleRepresentation(char),
    unicodePoint: `U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`,
    name: getCharacterName(char),
    count,
    category: categorizeCharacter(char)
  }));
  
  // Sort by count (most frequent first)
  detectedWatermarks.sort((a, b) => b.count - a.count);
  
  // Advanced analysis
  const analysis = performAdvancedAnalysis(original, detectedWatermarks);
  
  return {
    original,
    cleaned: cleanedText,
    stats: {
      originalLength,
      cleanedLength: cleanedText.length,
      charactersRemoved: totalRemoved,
      watermarksDetected: totalRemoved > 0,
      controlCharactersFound: characterTypes.control,
      invisibleCharactersFound: characterTypes.invisible,
      suspiciousCharactersFound: characterTypes.suspicious,
      spacingCharactersFound: characterTypes.spacing,
      compressionRatio: originalLength > 0 ? ((originalLength - cleanedText.length) / originalLength * 100).toFixed(2) : 0
    },
    detectedWatermarks,
    analysis
  };
}

/**
 * Checks if a character is invisible/zero-width
 */
function isInvisibleCharacter(char) {
  const invisibleChars = [
    '\u200B', '\u200C', '\u200D', '\u200E', '\u200F',
    '\u202A', '\u202B', '\u202C', '\u202D', '\u202E',
    '\u2060', '\u2061', '\u2062', '\u2063', '\u2064',
    '\u206A', '\u206B', '\u206C', '\u206D', '\u206E', '\u206F',
    '\uFEFF', '\u061C', '\u034F'
  ];
  return invisibleChars.includes(char);
}

/**
 * Checks if a character is zero-width
 */
function isZeroWidthCharacter(char) {
  const zeroWidthChars = [
    '\u200B', '\u200C', '\u200D', '\u200E', '\u200F',
    '\u202A', '\u202B', '\u202C', '\u202D', '\u202E',
    '\u2060', '\u2061', '\u2062', '\u2063', '\u2064',
    '\uFEFF', '\u061C', '\u034F'
  ];
  return zeroWidthChars.includes(char);
}

/**
 * Checks if a character is suspicious spacing
 */
function isSuspiciousSpacing(char) {
  const spacingChars = [
    '\u00A0', '\u202F', '\u2003', '\u2002', '\u2004',
    '\u2005', '\u2006', '\u2007', '\u2008', '\u2009',
    '\u200A', '\u205F', '\u3000'
  ];
  return spacingChars.includes(char);
}

/**
 * Categorizes a character by type
 */
function categorizeCharacter(char) {
  const charCode = char.charCodeAt(0);
  
  if (charCode <= 0x001F || (charCode >= 0x007F && charCode <= 0x009F)) {
    return 'Control Character';
  } else if (isInvisibleCharacter(char)) {
    return 'Invisible Character';
  } else if (isSuspiciousSpacing(char)) {
    return 'Suspicious Spacing';
  } else {
    return 'Other Suspicious';
  }
}

/**
 * Creates a visible representation of a character for display
 */
function getVisibleRepresentation(char) {
  const code = char.charCodeAt(0);
  
  if (code < 32 || code === 127 || isInvisibleCharacter(char)) {
    return `<U+${code.toString(16).toUpperCase().padStart(4, '0')}>`;
  } else if (char === ' ') {
    return '<SPACE>';
  } else if (char === '\u00A0') {
    return '<NBSP>';
  } else {
    return char;
  }
}

/**
 * Performs advanced analysis on the text
 */
function performAdvancedAnalysis(text, detectedWatermarks) {
  const analysis = {
    hasControlCharacters: false,
    hasInvisibleCharacters: false,
    hasSuspiciousSpacing: false,
    suspiciousPatterns: [],
    confidence: 'low'
  };
  
  // Check for different types of watermarks
  detectedWatermarks.forEach(wm => {
    switch (wm.category) {
      case 'Control Character':
        analysis.hasControlCharacters = true;
        break;
      case 'Invisible Character':
        analysis.hasInvisibleCharacters = true;
        break;
      case 'Suspicious Spacing':
        analysis.hasSuspiciousSpacing = true;
        break;
    }
  });
  
  // Detect suspicious patterns
  if (detectedWatermarks.length > 0) {
    const totalWatermarks = detectedWatermarks.reduce((sum, wm) => sum + wm.count, 0);
    const textLength = text.length;
    const watermarkDensity = (totalWatermarks / textLength) * 100;
    
    if (watermarkDensity > 5) {
      analysis.suspiciousPatterns.push('High watermark density detected');
      analysis.confidence = 'high';
    } else if (watermarkDensity > 1) {
      analysis.confidence = 'medium';
    }
    
    // Check for repeating patterns
    const uniqueWatermarks = detectedWatermarks.length;
    if (uniqueWatermarks > 5) {
      analysis.suspiciousPatterns.push('Multiple watermark types detected');
    }
    
    // Check for invisible character clusters
    if (analysis.hasInvisibleCharacters && detectedWatermarks.some(wm => wm.count > 10)) {
      analysis.suspiciousPatterns.push('Clustered invisible characters detected');
    }
  }
  
  return analysis;
}

/**
 * Counts occurrences of a character in a string (optimized)
 */
function countOccurrences(text, char) {
  let count = 0;
  let index = text.indexOf(char);
  
  while (index !== -1) {
    count++;
    index = text.indexOf(char, index + 1);
  }
  
  return count;
}