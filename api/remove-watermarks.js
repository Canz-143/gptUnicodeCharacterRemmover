// Vercel serverless function for watermark removal
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Check for valid method
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Only POST requests are supported for this endpoint',
      allowedMethods: ['POST'],
    });
  }

  try {
    // Parse request body
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
        });
      }
    }

    // Validate input
    if (!body || body.text === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        message: 'The "text" field is required in the request body',
      });
    }

    if (typeof body.text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        message: 'The "text" field must be a string',
      });
    }

    // Process text and remove watermarks
    const result = removeWatermarks(body.text);
    
    // Return comprehensive response
    return res.status(200).json({
      success: true,
      original: result.original,
      cleaned: result.cleaned,
      stats: result.stats,
      detectedWatermarks: result.detectedWatermarks,
      analysis: result.analysis,
      metadata: {
        processingTime: new Date().toISOString(),
        apiVersion: '2.0',
        detectionMethod: 'comprehensive-unicode',
        totalCharactersAnalyzed: result.original.length,
        confidenceLevel: result.analysis.confidence
      },
      recommendations: generateRecommendations(result)
    });
  } catch (error) {
    console.error('Error processing request:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while processing your request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

// Enhanced watermark character detection with comprehensive Unicode support
const WATERMARK_CHARACTERS = {
  // Control Characters (0x00-0x1F, 0x7F-0x9F)
  '\u0000': 'NULL',
  '\u0001': 'START OF HEADING',
  '\u0002': 'START OF TEXT',
  '\u0003': 'END OF TEXT',
  '\u0004': 'END OF TRANSMISSION',
  '\u0005': 'ENQUIRY',
  '\u0006': 'ACKNOWLEDGE',
  '\u0007': 'BELL',
  '\u0008': 'BACKSPACE',
  '\u000B': 'LINE TABULATION',
  '\u000C': 'FORM FEED',
  '\u000E': 'SHIFT OUT',
  '\u000F': 'SHIFT IN',
  '\u0010': 'DATA LINK ESCAPE',
  '\u0011': 'DEVICE CONTROL ONE',
  '\u0012': 'DEVICE CONTROL TWO',
  '\u0013': 'DEVICE CONTROL THREE',
  '\u0014': 'DEVICE CONTROL FOUR',
  '\u0015': 'NEGATIVE ACKNOWLEDGE',
  '\u0016': 'SYNCHRONOUS IDLE',
  '\u0017': 'END OF TRANSMISSION BLOCK',
  '\u0018': 'CANCEL',
  '\u0019': 'END OF MEDIUM',
  '\u001A': 'SUBSTITUTE',
  '\u001B': 'ESCAPE',
  '\u001C': 'INFORMATION SEPARATOR FOUR',
  '\u001D': 'INFORMATION SEPARATOR THREE',
  '\u001E': 'INFORMATION SEPARATOR TWO',
  '\u001F': 'INFORMATION SEPARATOR ONE',
  '\u007F': 'DELETE',
  '\u0080': 'PADDING CHARACTER',
  '\u0081': 'HIGH OCTET PRESET',
  '\u0082': 'BREAK PERMITTED HERE',
  '\u0083': 'NO BREAK HERE',
  '\u0084': 'INDEX',
  '\u0085': 'NEXT LINE',
  '\u0086': 'START OF SELECTED AREA',
  '\u0087': 'END OF SELECTED AREA',
  '\u0088': 'CHARACTER TABULATION SET',
  '\u0089': 'CHARACTER TABULATION WITH JUSTIFICATION',
  '\u008A': 'LINE TABULATION SET',
  '\u008B': 'PARTIAL LINE FORWARD',
  '\u008C': 'PARTIAL LINE BACKWARD',
  '\u008D': 'REVERSE LINE FEED',
  '\u008E': 'SINGLE SHIFT TWO',
  '\u008F': 'SINGLE SHIFT THREE',
  '\u0090': 'DEVICE CONTROL STRING',
  '\u0091': 'PRIVATE USE ONE',
  '\u0092': 'PRIVATE USE TWO',
  '\u0093': 'SET TRANSMIT STATE',
  '\u0094': 'CANCEL CHARACTER',
  '\u0095': 'MESSAGE WAITING',
  '\u0096': 'START OF GUARDED AREA',
  '\u0097': 'END OF GUARDED AREA',
  '\u0098': 'START OF STRING',
  '\u0099': 'SINGLE GRAPHIC CHARACTER INTRODUCER',
  '\u009A': 'SINGLE CHARACTER INTRODUCER',
  '\u009B': 'CONTROL SEQUENCE INTRODUCER',
  '\u009C': 'STRING TERMINATOR',
  '\u009D': 'OPERATING SYSTEM COMMAND',
  '\u009E': 'PRIVACY MESSAGE',
  '\u009F': 'APPLICATION PROGRAM COMMAND',
  
  // Watermark Characters
  '\u00A0': 'NO-BREAK SPACE',
  '\u00AD': 'SOFT HYPHEN',
  '\u00B7': 'MIDDLE DOT',
  '\u180E': 'MONGOLIAN VOWEL SEPARATOR',
  '\u200B': 'ZERO WIDTH SPACE',
  '\u200C': 'ZERO WIDTH NON-JOINER',
  '\u200D': 'ZERO WIDTH JOINER',
  '\u200E': 'LEFT-TO-RIGHT MARK',
  '\u200F': 'RIGHT-TO-LEFT MARK',
  '\u2028': 'LINE SEPARATOR',
  '\u2029': 'PARAGRAPH SEPARATOR',
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
  '\u2003': 'EM SPACE',
  '\u2002': 'EN SPACE',
  '\u2004': 'THREE-PER-EM SPACE',
  '\u2005': 'FOUR-PER-EM SPACE',
  '\u2006': 'SIX-PER-EM SPACE',
  '\u2007': 'FIGURE SPACE',
  '\u2008': 'PUNCTUATION SPACE',
  '\u2009': 'THIN SPACE',
  '\u200A': 'HAIR SPACE',
  '\u2014': 'EM DASH',
  '\u2013': 'EN DASH',
  '\u034F': 'COMBINING GRAPHEME JOINER',
  '\u115F': 'HANGUL CHOSEONG FILLER',
  '\u1160': 'HANGUL JUNGSEONG FILLER',
  '\u17B4': 'KHMER VOWEL INHERENT AQ',
  '\u17B5': 'KHMER VOWEL INHERENT AA',
  '\u3164': 'HANGUL FILLER',
  '\uFFA0': 'HALFWIDTH HANGUL FILLER'
};

// Characters that should be preserved (normal spaces and line breaks)
const PRESERVE_CHARACTERS = new Set([
  '\u0020', // SPACE
  '\u000A', // LINE FEED
  '\u000D', // CARRIAGE RETURN
  '\u0009'  // TAB
]);

// Function to check if a character is a watermark
function isWatermarkCharacter(char) {
  return WATERMARK_CHARACTERS.hasOwnProperty(char) && !PRESERVE_CHARACTERS.has(char);
}

// Function to get character name
function getCharacterName(char) {
  return WATERMARK_CHARACTERS[char] || `UNKNOWN CHARACTER (U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')})`;
}

/**
 * Removes ChatGPT watermark characters from text with enhanced detection
 */
function removeWatermarks(text) {
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
        suspiciousCharactersFound: 0,
        spacingCharactersFound: 0,
        compressionRatio: 0
      },
      detectedWatermarks: [],
      analysis: {
        hasControlCharacters: false,
        hasInvisibleCharacters: false,
        hasSuspiciousSpacing: false,
        suspiciousPatterns: [],
        confidence: 'low'
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
      compressionRatio: originalLength > 0 ? parseFloat(((originalLength - cleanedText.length) / originalLength * 100).toFixed(2)) : 0
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
 * Generates recommendations based on the analysis results
 */
function generateRecommendations(result) {
  const recommendations = [];
  
  if (result.stats.watermarksDetected) {
    recommendations.push('Watermarks were detected and removed from your text.');
    
    if (result.analysis.hasInvisibleCharacters) {
      recommendations.push('Invisible characters were found - these are commonly used for text watermarking.');
    }
    
    if (result.analysis.hasControlCharacters) {
      recommendations.push('Control characters were detected - these may indicate advanced watermarking techniques.');
    }
    
    if (result.analysis.hasSuspiciousSpacing) {
      recommendations.push('Suspicious spacing characters were found - these can be used to embed hidden information.');
    }
    
    if (result.analysis.confidence === 'high') {
      recommendations.push('High confidence watermark detection - the text likely contained AI-generated watermarks.');
    }
    
    if (result.stats.compressionRatio > 5) {
      recommendations.push(`Text size reduced by ${result.stats.compressionRatio}% - significant watermark presence detected.`);
    }
  } else {
    recommendations.push('No watermarks detected in the provided text.');
  }
  
  return recommendations;
}
