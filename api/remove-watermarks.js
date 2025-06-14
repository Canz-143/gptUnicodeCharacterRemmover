// Enhanced API handler for comprehensive watermark removal
import { validateInput } from '../src/validators/inputValidator';
import { removeWatermarks } from '../src/utils/watermarkUtils';
import { handleCors } from '../src/utils/corsHandler';

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) {
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
    // Parse request body if it's a string
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
    const { isValid, error, text } = validateInput(body);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        message: error,
      });
    }

    // Process text and remove watermarks with enhanced detection
    const result = removeWatermarks(text);
    
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